import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── Security headers applied to every response ────────────────────────────────
// These are set at the middleware layer so they cover all routes including
// API routes, pages, and static assets served through Next.js.
const SECURITY_HEADERS: Record<string, string> = {
  // Prevent MIME-type sniffing (e.g., a .txt file being executed as JS).
  "X-Content-Type-Options": "nosniff",

  // Deny embedding in iframes — prevents clickjacking.
  "X-Frame-Options": "DENY",

  // Disable the legacy XSS auditor (modern browsers ignore it; old ones
  // could be tricked into blocking legitimate content if it's enabled).
  "X-XSS-Protection": "0",

  // Limit referrer information sent to third-party origins.
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Opt out of Google's FLoC / Topics tracking API.
  "Permissions-Policy": "browsing-topics=()",

  // Tell browsers to always use HTTPS for this origin for 1 year.
  // Only active in production (HTTPS). preload is intentionally omitted
  // until you're ready to submit to the HSTS preload list.
  ...(process.env.NODE_ENV === "production"
    ? { "Strict-Transport-Security": "max-age=31536000; includeSubDomains" }
    : {}),
};

// ── Protected routes that require a valid JWT session ─────────────────────────
// Note: this middleware only checks that a JWT cookie *exists*. The deeper
// sessionVersion check (stale-session invalidation) happens inside each page's
// auth() call because middleware cannot safely run Prisma queries.
export default withAuth(
  function middleware(req: NextRequest) {
    const res = NextResponse.next();

    // Attach security headers to every matched response.
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      res.headers.set(key, value);
    });

    return res;
  },
  {
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *  - _next/static  (static assets)
     *  - _next/image   (image optimisation)
     *  - favicon.ico
     *  - public files (manifest, icons, sw.js)
     * This ensures security headers reach pages AND API routes.
     */
    "/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|icon|sw\\.js).*)",
  ],
};
