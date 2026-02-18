"use client";

import { FC } from "react";

import { cn } from "@lib/utils/style";
import { Avatar } from "@modules/common/components/ui";
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
        <Avatar
          src={member.profileImage}
          name={`${member.firstName} ${member.lastName}`}
          size="md"
        />

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="text-content-light truncate font-medium">
            {member.firstName} {member.lastName}
          </p>
          <div className="text-grey-500 flex items-center gap-2 text-xs">
            {member.streak > 0 && (
              <span className="flex items-center gap-1">
                <svg
                  className="text-primary h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                  />
                </svg>
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
          <Avatar
            src={member.profileImage}
            name={`${member.firstName} ${member.lastName}`}
            size="lg"
            className="h-14 w-14"
          />
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
          <div className="flex items-center justify-center gap-1.5">
            <svg
              className="text-primary h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
              />
            </svg>
            <span className="text-primary text-2xl font-bold">{member.streak}</span>
          </div>
          <p className="text-primary/80 text-xs">Day Streak</p>
        </div>
        <div className="bg-action/10 rounded p-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <svg
              className="text-action h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
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
          Encourage
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
