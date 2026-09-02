// app/api/auth/check/route.js
import jwt from 'jsonwebtoken';
import User from '@/models/User';
export async function GET(req) {
  const token = req.headers.get('Authorization')?.split(' ')[1]; // Extract token from Authorization header

  if (!token) {
    return Response.json({ loggedIn: false }, { status: 200 });
  }

  try {
    // Implement your token verification logic
    const decoded = verifyToken(token);
    const userRole = await User.findOne({ _id: decoded.userId }, { name: 1, email: 1, mobile: 1, user_type: 1, role: 1 }).populate("role");
    const roleVal = userRole?.user_type === "karnataka_unilet_admin" 
      ? "karnataka_unilet_admin" 
      : (userRole?.role?.slug || userRole?.user_type || "user");

    return Response.json({
      loggedIn: true,
      user: decoded, // optional
      role: roleVal,
      user_type: userRole?.user_type,
      phone: userRole?.mobile
    }, { status: 200 });
  } catch (error) {
    return Response.json({ loggedIn: false }, { status: 200 });
  }
}

// Simple JWT verification example (implement properly)
function verifyToken(token) {
//   return jwt.verify(token, process.env.JWT_SECRET);
// }
// const verifyToken = (token) => {
  if (!token) throw new Error("Authorization token required");
   const jwt = require('jsonwebtoken');
   try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new Error("Token has expired");
    } else {
      throw new Error("Invalid token");
    }
  }
};