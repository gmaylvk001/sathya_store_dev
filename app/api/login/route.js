import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    console.log("req", req);

    const { email, password } = await req.json();

    await connectDB();
    console.log("dfd");

    const existingUser = await User.findOne({ email });
    console.log("existingUser", existingUser);

    if (!existingUser) {
      return NextResponse.json({ error: "Admin not found" }, { status: 400 });
    }

    const isPassword = await bcrypt.compare(password, existingUser.password);
    console.log(isPassword);

    if (!isPassword) return NextResponse.json({ error: "Incorrect Password" }, { status: 400 });

    // Create a JWT token
    // const token = jwt.sign({ userId: existingUser._id, email: existingUser.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    // Send the token and user details back to the client
    return NextResponse.json({
      message: "User Login",
      token,
      role: existingUser.user_type,
      user_type: existingUser.user_type,
      user: {
        id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.user_type,
        user_type: existingUser.user_type,
        region: existingUser.region || "karnataka",
        store: existingUser.store || "unilet"
      }
    }, { status: 200 });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
