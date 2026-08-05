// app/api/categories/update-position/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Category from "@/models/ecom_category_info";

export async function POST(request) {
  try {
    await dbConnect();
    
    const { categories } = await request.json();
    
    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json(
        { error: "Categories array is required" },
        { status: 400 }
      );
    }
    
    // Update each category's position using bulk operations for better performance
    const bulkOps = categories.map(category => ({
      updateOne: {
        filter: { _id: category._id },
        update: { 
          $set: { 
            position: category.position,
            updatedAt: new Date()
          }
        }
      }
    }));
    
    // Execute all updates in a single operation
    const result = await Category.bulkWrite(bulkOps);
    
    return NextResponse.json(
     
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating category positions:", error);
    return NextResponse.json(
      { error: "Failed to update category positions: " + error.message },
      { status: 500 }
    );
  }
}