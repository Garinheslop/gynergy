import { cookies } from "next/headers";
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

  // Bypass auth check on the login page, auth routes, and image routes
  if (pathname === "/" || pathname.startsWith("/auth") || pathname.startsWith("/image")) {
    return NextResponse.next();
  }

  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: Array<{ name: string; value: string; options: any }>) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore errors from Server Component context
          }
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If there is no session, redirect any protected route to the login page ("/")
  if (!session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Middleware runs on all non-internal paths
export const config = {
  matcher: ["/((?!_next/static|_next/image|api).*)"],
};
