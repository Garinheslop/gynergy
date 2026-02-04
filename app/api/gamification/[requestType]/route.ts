"force-dynamic";

import { NextResponse } from "next/server";

import {
  getAllBadges,
  getUserBadges,
  getNewBadges,
  markBadgeSeen,
  toggleBadgeShowcase,
  checkAndAwardBadges,
} from "@lib/services/badgeService";
import {
  getMultiplierConfigs,
  getActiveMultiplierForUser,
  getPointsHistory,
  getTotalPoints,
} from "@lib/services/pointsService";
import { createClient, createServiceClient } from "@lib/supabase-server";
import { gamificationRequestTypes } from "@resources/types/gamification";

export async function GET(request: Request, { params }: { params: { requestType: string } }) {
  const { requestType } = params;

  if (!requestType) {
    return NextResponse.json({ error: "Request type is required" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");

  try {
    // GET: All badge definitions
    if (requestType === gamificationRequestTypes.getAllBadges) {
      const { badges, error } = await getAllBadges(supabase);
      if (error) {
        return NextResponse.json({ error }, { status: 500 });
      }
      return NextResponse.json({ badges });
    }

    // GET: User's earned badges
    if (requestType === gamificationRequestTypes.getUserBadges) {
      if (!sessionId) {
        return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
      }
      const { badges, error } = await getUserBadges(supabase, user.id, sessionId);
      if (error) {
        return NextResponse.json({ error }, { status: 500 });
      }
      return NextResponse.json({ badges });
    }

    // GET: New (unseen) badges
    if (requestType === gamificationRequestTypes.getNewBadges) {
      if (!sessionId) {
        return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
      }
      const { badges, error } = await getNewBadges(supabase, user.id, sessionId);
      if (error) {
        return NextResponse.json({ error }, { status: 500 });
      }
      return NextResponse.json({ badges });
    }

    // GET: Multiplier configurations
    if (requestType === gamificationRequestTypes.getMultipliers) {
      const { multipliers, error } = await getMultiplierConfigs(supabase);
      if (error) {
        return NextResponse.json({ error }, { status: 500 });
      }
      return NextResponse.json({ multipliers });
    }

    // GET: Active multiplier for user
    if (requestType === gamificationRequestTypes.getActiveMultiplier) {
      if (!sessionId) {
        return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
      }
      const { multiplier, streak, error } = await getActiveMultiplierForUser(
        supabase,
        user.id,
        sessionId
      );
      if (error) {
        return NextResponse.json({ error }, { status: 500 });
      }
      return NextResponse.json({ multiplier, streak });
    }

    // GET: Points history
    if (requestType === gamificationRequestTypes.getPointsHistory) {
      if (!sessionId) {
        return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
      }
      const limit = parseInt(url.searchParams.get("limit") || "50", 10);
      const { transactions, error } = await getPointsHistory(supabase, user.id, sessionId, limit);
      if (error) {
        return NextResponse.json({ error }, { status: 500 });
      }
      return NextResponse.json({ transactions });
    }

    // GET: Total points
    if (requestType === gamificationRequestTypes.getTotalPoints) {
      if (!sessionId) {
        return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
      }
      const { total, error } = await getTotalPoints(supabase, user.id, sessionId);
      if (error) {
        return NextResponse.json({ error }, { status: 500 });
      }
      return NextResponse.json({ totalPoints: total });
    }

    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  } catch (error) {
    console.error("Gamification API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: { params: { requestType: string } }) {
  const { requestType } = params;

  if (!requestType) {
    return NextResponse.json({ error: "Request type is required" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // POST: Mark badge as seen
    if (requestType === gamificationRequestTypes.markBadgeSeen) {
      const { badgeId } = body;
      if (!badgeId) {
        return NextResponse.json({ error: "Badge ID is required" }, { status: 400 });
      }
      const { success, error } = await markBadgeSeen(supabase, user.id, badgeId);
      if (error) {
        return NextResponse.json({ error }, { status: 500 });
      }
      return NextResponse.json({ success });
    }

    // POST: Toggle badge showcase
    if (requestType === gamificationRequestTypes.toggleShowcase) {
      const { badgeId, sessionId } = body;
      if (!badgeId || !sessionId) {
        return NextResponse.json(
          { error: "Badge ID and Session ID are required" },
          { status: 400 }
        );
      }
      const { success, error } = await toggleBadgeShowcase(supabase, user.id, badgeId, sessionId);
      if (error) {
        return NextResponse.json({ error }, { status: 500 });
      }
      return NextResponse.json({ success });
    }

    // POST: Check and award badges (called after completing an activity)
    if (requestType === gamificationRequestTypes.checkBadges) {
      const { sessionId, context } = body;
      if (!sessionId || !context) {
        return NextResponse.json({ error: "Session ID and context are required" }, { status: 400 });
      }

      const supabaseAdmin = createServiceClient();
      const result = await checkAndAwardBadges(supabaseAdmin, {
        ...context,
        userId: user.id,
        sessionId,
      });

      return NextResponse.json({
        newBadges: result.newBadges,
        pointsAwarded: result.pointsAwarded,
        celebrationEvents: result.celebrationEvents,
      });
    }

    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  } catch (error) {
    console.error("Gamification API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
