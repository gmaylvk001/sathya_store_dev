import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import dbConnect from "@/lib/db";
import ExistSathyaOrder, { EXIST_SATHYA_ORDER_FIELDS } from "@/models/ExistSathyaOrder";

const DATE_FIELDS = new Set(["created_at", "updated_at", "offline_order_date"]);
const MIXED_FIELDS = new Set(["schema_request", "bajaj_do_checkout"]);

function emptyToNull(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  return value;
}

function excelSerialToDate(serial) {
  const n = Number(serial);
  if (!Number.isFinite(n) || n <= 0) return null;
  const date = new Date(Math.round((n - 25569) * 86400 * 1000));
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateValue(value) {
  if (value === undefined || value === null || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "number") return excelSerialToDate(value);
  const text = String(value).trim().replace("T", " ");
  if (!text) return null;
  if (/^\d+(\.\d+)?$/.test(text)) return excelSerialToDate(text);
  const normalized = text.includes(" ") && !text.includes("T") ? text.replace(" ", "T") : text;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseExistId(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return String(Math.trunc(value));
  const text = String(value).trim();
  return text === "" ? null : text;
}

function stringifyValue(value) {
  const cleaned = emptyToNull(value);
  if (cleaned === null) return null;
  if (typeof cleaned === "object") return JSON.stringify(cleaned);
  return String(cleaned).trim();
}

function getCell(row, keys) {
  for (const key of keys) {
    const match = Object.keys(row).find(
      (header) => String(header).toLowerCase().trim().replace(/\s+/g, "_") === key
    );
    if (match !== undefined && row[match] !== undefined && row[match] !== null && row[match] !== "") {
      return row[match];
    }
  }
  return "";
}

function mapRowToOrder(row) {
  const order = {};
  const existId = parseExistId(getCell(row, ["exist_id", "id"]));
  order.exist_id = existId;

  for (const field of EXIST_SATHYA_ORDER_FIELDS) {
    if (field === "exist_id") continue;
    const aliases = field === "referrel_url" ? ["referrel_url", "referral_url"] : [field];
    const raw = getCell(row, aliases);

    if (DATE_FIELDS.has(field)) {
      order[field] = parseDateValue(raw);
      continue;
    }
    if (MIXED_FIELDS.has(field)) {
      const mixed = emptyToNull(raw);
      if (mixed === null) {
        order[field] = null;
      } else if (typeof mixed === "object") {
        order[field] = mixed;
      } else {
        const text = String(mixed).trim();
        try {
          order[field] = JSON.parse(text);
        } catch {
          order[field] = text === "" ? null : text;
        }
      }
      continue;
    }
    order[field] = stringifyValue(raw);
  }

  return order;
}

function parseJsonOrders(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.data)) return parsed.data;
    if (parsed && typeof parsed === "object") return [parsed];
  } catch {
    // Fall through to loose SQL-export style objects.
  }

  try {
    const wrapped = `[${trimmed.replace(/,\s*$/, "")}]`;
    const parsed = JSON.parse(wrapped);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return null;
  }
}

export async function POST(req) {
  try {
    await dbConnect();

    const formData = await req.formData();
    const file = formData.get("excel") || formData.get("file") || formData.get("json");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileName = (file.name || "").toLowerCase();
    const isJson = fileName.endsWith(".json");
    const isCsv = fileName.endsWith(".csv");
    const isXlsx = fileName.endsWith(".xlsx");

    if (!isJson && !isCsv && !isXlsx) {
      return NextResponse.json({ error: "Only .xlsx, .csv and .json files are allowed" }, { status: 400 });
    }

    let rows = [];
    const buffer = Buffer.from(await file.arrayBuffer());

    if (isJson) {
      rows = parseJsonOrders(buffer.toString("utf-8"));
      if (!rows) {
        return NextResponse.json({ error: "Invalid JSON file" }, { status: 400 });
      }
    } else {
      const workbook = isCsv
        ? XLSX.read(buffer.toString("utf-8"), { type: "string", cellDates: true })
        : XLSX.read(buffer, { type: "buffer", cellDates: true });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return NextResponse.json({ error: "File has no sheets" }, { status: 400 });
      }
      rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
    }

    if (!rows.length) {
      return NextResponse.json({ error: "File has no data rows" }, { status: 400 });
    }

    let addedCount = 0;
    let skippedCount = 0;
    let skippedExistingCount = 0;
    const errors = [];
    const skippedOrders = [];

    const existing = await ExistSathyaOrder.find({}, { exist_id: 1, order_number: 1 }).lean();
    const existingIds = new Set(existing.map((item) => String(item.exist_id || "").trim()).filter(Boolean));
    const existingNumbers = new Set(existing.map((item) => String(item.order_number || "").trim()).filter(Boolean));
    const idsInFile = new Set();
    const numbersInFile = new Set();

    for (let index = 0; index < rows.length; index++) {
      const excelRow = index + 2;
      const order = mapRowToOrder(rows[index] || {});
      const existId = order.exist_id;
      const orderNumber = order.order_number;

      if (!existId && !orderNumber && !order.order_username && !order.order_phonenumber) {
        skippedCount += 1;
        errors.push({ row: excelRow, error: "Empty row" });
        continue;
      }

      const duplicateId = existId && (existingIds.has(existId) || idsInFile.has(existId));
      const duplicateNumber = orderNumber && (existingNumbers.has(orderNumber) || numbersInFile.has(orderNumber));

      if (duplicateId || duplicateNumber) {
        skippedCount += 1;
        skippedExistingCount += 1;
        skippedOrders.push({
          row: excelRow,
          exist_id: existId,
          order_number: orderNumber,
        });
        continue;
      }

      if (existId) idsInFile.add(existId);
      if (orderNumber) numbersInFile.add(orderNumber);

      try {
        await ExistSathyaOrder.create(order);
        addedCount += 1;
        if (existId) existingIds.add(existId);
        if (orderNumber) existingNumbers.add(orderNumber);
      } catch (error) {
        skippedCount += 1;
        if (existId) idsInFile.delete(existId);
        if (orderNumber) numbersInFile.delete(orderNumber);
        if (error.code === 11000) {
          skippedExistingCount += 1;
          skippedOrders.push({
            row: excelRow,
            exist_id: existId,
            order_number: orderNumber,
          });
        } else {
          errors.push({ row: excelRow, error: error.message });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed. Added ${addedCount}, skipped existing ${skippedExistingCount}, other skipped ${skippedCount - skippedExistingCount}.`,
      addedCount,
      skippedCount,
      skippedExistingCount,
      skippedOrders,
      errors,
    });
  } catch (error) {
    console.error("Exist sathya orders import error:", error);
    return NextResponse.json({ error: "Import failed", details: error.message }, { status: 500 });
  }
}
