"use client";

import { FC } from "react";

import Image from "next/image";

import { cn } from "@lib/utils/style";
import { CohortMember } from "@resources/types/community";

interface MemberCardProps {
  member: CohortMember;
  onSendEncouragement?: (memberId: string) => void;
  onViewProfile?: (memberId: string) => void;
  isCompact?: boolean;
}

const MemberCard: FC<MemberCardProps> = ({
  member,
  onSendEncouragement,
  onViewProfile,
  isCompact = false,
}) => {
  const roleColors = {
    admin: "bg-purple/20 text-purple",
    moderator: "bg-action/20 text-action",
    member: "bg-bkg-dark-800 text-grey-400",
  };

  if (isCompact) {
    return (
      <button
        className="hover:bg-bkg-dark-800 focus-visible:ring-action flex min-h-[44px] w-full cursor-pointer items-center gap-3 rounded p-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
        onClick={() => onViewProfile?.(member.id)}
        aria-label={`View profile of ${member.firstName} ${member.lastName}`}
      >
        {/* Avatar */}
        <div className="bg-bkg-dark-800 relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
          {member.profileImage ? (
            <Image src={member.profileImage} alt={member.firstName} fill className="object-cover" />
          ) : (
            <div className="from-action-400 to-action-600 text-content-dark flex h-full w-full items-center justify-center bg-gradient-to-br text-sm font-semibold">
              {member.firstName?.[0]}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="text-content-light truncate font-medium">
            {member.firstName} {member.lastName}
          </p>
          <div className="text-grey-500 flex items-center gap-2 text-xs">
            {member.streak > 0 && (
              <span className="flex items-center gap-1">
                <span>🔥</span>
                <span>{member.streak}</span>
              </span>
            )}
            <span>{member.points} pts</span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <article className="border-border-dark bg-bkg-dark-secondary rounded border p-4 transition-shadow hover:shadow-md">
      {/* Header with Avatar */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-bkg-dark-800 relative h-14 w-14 overflow-hidden rounded-full">
            {member.profileImage ? (
              <Image
                src={member.profileImage}
                alt={member.firstName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="from-action-400 to-action-600 text-content-dark flex h-full w-full items-center justify-center bg-gradient-to-br text-xl font-semibold">
                {member.firstName?.[0]}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-content-light font-semibold">
              {member.firstName} {member.lastName}
            </h3>
            {member.role !== "member" && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  roleColors[member.role]
                )}
              >
                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="bg-primary/10 rounded p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-xl">🔥</span>
            <span className="text-primary text-2xl font-bold">{member.streak}</span>
          </div>
          <p className="text-primary/80 text-xs">Day Streak</p>
        </div>
        <div className="bg-action/10 rounded p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-xl">⭐</span>
            <span className="text-action text-2xl font-bold">{member.points}</span>
          </div>
          <p className="text-action/80 text-xs">Points</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onSendEncouragement?.(member.id)}
          aria-label={`Send encouragement to ${member.firstName}`}
          className="from-primary to-primary-500 text-content-dark focus-visible:ring-action min-h-[44px] flex-1 rounded bg-gradient-to-r px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          💪 Encourage
        </button>
        <button
          onClick={() => onViewProfile?.(member.id)}
          aria-label={`View ${member.firstName}'s profile`}
          className="border-border-dark text-grey-300 hover:bg-bkg-dark-800 focus-visible:ring-action min-h-[44px] rounded border px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          Profile
        </button>
      </div>
    </article>
  );
};

export default MemberCard;
