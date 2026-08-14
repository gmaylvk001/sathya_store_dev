import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import TopBanner from "@/models/topbanner";
import fs from "fs";
import path from "path";
import sharp from "sharp";

// ✅ Save File Function with Dimension Validation
async function saveFile(file) {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let metadata;
    try {
      metadata = await sharp(buffer).metadata();
    } catch (err) {
      throw new Error("Invalid image file. Please upload a valid image.");
    }

    // if (metadata.width !== 1920 || metadata.height !== 550) {
    //   throw new Error(
    //     `Image must be exactly 1920x550 pixels. Your image is ${metadata.width}x${metadata.height} pixels.`
    //   );
    // }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "topbanner");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = Date.now() + "-" + file.name.replace(/\s/g, "_");
    const filepath = path.join(uploadDir, filename);

    await sharp(buffer).toFile(filepath);

    return "/uploads/topbanner/" + filename;
  } catch (err) {
    console.error("Save file error:", err);
    throw err;
  }
}

// ✅ GET all banners
export async function GET() {
  try {
    await dbConnect();
    const banners = await TopBanner.find({}).sort({ order: 1 }); // 👈 sort by order
    return NextResponse.json({ success: true, banners: banners || [] });
  } catch (err) {
    console.error("Error in GET /api/topbanner:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

// ✅ POST add new banner
export async function POST(req) {
  try {
    await dbConnect();
    const formData = await req.formData();

    const file = formData.get("banner_image");
    const redirect_url = formData.get("redirect_url");
    const status = formData.get("status") || "Active";

    if (!file || file.size === 0) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!redirect_url) {
      return NextResponse.json(
        { success: false, message: "Redirect URL is required" },
        { status: 400 }
      );
    }

    let filePath;
    try {
      filePath = await saveFile(file);
    } catch (err) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 400 }
      );
    }

    // 👇 find max order (1-based)
    const lastBanner = await TopBanner.findOne().sort({ order: -1 });
    const newOrder =
      lastBanner && typeof lastBanner.order === "number" ? lastBanner.order + 1 : 1;

    const newBanner = new TopBanner({
      banner_image: filePath,
      redirect_url,
      status,
      order: newOrder,
    });

    await newBanner.save();

    return NextResponse.json({ success: true, banner: newBanner });
  } catch (err) {
    console.error("POST ERROR:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

// ✅ PUT update banner (unchanged except we don't touch order)
export async function PUT(req) {
  try {
    await dbConnect();
    const formData = await req.formData();

    const id = formData.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Banner ID is required" },
        { status: 400 }
      );
    }

    const existingBanner = await TopBanner.findById(id);
    if (!existingBanner) {
      return NextResponse.json(
        { success: false, message: "Banner not found" },
        { status: 404 }
      );
    }

    let updateData = { updatedAt: new Date() };

    const redirect_url = formData.get("redirect_url");
    if (redirect_url !== null) updateData.redirect_url = redirect_url;

    const status = formData.get("status");
    if (status !== null) updateData.status = status;

    const file = formData.get("banner_image");
    if (file && file.size > 0) {
      try {
        const filePath = await saveFile(file);
        updateData.banner_image = filePath;

        if (existingBanner.banner_image) {
          const oldFilePath = path.join(
            process.cwd(),
            "public",
            existingBanner.banner_image
          );
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
      } catch (err) {
        return NextResponse.json(
          { success: false, message: err.message },
          { status: 400 }
        );
      }
    }

    const updatedBanner = await TopBanner.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    return NextResponse.json({ success: true, banner: updatedBanner });
  } catch (err) {
    console.error("PUT ERROR:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

// ✅ PATCH reorder banners (bulk update, 1-based)
export async function PATCH(req) {
  try {
    await dbConnect();
    const { orderedIds } = await req.json();

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { success: false, message: "orderedIds must be an array" },
        { status: 400 }
      );
    }

    await TopBanner.bulkWrite(
      orderedIds.map((id, i) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { order: i + 1 } },
        },
      }))
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

// ✅ DELETE banner (unchanged)
export async function DELETE(req) {
  try {
    await dbConnect();
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Banner ID is required" },
        { status: 400 }
      );
    }

    const banner = await TopBanner.findById(id);
    if (!banner) {
      return NextResponse.json(
        { success: false, message: "Banner not found" },
        { status: 404 }
      );
    }

    if (banner.banner_image) {
      const filePath = path.join(process.cwd(), "public", banner.banner_image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await TopBanner.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Banner deleted" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
