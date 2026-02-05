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
        className="flex w-full min-h-[44px] cursor-pointer items-center gap-3 rounded p-2 transition-colors hover:bg-bkg-dark-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action text-left"
        onClick={() => onViewProfile?.(member.id)}
        aria-label={`View profile of ${member.firstName} ${member.lastName}`}
      >
        {/* Avatar */}
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-bkg-dark-800">
          {member.profileImage ? (
            <Image
              src={member.profileImage}
              alt={member.firstName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-action-400 to-action-600 text-sm font-semibold text-content-dark">
              {member.firstName?.[0]}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-content-light">
            {member.firstName} {member.lastName}
          </p>
          <div className="flex items-center gap-2 text-xs text-grey-500">
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
    <article className="rounded border border-border-dark bg-bkg-dark-secondary p-4 transition-shadow hover:shadow-md">
      {/* Header with Avatar */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 overflow-hidden rounded-full bg-bkg-dark-800">
            {member.profileImage ? (
              <Image
                src={member.profileImage}
                alt={member.firstName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-action-400 to-action-600 text-xl font-semibold text-content-dark">
                {member.firstName?.[0]}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-content-light">
              {member.firstName} {member.lastName}
            </h3>
            {member.role !== "member" && (
              <span
                className={cn("rounded-full px-2 py-0.5 text-xs font-medium", roleColors[member.role])}
              >
                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded bg-primary/10 p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-xl">🔥</span>
            <span className="text-2xl font-bold text-primary">{member.streak}</span>
          </div>
          <p className="text-xs text-primary/80">Day Streak</p>
        </div>
        <div className="rounded bg-action/10 p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-xl">⭐</span>
            <span className="text-2xl font-bold text-action">{member.points}</span>
          </div>
          <p className="text-xs text-action/80">Points</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onSendEncouragement?.(member.id)}
          aria-label={`Send encouragement to ${member.firstName}`}
          className="flex-1 min-h-[44px] rounded bg-gradient-to-r from-primary to-primary-500 px-4 py-2 text-sm font-medium text-content-dark transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2"
        >
          💪 Encourage
        </button>
        <button
          onClick={() => onViewProfile?.(member.id)}
          aria-label={`View ${member.firstName}'s profile`}
          className="min-h-[44px] rounded border border-border-dark px-4 py-2 text-sm font-medium text-grey-300 transition-colors hover:bg-bkg-dark-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
        >
          Profile
        </button>
      </div>
    </article>
  );
};

export default MemberCard;
