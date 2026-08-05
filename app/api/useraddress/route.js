import dbConnect from "@/lib/db";
import Useraddress from "@/models/ecom_user_address_info";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const useraddress = await Useraddress.find({ userId: userId });
    return NextResponse.json(  { 
      message: "Address fetched successfully", 
      userAddress: useraddress 
    },
    { status: 201 }
  );
  } catch (error) {
    console.error("Error fetching Useraddress:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
