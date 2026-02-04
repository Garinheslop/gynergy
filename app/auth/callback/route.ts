import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const redirectTo = requestUrl.searchParams.get("redirect") || "/date-zero-gratitude";

  // Handle error from Supabase
  if (error) {
    return NextResponse.redirect(
      new URL(
        `/login?error_description=${encodeURIComponent(errorDescription || error)}`,
        requestUrl.origin
      )
    );
  }

  if (code) {
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (
            cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }>
          ) => {
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

    // Exchange the code for a session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Auth callback error:", exchangeError);
      return NextResponse.redirect(
        new URL(
          `/login?error_description=${encodeURIComponent(exchangeError.message)}`,
          requestUrl.origin
        )
      );
    }
  }

  // Redirect to the specified destination or default dashboard
  // The UseSession context will handle profile completion if needed
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}
