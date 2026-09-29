import { NextResponse } from "next/server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import OrderNew from "@/models/orders_new";
import OrderDetailsNew from "@/models/order_details_new";
import Product from "@/models/product";
import Category from "@/models/ecom_category_info";
import User from "@/models/User";
import StoreListing from "@/models/store_listings";

export const dynamic = "force-dynamic";

const COMPLETE = new Set(["complete"]);
const BILLED = new Set(["billed"]);
const REJECTED = new Set(["cancelled", "canceled", "failure", "rejected"]);
const PENDING = new Set([
  "pending",
  "order placed",
  "ordered",
  "payment initiated",
  "order accepted",
]);

function authorize(req) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return false;
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

function isoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 7);
  return { startDate: isoDate(start), endDate: isoDate(end) };
}

function dayStart(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dayEnd(value) {
  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function money(value) {
  const number = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanCode(value) {
  return String(value ?? "").trim().replace(/^ITEM/i, "");
}

function pushId(list, value) {
  const text = String(value ?? "").trim();
  if (text) list.push(text);
}

export async function GET(req) {
  if (!authorize(req)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const fallback = defaultRange();
    const startDate = searchParams.get("startDate") || fallback.startDate;
    const endDate = searchParams.get("endDate") || fallback.endDate;
    const paymentMethod = String(searchParams.get("paymentMethod") || "").trim();
    const storeId = String(searchParams.get("storeId") || "").trim();

    const start = dayStart(startDate);
    const end = dayEnd(endDate);
    if (!start || !end) {
      return NextResponse.json({ success: false, message: "Invalid date range" }, { status: 400 });
    }

    const stores = await StoreListing.find(
      {},
      { title: 1, organisation_name: 1, store_name: 1, name: 1, branch_code: 1, exist_id: 1 }
    ).lean();

    const storeOptions = stores
      .map((store) => ({
        id: String(store._id),
        name: store.title || store.organisation_name || store.store_name || store.name || "Store",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const filter = {
      created_at: { $gte: start, $lte: end },
    };

    if (paymentMethod) {
      filter.payment_method = { $regex: `^${escapeRegex(paymentMethod)}$`, $options: "i" };
    }

    if (storeId) {
      const store = stores.find((row) => String(row._id) === storeId);
      const keys = [storeId, store?.branch_code, store?.exist_id, store?.title]
        .map((value) => String(value ?? "").trim())
        .filter(Boolean);
      filter.$or = [
        { store_id: { $in: keys } },
        { pickup_store: { $in: keys } },
        { pickup_type: { $in: keys } },
      ];
    }

    const [orders, paymentMethods] = await Promise.all([
      OrderNew.collection
        .find(filter)
        .project({
          order_amount: 1,
          order_status: 1,
          payment_method: 1,
          sales_person_id: 1,
          order_item: 1,
        })
        .toArray(),
      OrderNew.collection.distinct("payment_method", {
        payment_method: { $nin: [null, ""] },
      }),
    ]);

    const stats = {
      total: orders.length,
      totalAmount: 0,
      complete: 0,
      pending: 0,
      billed: 0,
      rejected: 0,
    };

    const productIds = [];
    const itemCodes = [];
    const orderRefs = new Map();

    for (const order of orders) {
      const amount = money(order.order_amount);
      stats.totalAmount = roundMoney(stats.totalAmount + amount);
      const status = String(order.order_status || "").trim().toLowerCase();
      if (COMPLETE.has(status)) stats.complete += 1;
      else if (BILLED.has(status)) stats.billed += 1;
      else if (REJECTED.has(status)) stats.rejected += 1;
      else if (PENDING.has(status)) stats.pending += 1;

      const refs = [];
      const items = Array.isArray(order.order_item) ? order.order_item : [];
      for (const item of items) {
        pushId(productIds, item?.productId || item?.product_id || item?.id);
        const code = cleanCode(item?.item_code);
        if (code) itemCodes.push(code);
        refs.push({
          productId: String(item?.productId || item?.product_id || item?.id || "").trim(),
          itemCode: code,
        });
      }
      orderRefs.set(String(order._id), { amount, refs });
    }

    const details = orders.length
      ? await OrderDetailsNew.find(
          { order_id: { $in: orders.map((order) => order._id) } },
          { order_id: 1, product_id: 1, item_code: 1 }
        ).lean()
      : [];

    for (const row of details) {
      pushId(productIds, row.product_id);
      const code = cleanCode(row.item_code);
      if (code) itemCodes.push(code);
      const bucket = orderRefs.get(String(row.order_id));
      if (bucket) {
        bucket.refs.push({
          productId: String(row.product_id || "").trim(),
          itemCode: code,
        });
      }
    }

    const validProductIds = [...new Set(productIds)].filter((id) => mongoose.Types.ObjectId.isValid(id));
    const uniqueCodes = [...new Set(itemCodes)];
    const productQuery = [];
    if (validProductIds.length) productQuery.push({ _id: { $in: validProductIds } });
    if (uniqueCodes.length) productQuery.push({ item_code: { $in: uniqueCodes } });

    const products = productQuery.length
      ? await Product.find({ $or: productQuery }, { category: 1, item_code: 1 }).lean()
      : [];

    const categoryIds = [...new Set(products.map((product) => String(product.category || "").trim()).filter(Boolean))];
    const validCategoryIds = categoryIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const categories = validCategoryIds.length
      ? await Category.find({ _id: { $in: validCategoryIds } }, { category_name: 1 }).lean()
      : [];
    const categoryNameById = new Map(categories.map((row) => [String(row._id), row.category_name]));

    const categoryByProductId = new Map();
    const categoryByCode = new Map();
    for (const product of products) {
      const raw = String(product.category || "").trim();
      const name = categoryNameById.get(raw) || (mongoose.Types.ObjectId.isValid(raw) ? "" : raw);
      if (!name) continue;
      categoryByProductId.set(String(product._id), name);
      if (product.item_code) categoryByCode.set(String(product.item_code), name);
    }

    const categoryTotals = new Map();
    for (const bucket of orderRefs.values()) {
      const names = new Set();
      for (const ref of bucket.refs) {
        const name = categoryByProductId.get(ref.productId) || categoryByCode.get(ref.itemCode);
        if (name) names.add(name);
      }
      for (const name of names) {
        const current = categoryTotals.get(name) || { name, orders: 0, value: 0 };
        current.orders += 1;
        current.value = roundMoney(current.value + bucket.amount);
        categoryTotals.set(name, current);
      }
    }

    const personIds = [...new Set(
      orders
        .map((order) => order.sales_person_id)
        .filter((value) => value !== null && value !== undefined && String(value).trim() !== "")
        .map((value) => String(value))
    )];
    const personObjectIds = personIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const people = personIds.length
      ? await User.find(
          {
            $or: [
              ...(personObjectIds.length ? [{ _id: { $in: personObjectIds } }] : []),
              { exist_id: { $in: personIds } },
            ],
          },
          { name: 1, last_name: 1, email: 1, exist_id: 1 }
        ).lean()
      : [];

    const personName = new Map();
    for (const person of people) {
      const name = [person.name, person.last_name].filter(Boolean).join(" ") || person.email || "Sales person";
      personName.set(String(person._id), name);
      if (person.exist_id) personName.set(String(person.exist_id), name);
    }

    const salesTotals = new Map();
    for (const order of orders) {
      const id = String(order.sales_person_id ?? "").trim();
      if (!id) continue;
      const name = personName.get(id) || `Sales person ${id}`;
      const current = salesTotals.get(name) || { name, orders: 0, value: 0 };
      current.orders += 1;
      current.value = roundMoney(current.value + money(order.order_amount));
      salesTotals.set(name, current);
    }

    const byValue = (a, b) => b.value - a.value || b.orders - a.orders;

    return NextResponse.json({
      success: true,
      startDate,
      endDate,
      paymentMethods: paymentMethods.map((method) => String(method)).filter(Boolean).sort(),
      stores: storeOptions,
      stats,
      categories: [...categoryTotals.values()].sort(byValue).slice(0, 10),
      salesPersons: [...salesTotals.values()].sort(byValue).slice(0, 10),
    });
  } catch (error) {
    console.error("Sales dashboard error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load sales dashboard" },
      { status: 500 }
    );
  }
}
