import { NextResponse } from "next/server";



// File: /app/api/truco-promo-code/route.js






export async function POST(req) {

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  const body = await req.json();

  const TRUCO_BASE_URL = process.env.TRUCO_BASE_URL;
  const TRUCO_API_KEY = process.env.TRUCO_API_KEY;


  if (!TRUCO_BASE_URL || !TRUCO_API_KEY) {
    return NextResponse.json(
      { success: false, message: "Truco config missing in environment" },
      { status: 500 }
    );
  }

  try {

    // ACTION 1: VALIDATE

    if (action === "validate") {
      const {
        code,         
        phoneNumber,  
        cartTotal,     
        cartItems,     
        paymentMethod, 
        storeId,      
        channel,      
        city           
      } = body;

      
      if (!code || !phoneNumber) {
        return NextResponse.json(
          { success: false, message: "code and phoneNumber required" },
          { status: 400 }
        );
      }

      const res = await fetch(`${TRUCO_BASE_URL}/Promotion/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": TRUCO_API_KEY,     
        },
        body: JSON.stringify({
          code,
          phoneNumber,
          transactionAmount: cartTotal || 0,
          storeId: storeId || "ECOM",      
          channel: channel || "ONLINE",     
          paymentMethod: paymentMethod || "CARD",
          city: city || "",
          cartItems: cartItems || [],     
          hasOtherOffersApplied: false    
        }),
      });

      const data = await res.json();
      return NextResponse.json(data);
    }

 
    
    if (action === "redeem") {
      const {
        code,           
        phoneNumber,      
        transactionAmount,
        invoiceNumber,   
        cartItems,        
        paymentMethod,   
        storeId,
        channel,
        city
      } = body;

   
     
      
      if (!code || !phoneNumber || !transactionAmount) {
        return NextResponse.json(
          { success: false, message: "code, phoneNumber, transactionAmount required" },
          { status: 400 }
        );
      }

    
      
      const res = await fetch(`${TRUCO_BASE_URL}/Promotion/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": TRUCO_API_KEY,
        },
        body: JSON.stringify({
          code,
          phoneNumber,
          transactionAmount,
          invoiceNumber,                   
          storeId: storeId || "ECOM",
          channel: channel || "ONLINE",
          paymentMethod: paymentMethod || "CARD",
          city: city || "",
          cartItems: cartItems || [],
          hasOtherOffersApplied: false,
          deviceFingerprint: "",            
        }),
      });

      const data = await res.json();
      return NextResponse.json(data);
    }

   
    
   
  
    if (action === "status") {
      const { code } = body;

      if (!code) {
        return NextResponse.json(
          { success: false, message: "code required" },
          { status: 400 }
        );
      }

  
     
      const res = await fetch(`${TRUCO_BASE_URL}/Promotion/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": TRUCO_API_KEY,
        },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      return NextResponse.json(data);
    }

    
   
    return NextResponse.json(
      { success: false, message: "Invalid action. Use: validate | redeem | status" },
      { status: 400 }
    );

  } catch (error) {

    console.error("Truco promo code error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}