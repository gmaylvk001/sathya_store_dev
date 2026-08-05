import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import Product from "@/models/product";

export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('excel');

        if (!file) {
            return NextResponse.json(
                { error: 'Excel or CSV file is required.' },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Read file
        const workbook = XLSX.read(buffer);
        let rows = XLSX.utils.sheet_to_json(
            workbook.Sheets[workbook.SheetNames[0]],
            { defval: "" }
        );

        let updatedCount = 0;
        let skippedCount = 0;
        const errors = [];

        console.log("Total rows:", rows.length);

        for (let [index, row] of rows.entries()) {
            try {
                const item_code = row["item_code"]?.toString().trim();
                const product_name = row["product_name"]?.toString().trim();

                // ✅ Skip if empty
                if (!item_code || !product_name) {
                    skippedCount++;
                    continue;
                }

                // Find product
                const product = await Product.findOne({ item_code });

                // ✅ Skip if not found
                if (!product) {
                    skippedCount++;
                    continue;
                }

                // Update name
                await Product.updateOne(
                    { _id: product._id },
                    { $set: { name: product_name } }
                );

                updatedCount++;

            } catch (err) {
                errors.push({
                    row: index + 2,
                    error: err.message,
                });
            }
        }

        return NextResponse.json(
            {
                message: `Completed: ${updatedCount} updated, ${skippedCount} skipped`,
                errors,
            },
            { status: errors.length ? 207 : 200 }
        );

    } catch (error) {
        console.error('Bulk update error:', error);
        return NextResponse.json(
            { error: 'Bulk update error: ' + error.message },
            { status: 500 }
        );
    }
}