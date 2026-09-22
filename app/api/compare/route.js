// app/api/compare/route.js
//
// GET  — fetch the logged-in user's compare list (with populated product data)
// POST — add a product to the compare list (validates max-4 + same-category)
//
// Auth: Bearer JWT via Authorization header → jwt.verify → decoded.userId
// Matches the exact pattern used by /api/wishlist/route.js

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import Compare from '@/models/Compare';
import Product from '@/models/product';

// ─── Helper: extract & verify JWT ────────────────────────────────────────────

function getUserIdFromRequest(req) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch {
    return null;
  }
}

// ─── Helper: fetch the user's full compare list with populated product data ──

async function fetchCompareList(userId) {
  let items = await Compare.find({ userId })
    .sort({ added_at: 1 })          // stable order: oldest first
    .populate('productId')           // join live product data from Product collection
    .lean();

  // Gracefully handle deleted products — keep the entry but mark productData null
  return items.map((item) => ({
    _id:           item._id,
    productId:     item.productId?._id || item.productId,
    category_slug: item.category_slug,
    added_at:      item.added_at,
    // productData is null if the product was deleted from the Product collection
    productData:   item.productId && item.productId._id ? item.productId : null,
  }));
}

// ─── GET: return user's compare list ─────────────────────────────────────────

export async function GET(req) {
  try {
    await dbConnect();

    const userId = getUserIdFromRequest(req);
    if (!userId) {
      // Return empty list for unauthenticated requests (guest state is localStorage-only)
      return NextResponse.json({ items: [], count: 0 }, { status: 200 });
    }

    const items = await fetchCompareList(userId);
    return NextResponse.json({ items, count: items.length }, { status: 200 });

  } catch (error) {
    console.error('[/api/compare GET]', error.message);
    return NextResponse.json({ items: [], count: 0 }, { status: 200 });
  }
}

// ─── POST: add a product to the compare list ─────────────────────────────────

export async function POST(req) {
  try {
    await dbConnect();

    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    // Fetch the live product to get its category_slug and validate it exists
    const product = await Product.findById(productId).select('_id category_new name').lean();
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    const category_slug = product.category_new || '';

    // ── Server-side validation 1: max 4 items ──────────────────────────────
    const count = await Compare.countDocuments({ userId });
    if (count >= 4) {
      return NextResponse.json(
        { error: 'Compare list is full. Remove an item to add a new one.' },
        { status: 400 }
      );
    }

    // ── Server-side validation 2: same category only ───────────────────────
    // Check if there is already at least one item in the user's compare list.
    // If so, its category_slug must match the incoming product's category_slug.
    if (count > 0) {
      const existingItem = await Compare.findOne({ userId }).select('category_slug').lean();
      if (
        existingItem &&
        existingItem.category_slug &&
        category_slug &&
        existingItem.category_slug !== category_slug
      ) {
        return NextResponse.json(
          {
            error: `You can only compare products from the same category. Your current list contains "${existingItem.category_slug}" products.`,
          },
          { status: 400 }
        );
      }
    }

    // ── Insert (upsert-style: silently ignore if already exists) ───────────
    try {
      await Compare.create({ userId, productId, category_slug });
    } catch (err) {
      // Code 11000 = duplicate key — product already in compare list; not an error
      if (err.code !== 11000) throw err;
    }

    const items = await fetchCompareList(userId);
    return NextResponse.json(
      { message: 'Added to compare', items, count: items.length },
      { status: 200 }
    );

  } catch (error) {
    console.error('[/api/compare POST]', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to add to compare' },
      { status: 500 }
    );
  }
}

// ─── DELETE: clear the entire compare list for the logged-in user ─────────────
// (Individual item delete is handled by /api/compare/[productId]/route.js)

export async function DELETE(req) {
  try {
    await dbConnect();

    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    await Compare.deleteMany({ userId });
    return NextResponse.json({ message: 'Compare list cleared', items: [], count: 0 }, { status: 200 });

  } catch (error) {
    console.error('[/api/compare DELETE]', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to clear compare list' },
      { status: 500 }
    );
  }
}
