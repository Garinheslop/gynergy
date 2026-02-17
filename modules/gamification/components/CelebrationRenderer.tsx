"use client";

import { usePopup } from "@contexts/UsePopup";
import { useSession } from "@contexts/UseSession";
import { useBadgeNotifications } from "@lib/hooks/useBadgeNotifications";
import { Badge } from "@resources/types/gamification";

import BadgeUnlockPopup from "./BadgeUnlockPopup";

/**
 * CelebrationRenderer - Global component that renders celebration popups
 *
 * This component should be placed in the root layout to ensure celebrations
 * are shown regardless of which page the user is on.
 *
 * It integrates:
 * - useBadgeNotifications: Polls for newly earned badges (only when authenticated)
 * - celebrationQueue: Queue system for showing celebrations in order
 * - BadgeUnlockPopup: Visual celebration with confetti
 */
export default function CelebrationRenderer() {
  const { celebrationQueue } = usePopup();
  const { session } = useSession();

  // Only poll for badges when user is authenticated
  const isAuthenticated = !!session?.user;

  // Set up badge notifications with callback to add to celebration queue
  // The onNewBadge callback is the single path for adding badges to the queue.
  // Previously a duplicate useEffect on currentCelebration caused double entries.
  useBadgeNotifications({
    enabled: isAuthenticated,
    pollInterval: 30000, // 30 seconds
    onNewBadge: (userBadge) => {
      // When a new badge is detected, add it to the celebration queue
      if (userBadge.badge) {
        celebrationQueue.add({
          type: "badge",
          priority: getBadgePriority(userBadge.badge),
          data: {
            badge: userBadge.badge,
            userBadge: userBadge,
            points: userBadge.badge.pointsReward,
          },
        });
      }
    },
  });

  // Get the current celebration to render
  const current = celebrationQueue.current;

  // Don't render anything if no celebration is active
  if (!current) {
    return null;
  }

  // Render based on celebration type
  switch (current.type) {
    case "badge":
      return (
        <BadgeUnlockPopup
          badge={current.data.badge}
          userBadge={current.data.userBadge}
          points={current.data.points}
          isOpen={true}
          onClose={celebrationQueue.dismiss}
          onShare={() => {
            // Share functionality - can be expanded
            if (navigator.share) {
              navigator.share({
                title: `I earned the ${current.data.badge.name} badge!`,
                text: `I just unlocked the ${current.data.badge.name} badge on Gynergy! 🏆`,
                url: window.location.origin,
              });
            }
          }}
        />
      );

    case "milestone":
    case "streak":
    case "achievement":
      // Future: Add milestone/streak celebration popups here
      // For now, dismiss and move to next
      celebrationQueue.dismiss();
      return null;

    default:
      return null;
  }
}

// Helper to get badge priority based on rarity
function getBadgePriority(badge: Badge): number {
  const rarityPriority: Record<string, number> = {
    legendary: 100,
    epic: 80,
    rare: 60,
    uncommon: 40,
    common: 20,
  };
  return rarityPriority[badge.rarity] || 20;
}
