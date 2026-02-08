/**
 * Internal Email API
 *
 * Used for sending emails from server-side code.
 * Protected - requires service role or internal request.
 */

import { NextRequest, NextResponse } from "next/server";

import {
  sendWelcomeEmail,
  sendPurchaseConfirmationEmail,
  sendStreakReminderEmail,
  sendFriendCodeEmail,
  EmailType,
} from "@lib/email";
import { createClient } from "@lib/supabase-server";

export async function POST(request: NextRequest) {
  // Verify internal request or admin
  const authHeader = request.headers.get("x-internal-secret");
  const internalSecret = process.env.INTERNAL_API_SECRET;

  // Allow if internal secret matches OR if user is admin
  let isAuthorized = !!(authHeader === internalSecret && internalSecret);

  if (!isAuthorized) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      isAuthorized = !!userRole;
    }
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, ...params } = body as { type: EmailType } & Record<string, unknown>;

    let result;

    switch (type) {
      case "welcome":
        result = await sendWelcomeEmail({
          to: params.to as string,
          firstName: params.firstName as string,
        });
        break;

      case "purchase_confirmation":
        result = await sendPurchaseConfirmationEmail({
          to: params.to as string,
          firstName: params.firstName as string,
          productName: params.productName as string,
          amount: params.amount as string,
          friendCodes: params.friendCodes as string[] | undefined,
        });
        break;

      case "streak_reminder":
        result = await sendStreakReminderEmail({
          to: params.to as string,
          firstName: params.firstName as string,
          currentStreak: params.currentStreak as number,
          dayNumber: params.dayNumber as number,
        });
        break;

      case "friend_code":
        result = await sendFriendCodeEmail({
          to: params.to as string,
          firstName: params.firstName as string,
          friendCodes: params.friendCodes as string[],
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid email type" }, { status: 400 });
    }

    if (result.success) {
      return NextResponse.json({ success: true, id: result.id });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Email API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
