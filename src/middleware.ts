import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    if (token.status !== "ACTIVE") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const role = token.role as string;
    const rolePaths: Record<string, string> = {
      CUSTOMER: "/customer",
      DRIVER: "/driver",
      ADMIN: "/admin",
      RECEPTIONIST: "/receptionist",
    };

    const allowedPrefix = rolePaths[role];
    if (allowedPrefix && path.startsWith(allowedPrefix)) {
      return NextResponse.next();
    }

    if (path.startsWith("/customer") || path.startsWith("/driver") || path.startsWith("/admin") || path.startsWith("/receptionist")) {
      return NextResponse.redirect(new URL(rolePaths[role] || "/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const publicPaths = ["/", "/login", "/register", "/api/auth"];
        if (publicPaths.some((p) => req.nextUrl.pathname === p || req.nextUrl.pathname.startsWith("/api/auth"))) {
          return true;
        }
        if (req.nextUrl.pathname.startsWith("/api/") && !req.nextUrl.pathname.startsWith("/api/auth")) {
          return !!token;
        }
        if (["/customer", "/driver", "/admin", "/receptionist"].some((p) => req.nextUrl.pathname.startsWith(p))) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/customer/:path*", "/driver/:path*", "/admin/:path*", "/receptionist/:path*"],
};
