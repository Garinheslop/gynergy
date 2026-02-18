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

  // Bypass auth check on public routes
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
    "/blog", // Blog / SEO content
    "/privacy", // Privacy Policy (required for App Store)
    "/terms", // Terms of Service (required for App Store)
  ];

  if (publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
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
    // Check user entitlements
    const { data: entitlements } = await supabase
      .from("user_entitlements")
      .select("has_challenge_access")
      .eq("user_id", user.id)
      .single();

    // If no entitlements or no challenge access, redirect to pricing
    if (!entitlements?.has_challenge_access) {
      const pricingUrl = new URL("/pricing", request.url);
      pricingUrl.searchParams.set("access_required", "true");
      return NextResponse.redirect(pricingUrl);
    }
  }

  // Check if route requires admin access
  if (pathname.startsWith("/admin")) {
    // Query user_roles to check for admin role
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    // If not admin, redirect to home
    if (!adminRole) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

// Middleware runs on all non-internal paths
export const config = {
  matcher: ["/((?!_next/static|_next/image|api).*)"],
};
