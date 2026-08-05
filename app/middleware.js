export function middleware(req) {
    const session = req.cookies.get("admin_session");
  
    if (!session && req.nextUrl.pathname.startsWith("/admin")) {
      return Response.redirect(new URL("/admin/login", req.url));
    }
  }
  
  export const config = {
    matcher: ["/admin/:path*"],
  };
  