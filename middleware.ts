import { NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@supabase/ssr";

// Static files and PWA assets that should bypass auth
const PUBLIC_FILE_PATTERNS = [
  /^\/manifest\.json$/,
  /^\/sw\.js$/,
  /^\/workbox-.*\.js$/,
  /^\/icons\//,
  /^\/screenshots\//,
  /^\/favicon/,
  /^\/apple-touch-icon/,
  /^\/android-chrome/,
  /\.png$/,
  /\.ico$/,
  /\.webmanifest$/,
];

// Routes that require challenge access (purchase or friend code redemption)
const CHALLENGE_PROTECTED_PATTERNS = [
  /^\/date-zero-gratitude/, // Main challenge routes
  /^\/video\//, // Video call routes (cohort calls)
  /^\/session/, // Group coaching sessions (hot seat / breakout)
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass auth for static files (anything with a file extension)
  if (pathname.includes(".")) {
    return NextResponse.next();
  }

  // Bypass auth check for public files and PWA assets
  if (PUBLIC_FILE_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return NextResponse.next();
  }

  // Auth-required routes nested under otherwise-public parents
  // These must be checked BEFORE the public routes bypass
  const protectedSubRoutes = [
    "/webinar/studio", // Host studio requires authenticated host
  ];

  const isProtectedSubRoute = protectedSubRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Bypass auth check on public routes (unless it's a protected sub-route)
  const publicRoutes = [
    "/", // Marketing/landing page
    "/login", // Login page
    "/auth", // Auth callbacks
    "/image", // Image routes
    "/pricing", // Legacy pricing route (redirects to /)
    "/payment/success", // Post-checkout success page
    "/payment/upsell", // Post-checkout upsell page
    "/checkout/recovery", // Downsell page for checkout abandoners
    "/webinar", // Webinar registration landing page
    "/assessment", // Five Pillar Self-Assessment
    "/journal", // Journal subscription sales page
    "/subscribe", // Post-challenge subscription page
    "/blog", // Blog / SEO content
    "/privacy", // Privacy Policy (required for App Store)
    "/terms", // Terms of Service (required for App Store)
  ];

  if (
    !isProtectedSubRoute &&
    publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))
  ) {
    return NextResponse.next();
  }

  // Create response to pass through (for cookie handling)
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>
        ) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If there is no user, redirect any protected route to the login page
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if route requires challenge access
  const requiresChallengeAccess = CHALLENGE_PROTECTED_PATTERNS.some((pattern) =>
    pattern.test(pathname)
  );

  if (requiresChallengeAccess) {
    // Check user entitlements including expiration and subscription fallback
    const { data: entitlements } = await supabase
      .from("user_entitlements")
      .select("has_challenge_access, challenge_expires_at, has_journal_access")
      .eq("user_id", user.id)
      .single();

    // No entitlements at all — redirect to pricing
    if (!entitlements?.has_challenge_access) {
      const pricingUrl = new URL("/pricing", request.url);
      pricingUrl.searchParams.set("access_required", "true");
      return NextResponse.redirect(pricingUrl);
    }

    // Has challenge access — check if it's expired
    if (entitlements.challenge_expires_at) {
      const isExpired = new Date(entitlements.challenge_expires_at) < new Date();
      if (isExpired && !entitlements.has_journal_access) {
        // Challenge expired and no active subscription — redirect to subscribe
        return NextResponse.redirect(new URL("/subscribe", request.url));
      }
    } else if (!entitlements.has_journal_access) {
      // Legacy user: has_challenge_access=true but challenge_expires_at=NULL
      // Without an active subscription, treat as expired
      return NextResponse.redirect(new URL("/subscribe", request.url));
    }
  }

  // Check if route requires admin access (admin or facilitator role)
  if (pathname.startsWith("/admin")) {
    const { data: elevatedRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "facilitator"])
      .limit(1)
      .single();

    if (!elevatedRole) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

// Middleware runs on all non-internal paths
export const config = {
  matcher: ["/((?!_next/static|_next/image|api).*)"],
};
