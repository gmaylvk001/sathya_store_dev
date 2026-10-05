import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import dbConnect from "@/lib/db";
import OwnerProduct from "@/models/OwnerProduct";
import Product from "@/models/product";

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * POST /apis/unilet_stock_update
 * Inbound API endpoint for Unilet ERP to push inventory/stock updates.
 * Updates OwnerProduct.stock and OwnerProduct.stock_status mapped by vendor_item_code or product_item_code.
 */
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    const expectedToken =
      process.env.UNILET_API_TOKEN ||
      process.env.MY_SECRET_TOKEN ||
      "HziubjPvy1BDc2FQQxO97u4dFD6UgN82GOfUf2w8mq5EuN1F47";

    if (body.api_token && expectedToken && body.api_token !== expectedToken) {
      return NextResponse.json({ error: "Invalid API token" }, { status: 401 });
    }

    // Save audit log to public/uploads/unilet_stock
    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "unilet_stock");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filename = `stock_${Date.now()}.json`;
      fs.writeFileSync(path.join(uploadDir, filename), JSON.stringify(body, null, 2));
    } catch (logErr) {
      console.warn("[unilet_stock_update] Could not save upload log:", logErr.message);
    }

    const items =
      body.data ||
      body.sku ||
      body.products ||
      body.items ||
      (Array.isArray(body) ? body : null);

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid payload format. Expected array of items in 'data' or 'sku'." },
        { status: 400 }
      );
    }

    let updatedCount = 0;
    let createdCount = 0;
    const errors = [];

    for (const item of items) {
      try {
        const vendorCode = String(
          item.vendor_item_code ||
          item.VendorItemCode ||
          item.ItemCode ||
          item.item_code ||
          item.sku ||
          ""
        ).trim();

        const sathyaCode = String(
          item.product_item_code ||
          item.sathya_item_code ||
          item.ProductItemCode ||
          ""
        ).trim();

        if (!vendorCode && !sathyaCode) {
          continue;
        }

        const rawQty = item.totalQty ?? item.quantity ?? item.stock ?? item.TotalQty;
        const totalQty = rawQty != null ? parseFloat(rawQty) : 0;
        const finalStock = isNaN(totalQty) ? 0 : Math.max(0, totalQty);
        const stockStatus = finalStock > 0 ? "In Stock" : "Out of Stock";

        // 1. Try finding existing OwnerProduct by vendor_item_code
        let ownerProduct = null;
        if (vendorCode) {
          ownerProduct = await OwnerProduct.findOne({
            owner_id: "unilet",
            vendor_item_code: vendorCode,
          });
        }

        // 2. Try by product_item_code
        if (!ownerProduct && sathyaCode) {
          ownerProduct = await OwnerProduct.findOne({
            owner_id: "unilet",
            product_item_code: sathyaCode,
          });
        }

        // 3. Fallback: try vendorCode matching product_item_code
        if (!ownerProduct && vendorCode) {
          ownerProduct = await OwnerProduct.findOne({
            owner_id: "unilet",
            product_item_code: vendorCode,
          });
        }

        if (ownerProduct) {
          ownerProduct.stock = finalStock;
          ownerProduct.stock_status = stockStatus;
          if (vendorCode && !ownerProduct.vendor_item_code) {
            ownerProduct.vendor_item_code = vendorCode;
          }
          await ownerProduct.save();
          updatedCount++;
        } else {
          // If no OwnerProduct, check if Sathya product exists to create entry
          const product = await Product.findOne({
            item_code: sathyaCode || vendorCode,
          });

          if (product) {
            await OwnerProduct.create({
              owner_id: "unilet",
              product_id: product._id,
              product_item_code: product.item_code,
              vendor_item_code: vendorCode || `${product.item_code}_U`,
              vendor_product_name: product.name,
              price: product.price || 0,
              offer_price: product.special_price || 0,
              stock: finalStock,
              stock_status: stockStatus,
              region: "karnataka",
              is_active: true,
              delivery_days: 1,
            });
            createdCount++;
          }
        }
      } catch (itemErr) {
        errors.push({ item, error: itemErr.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Unilet stock update processed successfully",
      updated: updatedCount,
      created: createdCount,
      total_received: items.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (error) {
    console.error("[unilet_stock_update] Error:", error);
    return NextResponse.json(
      { error: "Failed to process Unilet stock update: " + error.message },
      { status: 500 }
    );
  }
}
