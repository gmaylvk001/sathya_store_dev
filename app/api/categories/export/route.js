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
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build filter query
    const query = {};

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { category_name: { $regex: s, $options: "i" } },
        { category_slug: { $regex: s, $options: "i" } },
      ];
    }

    if (status && status.trim()) {
      query.status = { $regex: `^${status.trim()}$`, $options: "i" };
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    // Fetch matching categories
    const categories = await Category.find(query)
      .sort({ position: 1, createdAt: -1 })
      .lean();

    // Fetch all categories for lookup
    const allCategories = await Category.find({}).lean();
    const allCategoryMap = {};
    allCategories.forEach((cat) => {
      allCategoryMap[cat._id.toString()] = cat;
    });

    // Fetch Category Filters
    const categoryIds = categories.map((c) => c._id.toString());
    const categoryFilters =
      categoryIds.length > 0
        ? await CategoryFilter.find({
            category_id: { $in: categoryIds },
          }).lean()
        : [];

    // Fetch Filters and Groups
    const filterIds = [
      ...new Set(categoryFilters.map((cf) => cf.filter_id).filter(Boolean)),
    ];
    const filters =
      filterIds.length > 0
        ? await Filter.find({ _id: { $in: filterIds } }).lean()
        : [];
    const filterMap = {};
    filters.forEach((f) => {
      filterMap[f._id.toString()] = f;
    });

    const filterGroupIds = [
      ...new Set(filters.map((f) => f.filter_group).filter(Boolean)),
    ];
    const filterGroups =
      filterGroupIds.length > 0
        ? await FilterGroup.find({ _id: { $in: filterGroupIds } }).lean()
        : [];
    const filterGroupMap = {};
    filterGroups.forEach((g) => {
      filterGroupMap[g._id.toString()] = g.filtergroup_name || "";
    });

    // Group assigned filters per category
    const categoryAssignedFilters = {};
    categoryFilters.forEach((cf) => {
      const filter = filterMap[cf.filter_id];
      if (!filter) return;
      const groupName = filterGroupMap[filter.filter_group] || "Filter";
      if (!categoryAssignedFilters[cf.category_id]) {
        categoryAssignedFilters[cf.category_id] = [];
      }
      categoryAssignedFilters[cf.category_id].push(
        `${groupName}: ${filter.filter_name}`
      );
    });

    // Prepare Categories Sheet Data
    const categoryRows = categories.map((cat) => {
      let parentName = "None";
      let categoryType = "Main Category";

      if (cat.parentid && cat.parentid !== "none") {
        const parent = allCategoryMap[cat.parentid];
        parentName = parent?.category_name || cat.parentid;
        categoryType = "Sub Category";
      }

      const assignedFilters = (
        categoryAssignedFilters[cat._id.toString()] || []
      ).join(" | ");

      return {
        "Category Name": cat.category_name || "",
        "Category Slug": cat.category_slug || "",
        "Parent Category": parentName,
        "Type": categoryType,
        "Status": cat.status || "Active",
        "Position": cat.position ?? 0,
        "Image": cat.image || "",
        "Nav Image": cat.navImage || "",
        "Icon Image": cat.icon_url || "",
        "Meta Title":
          cat.meta_title && cat.meta_title !== "none" ? cat.meta_title : "",
        "Meta Description":
          cat.meta_description && cat.meta_description !== "none"
            ? cat.meta_description
            : "",
        "Meta Keyword":
          cat.meta_keyword && cat.meta_keyword !== "none"
            ? cat.meta_keyword
            : "",
        "Content": cat.content || "",
        "Assigned Filters": assignedFilters,
        "Created Date": cat.createdAt
          ? new Date(cat.createdAt).toISOString().split("T")[0]
          : "",
      };
    });

    // Prepare Category Filters Sheet Data (for bulk upload compatibility)
    const filterRows = [];
    categoryFilters.forEach((cf) => {
      const category = allCategoryMap[cf.category_id];
      const filter = filterMap[cf.filter_id];
      if (!category || !filter) return;

      let categoryName = "-";
      let subCategoryName = "-";

      if (category.parentid && category.parentid !== "none") {
        const parent = allCategoryMap[category.parentid];
        categoryName = parent?.category_name || "-";
        subCategoryName = category.category_name;
      } else {
        categoryName = category.category_name;
        subCategoryName = "-";
      }

      filterRows.push({
        "Category": categoryName,
        "Sub Category": subCategoryName,
        "Filter Group": filterGroupMap[filter.filter_group] || "-",
        "Filter Value": filter.filter_name || "-",
      });
    });

    const workbook = XLSX.utils.book_new();

    // Sheet 1: Categories
    const categorySheet =
      categoryRows.length > 0
        ? XLSX.utils.json_to_sheet(categoryRows)
        : XLSX.utils.json_to_sheet([
            {
              "Category Name": "",
              "Category Slug": "",
              "Parent Category": "",
              "Type": "",
              "Status": "",
              "Position": "",
              "Image": "",
              "Nav Image": "",
              "Icon Image": "",
              "Meta Title": "",
              "Meta Description": "",
              "Meta Keyword": "",
              "Content": "",
              "Assigned Filters": "",
              "Created Date": "",
            },
          ]);
    XLSX.utils.book_append_sheet(workbook, categorySheet, "Categories");

    // Sheet 2: Category Filters
    if (filterRows.length > 0) {
      const filterSheet = XLSX.utils.json_to_sheet(filterRows);
      XLSX.utils.book_append_sheet(workbook, filterSheet, "Category Filters");
    }

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const today = new Date().toISOString().slice(0, 10);

    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": `attachment; filename="categories_export_${today}.xlsx"`,
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
