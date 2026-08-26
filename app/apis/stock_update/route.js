import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';

import Product from "@/models/product";
import Brand from "@/models/ecom_brand_info";
import Product_all from "@/models/Product_all";
import md5 from "md5";
import ProductStore from '@/models/product_store';
import ZTrackApi from '@/models/z_track_api';
export const config = {
  api: {
    bodyParser: false,
  },
};

/* stock_update */
export async function POST(req) {
  try {
    const body = await req.json();
    const API_SECRET = process.env.MY_SECRET_TOKEN;
    //const API_SECRET = 'HziubjPvy1BDc2FQQxO97u4dFD6UgN82GOfUf2w8mq5EuN1F47';

    if (API_SECRET !== body.api_token) {
      return NextResponse.json({ error: 'Invalid API token' }, { status: 401 });
    }

    const filePath = path.join(process.cwd(), 'public', 'uploads', 'stock_update');
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, { recursive: true });
    }

    const filename = `stock_${Date.now()}.json`;
    fs.writeFileSync(path.join(filePath, filename), JSON.stringify(body, null, 2));

     const data = body.data;

    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid payload format' }, { status: 400 });
    }
    const allStoreKeys = new Set();
    for (const item of data) {
      for (const sku of item.sku) {
        allStoreKeys.add(sku.store);
      }
    }

    // Process each item
    for (const item of data) {
      const itemCode = item.ItemCode;
      const totalQty = parseFloat(item.totalQty);
      const productStock = {};


      // Fill in actual quantities
      for (const sku of item.sku) {
        const storeKey = sku.store;
        const quantity = parseFloat(sku.quantity);
        productStock[storeKey] = quantity;
      }

      productStock.item_code = itemCode;

      // Update or insert in product_store
      const existingStore = await ProductStore.findOne({ item_code: itemCode });
      if (existingStore) {
        await ProductStore.updateOne({ item_code: itemCode }, { $set: productStock });
      } else {
        await ProductStore.create(productStock);
      }

      await Product.updateOne(
        { item_code: itemCode },
        { $set: { quantity: totalQty } },
        { upsert: false }
      );
    }

    await ZTrackApi.create({ type: 'Delta_update' });

    return NextResponse.json({
      message: 'Stock stored successfully',
    });
  } catch (error) {
    console.error('Sap stock file upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload: ' + error.message },
      { status: 500 }
    );
  }
}