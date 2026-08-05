
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";

export async function POST(req) {
    const formData = await req.formData();
    console.log(formData);
    const imageFiles = formData.getAll("image");
    const savedImages = [];
    if (!imageFiles.length) {
            return NextResponse.json({ error: "No images received" }, { status: 400 });
        }
        const uploadDir = path.join(process.cwd(), "public/uploads/products");
        if (!fs.existsSync(uploadDir)) {
            await fs.promises.mkdir(uploadDir, { recursive: true });
        }
        for (const file of imageFiles) {
          if (!file || typeof file.name !== "string") {
              console.error("Invalid file received:", file);
              continue;
          }
          const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
          const filePath = path.join(uploadDir, filename);
          const buffer = Buffer.from(await file.arrayBuffer());
          await writeFile(filePath, buffer);
          savedImages.push(`/uploads/products/${filename}`);
        }
        return NextResponse.json({ savedImages },{status : 200}); 
}
