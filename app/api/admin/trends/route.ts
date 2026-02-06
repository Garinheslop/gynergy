import { NextRequest, NextResponse } from "next/server";

import { createClient, createServiceClient } from "@lib/supabase-server";

export async function GET(request: NextRequest) {
  const supabase = createClient();

  // Verify admin access
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();

  if (!userRole) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceClient = createServiceClient();
  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get("range") || "30d";

  try {
    // Calculate date range
    const now = new Date();
    const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Fetch user signups grouped by day
    const { data: users } = await serviceClient
      .from("users")
      .select("id, created_at")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    // Fetch purchases grouped by day
    const { data: purchases } = await serviceClient
      .from("purchases")
      .select("id, amount_cents, purchased_at")
      .eq("status", "completed")
      .gte("purchased_at", startDate.toISOString())
      .order("purchased_at", { ascending: true });

    // Group by day
    const usersByDay = groupByDay(users || [], "created_at");
    const revenueByDay = groupRevenueByDay(purchases || [], "purchased_at");

    // Generate complete date range with cumulative user count
    const userGrowth = generateUserGrowthData(usersByDay, startDate, now);
    const revenueTrend = generateRevenueTrendData(revenueByDay, startDate, now);

    return NextResponse.json({
      success: true,
      data: {
        userGrowth,
        revenueTrend,
        range,
      },
    });
  } catch (error) {
    console.error("Error fetching trends:", error);
    return NextResponse.json({ error: "Failed to fetch trends" }, { status: 500 });
  }
}

function groupByDay(
  items: Array<{ id: string; created_at: string }>,
  dateField: string
): Map<string, number> {
  const groups = new Map<string, number>();

  for (const item of items) {
    const dateStr = (item as Record<string, string>)[dateField];
    if (!dateStr) continue;

    const day = dateStr.split("T")[0];
    groups.set(day, (groups.get(day) || 0) + 1);
  }

  return groups;
}

function groupRevenueByDay(
  items: Array<{ id: string; amount_cents: number; purchased_at: string | null }>,
  dateField: string
): Map<string, number> {
  const groups = new Map<string, number>();

  for (const item of items) {
    const dateStr = (item as Record<string, string | number | null>)[dateField] as string | null;
    if (!dateStr) continue;

    const day = dateStr.split("T")[0];
    groups.set(day, (groups.get(day) || 0) + (item.amount_cents || 0));
  }

  return groups;
}

function generateUserGrowthData(
  dailyCounts: Map<string, number>,
  startDate: Date,
  endDate: Date
): Array<{ name: string; value: number }> {
  const result: Array<{ name: string; value: number }> = [];
  let cumulative = 0;

  // Get count of users before start date (baseline)
  // For simplicity, we'll start from the first day's data

  const current = new Date(startDate);
  while (current <= endDate) {
    const dayStr = current.toISOString().split("T")[0];
    cumulative += dailyCounts.get(dayStr) || 0;

    result.push({
      name: formatDateLabel(current),
      value: cumulative,
    });

    current.setDate(current.getDate() + 1);
  }

  // Sample to reasonable number of points (max 30)
  if (result.length > 30) {
    const step = Math.ceil(result.length / 30);
    return result.filter((_, i) => i % step === 0 || i === result.length - 1);
  }

  return result;
}

function generateRevenueTrendData(
  dailyRevenue: Map<string, number>,
  startDate: Date,
  endDate: Date
): Array<{ name: string; value: number }> {
  const result: Array<{ name: string; value: number }> = [];

  const current = new Date(startDate);
  while (current <= endDate) {
    const dayStr = current.toISOString().split("T")[0];
    const revenue = (dailyRevenue.get(dayStr) || 0) / 100; // Convert cents to dollars

    result.push({
      name: formatDateLabel(current),
      value: revenue,
    });

    current.setDate(current.getDate() + 1);
  }

  // Group by week if more than 30 days
  if (result.length > 30) {
    const weeklyData: Array<{ name: string; value: number }> = [];
    let weekSum = 0;
    let weekStart = "";

    for (let i = 0; i < result.length; i++) {
      if (i % 7 === 0) {
        if (weekStart) {
          weeklyData.push({ name: weekStart, value: weekSum });
        }
        weekStart = result[i].name;
        weekSum = 0;
      }
      weekSum += result[i].value;
    }

    // Add last partial week
    if (weekSum > 0) {
      weeklyData.push({ name: weekStart, value: weekSum });
    }

    return weeklyData;
  }

  return result;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
