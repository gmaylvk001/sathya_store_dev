import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import VideoCard from "@/models/VideoCard";
import fs from "fs";
import path from "path";
import sharp from "sharp";

// Save File Function with Dimension Validation
// Save File Function (accepts any image size)
async function saveFile(file) {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "videocard");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = Date.now() + "-" + file.name.replace(/\s/g, "_");
    const filepath = path.join(uploadDir, filename);

    // just save the file as it is (no size validation)
    await sharp(buffer).toFile(filepath);

    return "/uploads/videocard/" + filename;
  } catch (err) {
    console.error("Save file error:", err);
    throw err;
  }
}


// ✅ GET all video cards
export async function GET() {
  try {
    await dbConnect();
    const videoCards = await VideoCard.find({});
    return NextResponse.json({ success: true, videoCards });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

// ✅ POST add new video card
export async function POST(req) {
  try {
    await dbConnect();
    const formData = await req.formData();

    const thumbnail_image = formData.get("thumbnail_image");
    const title = formData.get("title");
    const video_url = formData.get("video_url");
    const status = formData.get("status") || "Active";

    if (!thumbnail_image || thumbnail_image.size === 0) {
      return NextResponse.json(
        { success: false, message: "Thumbnail image is required" },
        { status: 400 }
      );
    }

    if (!title || !video_url) {
      return NextResponse.json(
        { success: false, message: "Title and Video URL are required" },
        { status: 400 }
      );
    }

    let thumbnailImagePath;
    try {
      thumbnailImagePath = await saveFile(thumbnail_image, 480, 270); // ✅ Example size
    } catch (err) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 400 }
      );
    }

    const newVideoCard = new VideoCard({
      thumbnail_image: thumbnailImagePath,
      title,
      video_url,
      status,
    });

    await newVideoCard.save();

    return NextResponse.json({ success: true, videoCard: newVideoCard });
  } catch (err) {
    console.error("POST ERROR:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

// ✅ PUT update video card
export async function PUT(req) {
  try {
    await dbConnect();
    const formData = await req.formData();

    const id = formData.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Video Card ID is required" },
        { status: 400 }
      );
    }

    const existingVideoCard = await VideoCard.findById(id);
    if (!existingVideoCard) {
      return NextResponse.json(
        { success: false, message: "Video Card not found" },
        { status: 404 }
      );
    }

    let updateData = { updatedAt: new Date() };

    const title = formData.get("title");
    if (title !== null) updateData.title = title;

    const video_url = formData.get("video_url");
    if (video_url !== null) updateData.video_url = video_url;

    const status = formData.get("status");
    if (status !== null) updateData.status = status;

    const thumbnail_image = formData.get("thumbnail_image");
    if (thumbnail_image && thumbnail_image.size > 0) {
      try {
        const thumbnailImagePath = await saveFile(thumbnail_image, 480, 270);
        updateData.thumbnail_image = thumbnailImagePath;

        if (existingVideoCard.thumbnail_image) {
          const oldFilePath = path.join(
            process.cwd(),
            "public",
            existingVideoCard.thumbnail_image
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

    const updatedVideoCard = await VideoCard.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    return NextResponse.json({ success: true, videoCard: updatedVideoCard });
  } catch (err) {
    console.error("PUT ERROR:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

// ✅ DELETE video card
export async function DELETE(req) {
  try {
    await dbConnect();
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Video Card ID is required" },
        { status: 400 }
      );
    }

    const videoCard = await VideoCard.findById(id);
    if (!videoCard) {
      return NextResponse.json(
        { success: false, message: "Video Card not found" },
        { status: 404 }
      );
    }

    // Delete image file
    if (videoCard.thumbnail_image) {
      const filePath = path.join(process.cwd(), "public", videoCard.thumbnail_image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await VideoCard.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Video Card deleted" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
