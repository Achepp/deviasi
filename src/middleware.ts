import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "packaging-weighing-secret-key-32-bytes-long!"
);

const COOKIE_NAME = "pwa_weighing_session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard /admin and /operator routes and /login
  const isAdminRoute = pathname.startsWith("/admin");
  const isOperatorRoute = pathname.startsWith("/operator");
  const isLoginRoute = pathname === "/login";
  const isRootRoute = pathname === "/";

  const token = req.cookies.get(COOKIE_NAME)?.value;

  let session: { userId: string; nama: string; email: string; role: "Admin" | "Operator" } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      session = {
        userId: payload.userId as string,
        nama: payload.nama as string,
        email: payload.email as string,
        role: payload.role as "Admin" | "Operator",
      };
    } catch {
      session = null;
    }
  }

  // 1. Root route: redirect according to session
  if (isRootRoute) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (session.role === "Admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/operator/home", req.url));
  }

  // 2. Login route: redirect away if already authenticated
  if (isLoginRoute) {
    if (session) {
      if (session.role === "Admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
      return NextResponse.redirect(new URL("/operator/home", req.url));
    }
    return NextResponse.next();
  }

  // 3. Admin routes: require session and Admin role
  if (isAdminRoute) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (session.role !== "Admin") {
      // Operator attempting to access admin route
      return NextResponse.redirect(new URL("/operator/home", req.url));
    }
    return NextResponse.next();
  }

  // 4. Operator routes: require session and Operator role
  if (isOperatorRoute) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (session.role !== "Operator") {
      // Admin attempting to access operator route
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/operator/:path*"],
};
