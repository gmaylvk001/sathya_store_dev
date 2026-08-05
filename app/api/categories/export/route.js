import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";

import Category from "@/models/ecom_category_info";
import CategoryFilter from "@/models/ecom_categoryfilters_infos";
import Filter from "@/models/ecom_filter_infos";
import FilterGroup from "@/models/ecom_filter_group_infos";

import * as XLSX from "xlsx";

export async function GET(req) {
  try {
  await dbConnect();
  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search");

  // FETCH CATEGORIES
  let categories = [];
  if (search) {
    categories = await Category.find({
      $or: [
        { category_name: { $regex: search, $options: "i" } },
        { category_slug: { $regex: search, $options: "i" } },
      ],
    }).lean();
  } else {
    categories = await Category.find({}).lean();
  }

  console.log("Fetched categories:", categories.length);

  if (!categories.length) throw new Error("No categories found");

  const categoryMap = {};
  /* for (const cat of categories) {
    categoryMap[cat._id.toString()] = cat;
    if (cat.parentid) {
      const parent = await Category.findById(cat.parentid).lean();
      console.log("Fetched parent:", parent);
      if (parent) categoryMap[parent._id.toString()] = parent;
    }
  } */


    for (const cat of categories) {
  categoryMap[cat._id.toString()] = cat;

  // Only fetch parent if parentid is a valid ObjectId
  if (cat.parentid && cat.parentid !== "none") {
    try {
      const parent = await Category.findById(cat.parentid).lean();
      if (parent) categoryMap[parent._id.toString()] = parent;
    } catch (err) {
      console.warn(`Invalid parentid skipped: ${cat.parentid}`);
    }
  }
}

  const categoryIds = categories.map(c => c._id.toString());
  const categoryFilters = await CategoryFilter.find({
    category_id: { $in: categoryIds },
  }).lean();
  console.log("Category filters:", categoryFilters.length);

  if (!categoryFilters.length) throw new Error("No category filters found");

  const filterIds = categoryFilters.map(cf => cf.filter_id);
  const filters = await Filter.find({ _id: { $in: filterIds } }).lean();
  console.log("Filters:", filters.length);

  const filterMap = {};
  filters.forEach(f => (filterMap[f._id.toString()] = f));

  const filterGroupIds = filters.map(f => f.filter_group);
  const filterGroups = await FilterGroup.find({
    _id: { $in: filterGroupIds },
  }).lean();
  console.log("Filter groups:", filterGroups.length);

  const filterGroupMap = {};
  filterGroups.forEach(g => (filterGroupMap[g._id.toString()] = g.filtergroup_name));

  const excelData = [];
  /* categoryFilters.forEach(cf => {
    const category = categoryMap[cf.category_id];
    const filter = filterMap[cf.filter_id];
    if (!category || !filter) return;

    let categoryName = "-";
    let subCategoryName = category.category_name;
    if (category.parentid) {
      const parent = categoryMap[category.parentid];
      categoryName = parent?.category_name || "-";
    }

    excelData.push({
      "Category": categoryName,
      "Sub Category": subCategoryName,
      "Filter Group": filterGroupMap[filter.filter_group] || "-",
      "Filter Value": filter.filter_name,
    });
  }); */

  categoryFilters.forEach(cf => {
  const category = categoryMap[cf.category_id];
  const filter = filterMap[cf.filter_id];
  if (!category || !filter) return;

  let categoryName = "-";
  let subCategoryName = "-";

  // If category has a parent, parent becomes "Category" and current becomes "Sub Category"
  if (category.parentid && category.parentid !== "none") {
    const parent = categoryMap[category.parentid];
    categoryName = parent?.category_name || "-";
    subCategoryName = category.category_name;
  } else {
    // No parent, it's a main category
    categoryName = category.category_name;
    subCategoryName = "-"; // Only subcategory exists if parent is there
  }

  excelData.push({
    "Category": categoryName,
    "Sub Category": subCategoryName,
    "Filter Group": filterGroupMap[filter.filter_group] || "-",
    "Filter Value": filter.filter_name,
  });
});


  console.log("Excel data length:", excelData.length);

  if (!excelData.length) throw new Error("Excel data is empty");

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Category Filters");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Disposition": "attachment; filename=category-filter-export.xlsx",
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });

} catch (error) {
  console.error("Export error:", error);
  return NextResponse.json(
    { success: false, message: `Export failed: ${error.message}` },
    { status: 500 }
  );
}

}
