// middleware.ts (project root)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "10 s"), // 20 requests per 10s per key
  analytics: true,
});

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // --- Rate limiting: only on API routes ---
  if (request.nextUrl.pathname.startsWith("/api")) {
    const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
    const { success, limit, remaining } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "X-RateLimit-Limit": limit.toString(), "X-RateLimit-Remaining": remaining.toString() } }
      );
    }
  }

 // --- Security headers ---
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://www.google.com https://connect.facebook.net",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "frame-src 'self' https://kkgs-portal.firebaseapp.com https://accounts.google.com https://www.facebook.com https://staticxx.facebook.com",
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.facebook.com https://graph.facebook.com",
    ].join("; ")
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on all routes except static assets and _next internals
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};