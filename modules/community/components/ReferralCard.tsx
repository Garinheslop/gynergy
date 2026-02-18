"use client";

import { FC, useState } from "react";

import { cn } from "@lib/utils/style";
import { ReferralCode, ReferralMilestone, Referral } from "@resources/types/community";

interface ReferralCardProps {
  referralCode: ReferralCode | null;
  referrals: Referral[];
  milestones: ReferralMilestone[];
  stats: {
    totalReferrals: number;
    convertedReferrals: number;
    totalPointsEarned: number;
  };
  isLoading?: boolean;
}

const ReferralCard: FC<ReferralCardProps> = ({
  referralCode,
  referrals,
  milestones,
  stats,
  isLoading,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"share" | "referrals" | "milestones">("share");

  const copyToClipboard = async () => {
    if (!referralCode) return;

    const shareUrl = `${globalThis.location.origin}?ref=${referralCode.code}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnX = () => {
    if (!referralCode) return;
    const shareUrl = `${globalThis.location.origin}?ref=${referralCode.code}`;
    const text = `I'm transforming my life with the 45-Day Awakening Challenge! Join me on this journey:`;
    globalThis.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
  };

  if (isLoading) {
    return (
      <div className="border-border-light bg-bkg-light animate-pulse rounded border p-6">
        <div className="bg-grey-100 mb-4 h-6 w-1/3 rounded" />
        <div className="bg-grey-100 h-10 rounded" />
      </div>
    );
  }

  return (
    <div className="border-border-light bg-bkg-light overflow-hidden rounded border">
      {/* Header */}
      <div className="from-action-700 to-action-500 bg-gradient-to-r p-6 text-white">
        <h3 className="mb-1 text-xl font-bold">Refer Friends, Earn Rewards</h3>
        <p className="text-action-100 text-sm">
          Share your journey and help others transform their lives
        </p>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="rounded bg-white/10 p-3 text-center backdrop-blur">
            <p className="text-2xl font-bold">{stats.totalReferrals}</p>
            <p className="text-action-100 text-xs">Total Referrals</p>
          </div>
          <div className="rounded bg-white/10 p-3 text-center backdrop-blur">
            <p className="text-2xl font-bold">{stats.convertedReferrals}</p>
            <p className="text-action-100 text-xs">Converted</p>
          </div>
          <div className="rounded bg-white/10 p-3 text-center backdrop-blur">
            <p className="text-2xl font-bold">{stats.totalPointsEarned}</p>
            <p className="text-action-100 text-xs">Points Earned</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="border-border-light flex border-b"
        role="tablist"
        aria-label="Referral sections"
      >
        {(["share", "referrals", "milestones"] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "focus-visible:ring-action min-h-[48px] flex-1 px-4 py-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset",
              activeTab === tab
                ? "border-action-600 text-action-600 border-b-2"
                : "text-grey-500 hover:text-content-dark-secondary"
            )}
          >
            {tab === "share" && "Share Link"}
            {tab === "referrals" && `Referrals (${referrals.length})`}
            {tab === "milestones" && "Milestones"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6" role="tabpanel">
        {activeTab === "share" && (
          <div className="space-y-4">
            {/* Referral Code */}
            {referralCode && (
              <>
                <div>
                  <p className="text-content-dark-secondary mb-1 text-sm font-medium">
                    Your Referral Code
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="border-action/30 bg-action-50 text-action-600 flex-1 rounded border-2 border-dashed px-4 py-3 text-center font-mono text-lg font-bold">
                      {referralCode.code}
                    </div>
                    <button
                      onClick={copyToClipboard}
                      aria-label={copied ? "Link copied" : "Copy referral link"}
                      className={cn(
                        "focus-visible:ring-action min-h-[44px] rounded px-4 py-3 font-medium transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                        copied
                          ? "bg-success text-content-dark"
                          : "bg-action text-content-dark hover:bg-action-100"
                      )}
                    >
                      {copied ? "Copied!" : "Copy Link"}
                    </button>
                  </div>
                </div>

                {/* Share Buttons */}
                <div>
                  <p className="text-content-dark-secondary mb-2 text-sm font-medium">
                    Share on Social Media
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={shareOnX}
                      aria-label="Share on X (formerly Twitter)"
                      className="focus-visible:ring-action flex min-h-[44px] items-center gap-2 rounded bg-black px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      Share on X
                    </button>
                    <button
                      onClick={() => {
                        const shareUrl = `${globalThis.location.origin}?ref=${referralCode.code}`;
                        globalThis.open(
                          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
                          "_blank"
                        );
                      }}
                      aria-label="Share on Facebook"
                      className="focus-visible:ring-action bg-facebook flex min-h-[44px] items-center gap-2 rounded px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      Facebook
                    </button>
                    <button
                      onClick={() => {
                        const shareUrl = `${globalThis.location.origin}?ref=${referralCode.code}`;
                        const text = `Join me on the 45-Day Awakening Challenge!`;
                        globalThis.open(
                          `https://wa.me/?text=${encodeURIComponent(text + " " + shareUrl)}`,
                          "_blank"
                        );
                      }}
                      aria-label="Share on WhatsApp"
                      className="focus-visible:ring-action bg-whatsapp flex min-h-[44px] items-center gap-2 rounded px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      WhatsApp
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Incentive Info */}
            <div className="bg-primary/10 rounded p-4">
              <h4 className="text-primary mb-2 font-semibold">Referral Rewards</h4>
              <ul className="text-primary/80 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">+100</span>
                  <span>points for each friend who joins</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">+250</span>
                  <span>bonus for completing your Accountability Trio</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="text-primary h-4 w-4 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                  <span>Unlock exclusive badges as you refer more friends</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === "referrals" && (
          <div>
            {referrals.length === 0 ? (
              <div className="py-8 text-center">
                <div className="bg-action-50 mx-auto flex h-14 w-14 items-center justify-center rounded-full">
                  <svg
                    className="text-action-600 h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <p className="text-content-dark-secondary mt-2 font-medium">No referrals yet</p>
                <p className="text-grey-500 text-sm">Share your link to start earning rewards!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="border-border-light bg-bkg-light-secondary flex items-center justify-between rounded border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-action-50 text-action-600 flex h-10 w-10 items-center justify-center rounded-full">
                        {referral.referred?.firstName?.[0] || "?"}
                      </div>
                      <div>
                        <p className="text-content-dark font-medium">
                          {referral.referred?.firstName} {referral.referred?.lastName}
                        </p>
                        <p className="text-grey-500 text-xs">
                          {new Date(referral.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-xs font-medium",
                          referral.status === "converted"
                            ? "bg-success/20 text-success"
                            : "bg-warning/20 text-warning"
                        )}
                      >
                        {referral.status === "converted" ? "Joined!" : "Pending"}
                      </span>
                      {referral.pointsAwarded > 0 && (
                        <p className="text-success mt-1 text-xs">+{referral.pointsAwarded} pts</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "milestones" && (
          <div className="space-y-3">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className={cn(
                  "rounded border p-4 transition-all",
                  milestone.isAchieved
                    ? "border-success/30 bg-success/10"
                    : "border-border-light bg-bkg-light-secondary"
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {milestone.isAchieved ? (
                        <svg
                          className="text-success h-5 w-5 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="text-grey-500 h-5 w-5 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                          />
                        </svg>
                      )}
                      <h4 className="text-content-dark font-semibold">{milestone.name}</h4>
                    </div>
                    <p className="text-grey-500 mt-1 text-sm">{milestone.description}</p>
                    <p className="text-grey-500 mt-2 text-xs">{milestone.rewardDescription}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-grey-500 text-sm font-medium">
                      {milestone.referralsRequired} referrals
                    </p>
                    {milestone.pointsBonus > 0 && (
                      <p className="text-action-600 text-sm font-bold">
                        +{milestone.pointsBonus} pts
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralCard;
