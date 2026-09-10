import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Category from "@/models/ecom_category_info";
import * as XLSX from "xlsx";

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const startDate = searchParams.get("startDate")?.trim() || "";
    const endDate = searchParams.get("endDate")?.trim() || "";

    // Fetch all categories to reconstruct full hierarchy
    const allCategories = await Category.find({}).lean();
    if (!allCategories || allCategories.length === 0) {
      throw new Error("No categories found in database");
    }

    // Build lookup maps for fast parent resolution
    const byId = new Map();
    const byMd5 = new Map();
    const byName = new Map();

    for (const cat of allCategories) {
      if (cat._id) byId.set(String(cat._id), cat);
      if (cat.md5_cat_name) byMd5.set(String(cat.md5_cat_name), cat);
      if (cat.category_name) byName.set(cat.category_name.trim().toLowerCase(), cat);
    }

    const findParent = (cat) => {
      if (!cat) return null;
      const pid = cat.parentid ? String(cat.parentid).trim() : "";
      if (!pid || pid === "none" || pid === "0" || pid === "null" || pid === "undefined") {
        return null;
      }

      // 1. Direct _id match
      if (byId.has(pid)) {
        const p = byId.get(pid);
        if (String(p._id) !== String(cat._id)) return p;
      }

      // 2. parentid_new (md5) match
      const pidNew = cat.parentid_new ? String(cat.parentid_new).trim() : "";
      if (pidNew && pidNew !== "none" && byMd5.has(pidNew)) {
        const p = byMd5.get(pidNew);
        if (String(p._id) !== String(cat._id)) return p;
      }

      // 3. md5 match on parentid itself
      if (byMd5.has(pid)) {
        const p = byMd5.get(pid);
        if (String(p._id) !== String(cat._id)) return p;
      }

      // 4. Case-insensitive category_name match fallback
      const lowerPid = pid.toLowerCase();
      if (byName.has(lowerPid)) {
        const p = byName.get(lowerPid);
        if (String(p._id) !== String(cat._id)) return p;
      }

      return null;
    };

    const getAncestors = (cat) => {
      const chain = [];
      let current = cat;
      const visited = new Set([String(cat._id)]);

      while (current) {
        const parent = findParent(current);
        if (!parent) break;
        const pIdStr = String(parent._id);
        if (visited.has(pIdStr)) break; // avoid loops
        visited.add(pIdStr);
        chain.unshift(parent); // oldest ancestor first: [Parent, Sub, ...]
        current = parent;
      }
      return chain;
    };

    // Track children count to identify leaf nodes if needed
    const childrenCount = new Map();
    for (const cat of allCategories) {
      const parent = findParent(cat);
      if (parent) {
        const pId = String(parent._id);
        childrenCount.set(pId, (childrenCount.get(pId) || 0) + 1);
      }
    }

    // Collect child categories
    // 1st column: Child Category
    // 2nd column: Sub Category
    // 3rd column: Parent Category
    const rows = [];

    for (const cat of allCategories) {
      const chain = getAncestors(cat);

      // Level 2+ child category: has sub category parent and parent category grandparent
      if (chain.length >= 2) {
        const parentCategory = chain[0];
        const subCategory = chain[chain.length - 1];

        // Apply filters if any
        if (status && cat.status && cat.status.toLowerCase() !== status.toLowerCase()) {
          continue;
        }

        if (startDate && endDate && cat.createdAt) {
          const catDate = new Date(cat.createdAt);
          const start = new Date(startDate);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (catDate < start || catDate > end) {
            continue;
          }
        }

        if (search) {
          const s = search.toLowerCase();
          const matchChild = cat.category_name?.toLowerCase().includes(s);
          const matchSub = subCategory.category_name?.toLowerCase().includes(s);
          const matchParent = parentCategory.category_name?.toLowerCase().includes(s);
          if (!matchChild && !matchSub && !matchParent) {
            continue;
          }
        }

        rows.push({
          "Child Category": cat.category_name || "-",
          "Sub Category": subCategory.category_name || "-",
          "Parent Category": parentCategory.category_name || "-",
        });
      }
    }

    // Fallback: If no Level 2 categories found, include Level 1 leaf categories
    if (rows.length === 0) {
      for (const cat of allCategories) {
        const chain = getAncestors(cat);
        const hasChildren = (childrenCount.get(String(cat._id)) || 0) > 0;
        if (chain.length === 1 && !hasChildren) {
          const parentCategory = chain[0];
          rows.push({
            "Child Category": cat.category_name || "-",
            "Sub Category": "-",
            "Parent Category": parentCategory.category_name || "-",
          });
        }
      }
    }

    // Sort rows alphabetically: Parent Category -> Sub Category -> Child Category
    rows.sort((a, b) => {
      const p = (a["Parent Category"] || "").localeCompare(b["Parent Category"] || "");
      if (p !== 0) return p;
      const s = (a["Sub Category"] || "").localeCompare(b["Sub Category"] || "");
      if (s !== 0) return s;
      return (a["Child Category"] || "").localeCompare(b["Child Category"] || "");
    });

    const excelData = rows.length > 0 ? rows : [
      {
        "Child Category": "No child categories found",
        "Sub Category": "",
        "Parent Category": "",
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for readability
    worksheet["!cols"] = [
      { wch: 35 }, // Child Category
      { wch: 30 }, // Sub Category
      { wch: 30 }, // Parent Category
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Child Categories");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": "attachment; filename=categories.xlsx",
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Category export error:", error);
    return NextResponse.json(
      { success: false, message: `Export failed: ${error.message}` },
      { status: 500 }
    );
  }
}
