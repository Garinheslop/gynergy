import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@supabase/ssr";

import { sendWelcomeEmail } from "@lib/email";

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
    const { data: sessionData, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Auth callback error:", exchangeError);
      return NextResponse.redirect(
        new URL(
          `/login?error_description=${encodeURIComponent(exchangeError.message)}`,
          requestUrl.origin
        )
      );
    }

    // Check if this is a new user and send welcome email
    if (sessionData?.user) {
      const userId = sessionData.user.id;
      const userEmail = sessionData.user.email;

      // Get user profile to check if they're new
      const { data: userData } = await supabase
        .from("users")
        .select("id, first_name, created_at, welcome_email_sent")
        .eq("id", userId)
        .single();

      // Send welcome email if user exists and hasn't received one yet
      if (userData && userEmail && !userData.welcome_email_sent) {
        const firstName = userData.first_name || userEmail.split("@")[0];

        // Send welcome email (fire and forget - don't block redirect)
        sendWelcomeEmail({
          to: userEmail,
          firstName,
        })
          .then(async (result) => {
            if (result.success) {
              // Mark that we've sent the welcome email
              await supabase.from("users").update({ welcome_email_sent: true }).eq("id", userId);
            }
          })
          .catch((err) => {
            console.error("Failed to send welcome email:", err);
          });
      }
    }
  }

  // Redirect to the specified destination or default dashboard
  // The UseSession context will handle profile completion if needed
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}
