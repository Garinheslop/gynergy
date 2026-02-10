"use client";

import Link from "next/link";

import { cn } from "@lib/utils/style";
import { UserEntitlements, ChallengeAccessType } from "@resources/types/payment";

interface EntitlementBadgeProps {
  entitlements: UserEntitlements | null;
  compact?: boolean;
  showUpgradePrompt?: boolean;
}

export default function EntitlementBadge({
  entitlements,
  compact = false,
  showUpgradePrompt = true,
}: EntitlementBadgeProps) {
  const hasChallenge = entitlements?.hasChallengeAccess ?? false;
  const hasJournal = entitlements?.hasJournalAccess ?? false;
  const hasCommunity = entitlements?.hasCommunityAccess ?? false;
  const accessType = entitlements?.challengeAccessType;

  // Calculate days until expiration
  const getDaysUntilExpiration = (): number | null => {
    if (!entitlements?.challengeExpiresAt) return null;
    const expirationDate = new Date(entitlements.challengeExpiresAt);
    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysUntilExpiration = getDaysUntilExpiration();
  const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration <= 7;
  const isExpired = daysUntilExpiration === 0;

  // No entitlements - show upgrade prompt
  if (!entitlements || (!hasChallenge && !hasJournal && !hasCommunity)) {
    if (!showUpgradePrompt) return null;

    return (
      <Link
        href="/pricing"
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
          "bg-action-100 text-action-800 hover:bg-action-200"
        )}
      >
        <span>Start Your Journey</span>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    );
  }

  // Compact mode - just show a badge
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {hasChallenge && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              isExpired
                ? "bg-red-100 text-red-800"
                : isExpiringSoon
                  ? "bg-amber-100 text-amber-800"
                  : "bg-green-100 text-green-800"
            )}
          >
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Challenge
          </span>
        )}
        {hasJournal && (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
            Journal
          </span>
        )}
      </div>
    );
  }

  // Full mode - detailed access card
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div
        className={cn(
          "border-b px-4 py-3",
          isExpired
            ? "border-red-200 bg-red-50"
            : isExpiringSoon
              ? "border-amber-200 bg-amber-50"
              : "from-action-50 to-action-100 border-gray-200 bg-gradient-to-r"
        )}
      >
        <h3 className="flex items-center gap-2 font-semibold text-gray-900">
          <svg className="text-action-600 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Your Access
        </h3>
      </div>

      <div className="space-y-3 p-4">
        {/* Challenge Access */}
        {hasChallenge && (
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full",
                  isExpired ? "bg-red-100" : isExpiringSoon ? "bg-amber-100" : "bg-green-100"
                )}
              >
                <svg
                  className={cn(
                    "h-4 w-4",
                    isExpired
                      ? "text-red-600"
                      : isExpiringSoon
                        ? "text-amber-600"
                        : "text-green-600"
                  )}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  {isExpired ? (
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  ) : (
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  )}
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">45-Day Awakening Challenge</p>
                <p className="text-sm text-gray-500">
                  {getAccessTypeLabel(accessType ?? null)}
                  {daysUntilExpiration !== null && !isExpired && (
                    <span
                      className={cn("ml-2", isExpiringSoon ? "font-medium text-amber-600" : "")}
                    >
                      · {daysUntilExpiration} days remaining
                    </span>
                  )}
                  {isExpired && <span className="ml-2 font-medium text-red-600">· Expired</span>}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Journal Access */}
        {hasJournal && (
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-purple-100">
              <svg className="h-4 w-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Digital Journal</p>
              <p className="text-sm text-gray-500">Active subscription</p>
            </div>
          </div>
        )}

        {/* Community Access */}
        {hasCommunity && (
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Community Access</p>
              <p className="text-sm text-gray-500">Connect with your cohort</p>
            </div>
          </div>
        )}

        {/* Upgrade prompts */}
        {showUpgradePrompt && !hasJournal && hasChallenge && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <Link
              href="/pricing"
              className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-sm transition-colors hover:bg-gray-100"
            >
              <span className="font-medium text-gray-700">
                Continue your journey with the Digital Journal
              </span>
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function getAccessTypeLabel(accessType: ChallengeAccessType): string {
  switch (accessType) {
    case "purchased":
      return "Full access";
    case "friend_code":
      return "Friend code access";
    default:
      return "Access granted";
  }
}
