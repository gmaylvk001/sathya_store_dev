import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Brand from "@/models/ecom_brand_info";
import Product from "@/models/product";
import { requireAdmin } from "@/lib/adminRequest";

export async function POST(req) {
    try {
        const auth = await requireAdmin(req, "brands");
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        await dbConnect();
        const { brandId } = await req.json();
    
        if (!brandId) {
            return NextResponse.json({ error: "Brand ID is required" }, { status: 400 });
        }

        // Get product count with this brand
        const productCount = await Product.countDocuments({ brand: brandId });
        
        if (productCount > 0) {
            return NextResponse.json(
                { 
                    error: "Cannot delete brand as it has associated products.",
                    hasProducts: true,
                    productCount 
                }, 
                { status: 400 }
            );
        }

        const brand = await Brand.findByIdAndDelete(brandId);
        if (!brand) {
            return NextResponse.json({ error: "Brand not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Brand deleted successfully" });
    } catch (error) {
        console.error("Error deleting Brand:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}