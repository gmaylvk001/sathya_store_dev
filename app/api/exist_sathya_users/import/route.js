import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import ExistSathyaUser, { ensureExistSathyaUserIndexes } from "@/models/ExistSathyaUser";

function emptyToNull(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }
  return String(value).trim();
}

function excelSerialToDate(serial) {
  const n = Number(serial);
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  const date = new Date(Math.round((n - 25569) * 86400 * 1000));
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseLoggedInDate(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    return excelSerialToDate(value);
  }

  const text = String(value).trim();
  if (!text) {
    return null;
  }

  if (/^\d+(\.\d+)?$/.test(text)) {
    return excelSerialToDate(text);
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseExistId(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  const text = String(value).trim();
  return text === "" ? null : text;
}

function getCell(row, keys) {
  for (const key of keys) {
    const match = Object.keys(row).find(
      (header) => header.toLowerCase().trim().replace(/\s+/g, "_") === key
    );
    if (match !== undefined && row[match] !== undefined && row[match] !== null) {
      return row[match];
    }
  }
  return "";
}

async function resolvePassword(rawPassword) {
  const password = emptyToNull(rawPassword);
  if (!password) {
    return null;
  }
  if (password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$")) {
    return password;
  }
  return bcrypt.hash(password, 10);
}

export async function POST(req) {
  try {
    await dbConnect();
    await ensureExistSathyaUserIndexes();

    const formData = await req.formData();
    const file = formData.get("excel") || formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileName = (file.name || "").toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".csv")) {
      return NextResponse.json({ error: "Only .xlsx and .csv files are allowed" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = fileName.endsWith(".csv")
      ? XLSX.read(buffer.toString("utf-8"), { type: "string", cellDates: true })
      : XLSX.read(buffer, { type: "buffer", cellDates: true });

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json({ error: "File has no sheets" }, { status: 400 });
    }

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
    if (!rows.length) {
      return NextResponse.json({ error: "File has no data rows" }, { status: 400 });
    }

    let addedCount = 0;
    let skippedCount = 0;
    let skippedExistingCount = 0;
    const errors = [];
    const skippedEmails = [];

    const existingEmails = new Set(
      (await ExistSathyaUser.find({}, { email: 1 }).lean())
        .map((user) => String(user.email || "").trim().toLowerCase())
        .filter(Boolean)
    );
    const emailsInFile = new Set();

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const excelRow = index + 2;

      const first_name = emptyToNull(getCell(row, ["first_name"]));
      const emailRaw = emptyToNull(getCell(row, ["email"]));
      const email = emailRaw ? String(emailRaw).trim().toLowerCase() : null;
      const phone = String(getCell(row, ["phone"])).trim();
      const rawPassword = getCell(row, ["password"]);

      if (!phone) {
        skippedCount += 1;
        errors.push({
          row: excelRow,
          error: "phone is required",
        });
        continue;
      }

      if (email && (existingEmails.has(email) || emailsInFile.has(email))) {
        skippedCount += 1;
        skippedExistingCount += 1;
        skippedEmails.push({ row: excelRow, email });
        continue;
      }

      if (email) {
        emailsInFile.add(email);
      }

      const hashedPassword = await resolvePassword(rawPassword);

      const confirmedValue = emptyToNull(getCell(row, ["confirmed"]));
      const notifyStatusValue = emptyToNull(getCell(row, ["notify_status"]));

      try {
        await ExistSathyaUser.create({
          exist_id: parseExistId(getCell(row, ["exist_id", "id"])),
          first_name,
          last_name: emptyToNull(getCell(row, ["last_name"])),
          store_id: emptyToNull(getCell(row, ["store_id"])),
          role_id: emptyToNull(getCell(row, ["role_id"])),
          zone_id: emptyToNull(getCell(row, ["zone_id"])),
          email,
          phone,
          password: hashedPassword,
          remember_token: emptyToNull(getCell(row, ["remember_token"])),
          confirmed: confirmedValue === null ? null : Number(confirmedValue),
          confirmation_code: emptyToNull(getCell(row, ["confirmation_code"])),
          provider: emptyToNull(getCell(row, ["provider"])),
          provider_id: emptyToNull(getCell(row, ["provider_id"])),
          avatar: emptyToNull(getCell(row, ["avatar"])),
          avatar_original: emptyToNull(getCell(row, ["avatar_original"])),
          notify_pincode: emptyToNull(getCell(row, ["notify_pincode"])),
          notify_status: notifyStatusValue === null ? 0 : Number(notifyStatusValue),
          logged_in: parseLoggedInDate(getCell(row, ["logged_in"])),
        });
        addedCount += 1;
        if (email) {
          existingEmails.add(email);
        }
      } catch (error) {
        skippedCount += 1;
        if (email) {
          emailsInFile.delete(email);
        }
        if (error.code === 11000) {
          skippedExistingCount += 1;
          skippedEmails.push({ row: excelRow, email });
        } else {
          errors.push({
            row: excelRow,
            error: error.message,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed. Added ${addedCount}, skipped existing emails ${skippedExistingCount}, other skipped ${skippedCount - skippedExistingCount}.`,
      addedCount,
      skippedCount,
      skippedExistingCount,
      skippedEmails,
      errors,
    });
  } catch (error) {
    console.error("Exist sathya users import error:", error);
    return NextResponse.json({ error: "Import failed", details: error.message }, { status: 500 });
  }
}
