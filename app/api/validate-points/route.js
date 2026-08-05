import { NextResponse } from "next/server";

// Validate Points — POST /api/validate-points?action=validate
// Redeem Points — POST /api/validate-points?action=redeem

export async function POST(req) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const body = await req.json();

  try {
    if (action === 'validate') {
      const { mobileNumber, pointsToRedeem, billTotal } = body;

      const res = await fetch(
        `${process.env.TRUCO_BASE_URL}/pos/redemption/validate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': process.env.TRUCO_API_KEY
          },
          body: JSON.stringify({
            mobileNumber,
            pointsToRedeem,
            billTotal,
            notes: "Web checkout"
          })
        }
      );
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === 'redeem') {
      const { token, orderNumber } = body;

      const res = await fetch(
        `${process.env.TRUCO_BASE_URL}/pos/redemption/process`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': process.env.TRUCO_API_KEY
          },
          body: JSON.stringify({
            token,
            posTransactionReference: orderNumber,
            processedBy: "checkout-service",
            storeLocation: "ecom-web"
          })
        }
      );
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === 'cancel') {
  const { token } = body;
  const res = await fetch(
    `${process.env.TRUCO_BASE_URL}/pos/redemption/cancel`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': process.env.TRUCO_API_KEY
      },
      body: JSON.stringify({
        token,
        reason: "Customer removed points",
        cancelledBy: "checkout-service"
      })
    }
  );
  const data = await res.json();
  return NextResponse.json(data);
}

    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );

  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}