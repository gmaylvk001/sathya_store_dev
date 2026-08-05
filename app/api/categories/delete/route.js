import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Category from "@/models/ecom_category_info"; // Adjust the path based on your structure

export async function POST(req) {
    await dbConnect();

    try {
        const { categoryId } = await req.json();

        // Find the category to be deleted
        const category = await Category.findById(categoryId);
        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        // Delete all subcategories where parentid matches the category's name
        await Category.deleteMany({ parentid: category.category_name });

        // Delete the main category itself
        await Category.findByIdAndDelete(categoryId);

        return NextResponse.json({ success: true, message: "Category and subcategories set to inactive" });
    } catch (error) {
        console.error("Error updating category:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
