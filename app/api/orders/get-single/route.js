import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const order_id = searchParams.get("order_id");

  if (!order_id) {
    return NextResponse.json(
      { success: false, error: "Order ID is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch order from database (example using Prisma)
    const order = await prisma.order.findUnique({
      where: { order_number: order_id },
      include: { order_details: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}