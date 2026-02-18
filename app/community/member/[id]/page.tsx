"use client";

import { FC, useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { usePopup } from "@contexts/UsePopup";
import { useSession } from "@contexts/UseSession";
import { triggerHaptic } from "@lib/utils/haptic";
import BadgeShowcase from "@modules/gamification/components/BadgeShowcase";
import { MemberProfile, CommunityPost, POST_TYPE_LABELS } from "@resources/types/community";

const MemberProfilePage: FC = () => {
  const params = useParams();
  const router = useRouter();
  const { session, authenticating } = useSession();
  const { messagePopupObj } = usePopup();

  const [member, setMember] = useState<MemberProfile | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEncouraging, setIsEncouraging] = useState(false);

  const memberId = params.id as string;

  // Redirect if not logged in
  useEffect(() => {
    if (!authenticating && !session?.user) {
      router.push("/login");
    }
  }, [session, authenticating, router]);

  // Fetch member profile
  useEffect(() => {
    const fetchMember = async () => {
      if (!memberId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/community/members/${memberId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch member");
        }

        setMember(data.member);
        setPosts(data.posts || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchMember();
    }
  }, [memberId, session?.user]);

  const handleEncourage = async () => {
    if (isEncouraging || !member) return;

    setIsEncouraging(true);
    try {
      const response = await fetch("/api/community/encourage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send encouragement");
      }

      messagePopupObj.open({
        popupData: `Encouragement sent to ${member.firstName}!`,
        popupType: "success",
      });
      triggerHaptic("success");
    } catch (err: any) {
      messagePopupObj.open({ popupData: err.message, popupType: "error" });
    } finally {
      setIsEncouraging(false);
    }
  };

  if (authenticating || isLoading) {
    return (
      <div className="bg-bkg-dark min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="animate-pulse">
            {/* Header skeleton */}
            <div className="mb-8 flex items-center gap-6">
              <div className="bg-bkg-dark-800 h-24 w-24 rounded-full" />
              <div className="space-y-3">
                <div className="bg-bkg-dark-800 h-6 w-48 rounded" />
                <div className="bg-bkg-dark-800 h-4 w-32 rounded" />
              </div>
            </div>
            {/* Stats skeleton */}
            <div className="mb-8 grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-bkg-dark-800 h-24 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="bg-bkg-dark min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="border-danger/30 bg-danger/10 rounded border p-6 text-center">
            <p className="text-danger">{error || "Member not found"}</p>
            <Link href="/community" className="text-action hover:text-action-100 mt-4 inline-block">
              Back to Community
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = session?.user?.id === member.id;

  return (
    <div className="bg-bkg-dark min-h-screen">
      {/* Back Button */}
      <div className="border-border-dark bg-bkg-dark-secondary border-b">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link
            href="/community"
            className="text-grey-400 hover:text-content-light inline-flex items-center gap-2 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Community
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="bg-bkg-dark-800 relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full">
            {member.profileImage ? (
              <Image
                src={member.profileImage}
                alt={member.firstName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="from-action-400 to-action-600 text-content-dark flex h-full w-full items-center justify-center bg-gradient-to-br text-3xl font-semibold">
                {member.firstName?.[0]}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-content-light text-2xl font-bold">
              {member.firstName} {member.lastName}
            </h1>
            {member.cohort && (
              <p className="text-grey-400 mt-1">
                Member of <span className="text-action">{member.cohort.name}</span>
              </p>
            )}
            {member.bio && <p className="text-grey-300 mt-2">{member.bio}</p>}
            {member.location && (
              <p className="text-grey-500 mt-1 flex items-center justify-center gap-1 text-sm sm:justify-start">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {member.location}
              </p>
            )}

            {/* Actions */}
            {!isOwnProfile && (
              <button
                onClick={handleEncourage}
                disabled={isEncouraging}
                className="from-primary to-primary-500 text-content-dark focus-visible:ring-action mt-4 min-h-[44px] rounded bg-gradient-to-r px-6 py-2 font-medium transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
              >
                {isEncouraging ? "Sending..." : "Send Encouragement"}
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {member.showStreak !== false && (
            <div className="border-border-dark bg-bkg-dark-secondary rounded border p-4 text-center">
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
              <p className="text-grey-500 mt-1 text-xs">Day Streak</p>
            </div>
          )}
          {member.showPoints !== false && (
            <div className="border-border-dark bg-bkg-dark-secondary rounded border p-4 text-center">
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
              <p className="text-grey-500 mt-1 text-xs">Points</p>
            </div>
          )}
          {member.showBadges !== false && (
            <div className="border-border-dark bg-bkg-dark-secondary rounded border p-4 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <svg
                  className="text-purple h-5 w-5"
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
                <span className="text-purple text-2xl font-bold">{member.badgesCount}</span>
              </div>
              <p className="text-grey-500 mt-1 text-xs">Badges</p>
            </div>
          )}
          <div className="border-border-dark bg-bkg-dark-secondary rounded border p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <svg
                className="text-content-light h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span className="text-content-light text-2xl font-bold">{member.postsCount}</span>
            </div>
            <p className="text-grey-500 mt-1 text-xs">Posts</p>
          </div>
        </div>

        {/* Badge Showcase */}
        {member.showBadges !== false && (member.badgesCount ?? 0) > 0 && (
          <div className="mb-8">
            <h2 className="text-content-light mb-4 text-lg font-semibold">Badges</h2>
            <BadgeShowcase userId={member.id} maxBadges={6} size="small" showEmptySlots={false} />
          </div>
        )}

        {/* Recent Posts */}
        {posts.length > 0 && (
          <div>
            <h2 className="text-content-light mb-4 text-lg font-semibold">Recent Activity</h2>
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="border-border-dark bg-bkg-dark-secondary rounded border p-4"
                >
                  <div className="text-grey-500 mb-2 flex items-center gap-2 text-sm">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: POST_TYPE_LABELS[post.postType]?.color || "#6B7280",
                      }}
                    />
                    <span>{POST_TYPE_LABELS[post.postType]?.label || post.postType}</span>
                    <span>·</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  {post.title && (
                    <h3 className="text-content-light mb-1 font-semibold">{post.title}</h3>
                  )}
                  <p className="text-grey-300 line-clamp-3">{post.content}</p>
                  <div className="text-grey-500 mt-2 flex items-center gap-4 text-xs">
                    <span>{post.reactionCount} reactions</span>
                    <span>{post.commentCount} comments</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {posts.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-grey-500">No posts yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberProfilePage;
