import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/db";
import CategoryPage from "@/models/categoryPage";
import CategoryImageCarousel from "@/models/categoryImageCarousel";
import CategoryProductCarousel from "@/models/categoryProductCarousel";
import CategoryBannerSideProducts from "@/models/categoryBannerSideProducts";
import CategoryBannerFourProducts from "@/models/categoryBannerFourProducts";
import {
  allowsMultipleInstances,
  COMPONENT_TYPES,
  isValidComponentType,
} from "@/lib/categoryPageComponents/registry";

/**
 * POST /api/category-pages/[id]/components
 * Body: { type, title? }
 */
export async function POST(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const { type, title = "" } = body;

    if (!type || !isValidComponentType(type)) {
      return NextResponse.json(
        { success: false, message: `Unsupported component: ${type}` },
        { status: 400 }
      );
    }

    const page = await CategoryPage.findById(id);
    if (!page) {
      return NextResponse.json(
        { success: false, message: "Page not found" },
        { status: 404 }
      );
    }

    const allowMulti = allowsMultipleInstances(type);

    if (!allowMulti) {
      const existing = page.components.find((c) => c.type === type);
      if (existing) {
        return NextResponse.json({
          success: true,
          page: page.toObject(),
          instance: existing,
          alreadyExists: true,
        });
      }
    }

    const maxOrder = page.components.reduce(
      (m, c) => Math.max(m, typeof c.order === "number" ? c.order : 0),
      -1
    );

    const instanceId = crypto.randomUUID();
    let configId = null;

    if (type === COMPONENT_TYPES.IMAGE_CAROUSEL) {
      const config = await CategoryImageCarousel.create({
        instanceId,
        pageId: page._id,
        categoryId: page.categoryId,
        name: title || "",
        items: [],
        status: "active",
      });
      configId = config._id;
    } else if (type === COMPONENT_TYPES.PRODUCT_CAROUSEL) {
      const config = await CategoryProductCarousel.create({
        instanceId,
        pageId: page._id,
        categoryId: page.categoryId,
        name: title || "",
        products: [],
        status: "active",
      });
      configId = config._id;
    } else if (type === COMPONENT_TYPES.BANNER_SIDE_PRODUCTS) {
      const config = await CategoryBannerSideProducts.create({
        instanceId,
        pageId: page._id,
        categoryId: page.categoryId,
        name: title || "",
        products: [],
        status: "active",
      });
      configId = config._id;
    } else if (type === COMPONENT_TYPES.BANNER_FOUR_PRODUCTS) {
      const config = await CategoryBannerFourProducts.create({
        instanceId,
        pageId: page._id,
        categoryId: page.categoryId,
        name: title || "",
        tiles: [],
        products: [],
        status: "active",
      });
      configId = config._id;
    }

    const instance = {
      instanceId,
      type,
      configId,
      title: title || "",
      order: maxOrder + 1,
      isActive: true,
    };
    page.components.push(instance);
    await page.save();

    return NextResponse.json(
      { success: true, page: page.toObject(), instance },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

export async function GET(_req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const page = await CategoryPage.findById(id).lean();
    if (!page) {
      return NextResponse.json(
        { success: false, message: "Page not found" },
        { status: 404 }
      );
    }
    const components = [...(page.components || [])].sort(
      (a, b) => a.order - b.order
    );
    return NextResponse.json({ success: true, components });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
