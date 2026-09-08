import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import ExistSathyaUser from "@/models/ExistSathyaUser";
import ExistSathyaUserDetail from "@/models/ExistSathyaUserDetail";
import User from "@/models/User";

function toOptionalString(value) {
  if (value === undefined || value === null) {
    return null;
  }
  const text = String(value).trim();
  return text === "" ? null : text;
}

function normalizeMobile(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

function toValidDate(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value) && value > 20000 && value < 80000) {
    const excelDate = new Date(Math.round((value - 25569) * 86400 * 1000));
    return Number.isNaN(excelDate.getTime()) ? null : excelDate;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function buildName(existUser) {
  const first = String(existUser.first_name || "").trim();
  if (first) return first;
  return String(existUser.phone || "Exist User").trim();
}

function buildGeneratedPassword(name) {
  const text = String(name || "").trim().toLowerCase();
  const letterMatch = text.match(/[a-z]/);
  const letter = letterMatch ? letterMatch[0] : "u";
  return `${letter}1234567${letter}`;
}

function userIdMatchValues(value) {
  const text = String(value ?? "").trim();
  if (!text) return [];
  const values = new Set([text]);
  if (/^\d+(\.0+)?$/.test(text)) {
    const n = Math.trunc(Number(text));
    values.add(String(n));
    values.add(`${n}.0`);
    values.add(n);
  }
  return [...values];
}

async function mapUserDetailsToLiveUser(existId, liveUserId) {
  const matchValues = userIdMatchValues(existId);
  if (!matchValues.length) {
    return 0;
  }

  const result = await ExistSathyaUserDetail.updateMany(
    { user_id: { $in: matchValues } },
    { $set: { live_user_id: String(liveUserId) } }
  );
  return result.modifiedCount || 0;
}

export async function POST(req) {
  try {
    await dbConnect();
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const existUser = await ExistSathyaUser.findById(id).lean();
    if (!existUser) {
      return NextResponse.json({ error: "Exist user not found" }, { status: 404 });
    }

    const email = toOptionalString(existUser.email) === null
      ? null
      : String(existUser.email).trim().toLowerCase();
    const mobile = normalizeMobile(existUser.phone);
    const existingPassword = toOptionalString(existUser.password);
    const name = buildName(existUser);
    const lastName = toOptionalString(existUser.last_name);
    const userType = String(existUser.role_id ?? "").trim() === "1" ? "admin" : "user";
    const generatedPassword = existingPassword
      ? null
      : buildGeneratedPassword(existUser.first_name || name);
    const password = existingPassword
      ? existingPassword
      : await bcrypt.hash(generatedPassword, 10);

    if (!email) {
      return NextResponse.json({ error: "Email is required to move this user" }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }
    if (!/^\d{10}$/.test(mobile)) {
      return NextResponse.json({ error: "Phone must be a valid 10-digit mobile number" }, { status: 400 });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return NextResponse.json({ error: "This email already exists in Users" }, { status: 400 });
    }

    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) {
      return NextResponse.json({ error: "This mobile number already exists in Users" }, { status: 400 });
    }

    const now = new Date();
    const createdAt = toValidDate(existUser.created_at) || now;
    const updatedAt = toValidDate(existUser.updated_at) || now;

    const extraFields = {
      exist_id: toOptionalString(existUser.exist_id),
      store_id: toOptionalString(existUser.store_id),
      last_name: lastName,
      confirmed: existUser.confirmed === undefined || existUser.confirmed === null || existUser.confirmed === ""
        ? null
        : Number(existUser.confirmed),
      confirmation_code: toOptionalString(existUser.confirmation_code),
      provider: toOptionalString(existUser.provider),
      provider_id: toOptionalString(existUser.provider_id),
      notify_pincode: toOptionalString(existUser.notify_pincode),
      notify_status: existUser.notify_status === undefined || existUser.notify_status === null || existUser.notify_status === ""
        ? null
        : Number(existUser.notify_status),
      logged_in: existUser.logged_in || null,
      zone_id: toOptionalString(existUser.zone_id),
      remember_token: toOptionalString(existUser.remember_token),
      avatar: toOptionalString(existUser.avatar),
      avatar_original: toOptionalString(existUser.avatar_original),
    };

    const created = new User({
      name,
      mobile,
      email,
      password,
      user_type: userType,
      status: "Active",
      role: null,
      ...extraFields,
    });
    await created.save({ timestamps: false });
    await User.collection.updateOne(
      { _id: created._id },
      {
        $set: {
          name,
          last_name: lastName,
          createdAt,
          updatedAt,
          ...extraFields,
        },
      }
    );

    const mappedDetailsCount = await mapUserDetailsToLiveUser(
      existUser.exist_id,
      created._id
    );

    const typeLabel = userType === "admin" ? "admin" : "user";
    const mappedLabel = mappedDetailsCount
      ? ` Mapped ${mappedDetailsCount} user detail row(s).`
      : "";

    return NextResponse.json({
      success: true,
      message: generatedPassword
        ? `User moved successfully as ${typeLabel}. Generated password: ${generatedPassword}.${mappedLabel}`
        : `User moved successfully as ${typeLabel}.${mappedLabel}`,
      user_type: userType,
      userId: created._id,
      generated_password: generatedPassword,
      mapped_details_count: mappedDetailsCount,
    }, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ error: "Email or mobile already exists in Users" }, { status: 400 });
    }
    console.error("Error moving exist sathya user:", error);
    return NextResponse.json({ error: "Failed to move user", message: error.message }, { status: 500 });
  }
}
