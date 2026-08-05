// app/api/product/[slug]/route.js
import dbConnect from "@/lib/db";
import Product from "@/models/product";

export async function GET(request, context) {
  const { params } = await context;
  const { slug } = await params;
  await dbConnect();

  if (!slug) {
    return new Response(JSON.stringify({ message: "Missing product slug" }), {
      status: 400,
    });
  }

  try {
    // const product = await Product.findOne({ slug });
    const product = await Product.findOne({ 
      slug, 
      status: "Active" // ✅ Only return active products
    })

    if (!product) {
      return new Response(JSON.stringify({ message: "Product not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(product), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), {
      status: 500,
    });
  }
}
