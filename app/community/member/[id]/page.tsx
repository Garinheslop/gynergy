"use client";

import { FC, useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { usePopup } from "@contexts/UsePopup";
import { useSession } from "@contexts/UseSession";
import { triggerHaptic } from "@lib/utils/haptic";
import { MemberProfile, CommunityPost } from "@resources/types/community";

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

      messagePopupObj.open({ popupData: `Encouragement sent to ${member.firstName}! 💪`, popupType: "success" });
      triggerHaptic("success");
    } catch (err: any) {
      messagePopupObj.open({ popupData: err.message, popupType: "error" });
    } finally {
      setIsEncouraging(false);
    }
  };

  if (authenticating || isLoading) {
    return (
      <div className="min-h-screen bg-bkg-dark">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="animate-pulse">
            {/* Header skeleton */}
            <div className="mb-8 flex items-center gap-6">
              <div className="h-24 w-24 rounded-full bg-bkg-dark-800" />
              <div className="space-y-3">
                <div className="h-6 w-48 rounded bg-bkg-dark-800" />
                <div className="h-4 w-32 rounded bg-bkg-dark-800" />
              </div>
            </div>
            {/* Stats skeleton */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded bg-bkg-dark-800" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen bg-bkg-dark">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded border border-danger/30 bg-danger/10 p-6 text-center">
            <p className="text-danger">{error || "Member not found"}</p>
            <Link
              href="/community"
              className="mt-4 inline-block text-action hover:text-action-100"
            >
              Back to Community
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = session?.user?.id === member.id;

  return (
    <div className="min-h-screen bg-bkg-dark">
      {/* Back Button */}
      <div className="border-b border-border-dark bg-bkg-dark-secondary">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link
            href="/community"
            className="inline-flex items-center gap-2 text-grey-400 hover:text-content-light transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Community
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full bg-bkg-dark-800">
            {member.profileImage ? (
              <Image
                src={member.profileImage}
                alt={member.firstName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-action-400 to-action-600 text-3xl font-semibold text-content-dark">
                {member.firstName?.[0]}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-content-light">
              {member.firstName} {member.lastName}
            </h1>
            {member.cohort && (
              <p className="mt-1 text-grey-400">
                Member of <span className="text-action">{member.cohort.name}</span>
              </p>
            )}
            {member.bio && (
              <p className="mt-2 text-grey-300">{member.bio}</p>
            )}
            {member.location && (
              <p className="mt-1 text-sm text-grey-500 flex items-center justify-center sm:justify-start gap-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {member.location}
              </p>
            )}

            {/* Actions */}
            {!isOwnProfile && (
              <button
                onClick={handleEncourage}
                disabled={isEncouraging}
                className="mt-4 min-h-[44px] rounded bg-gradient-to-r from-primary to-primary-500 px-6 py-2 font-medium text-content-dark transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2"
              >
                {isEncouraging ? "Sending..." : "💪 Send Encouragement"}
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {member.showStreak !== false && (
            <div className="rounded border border-border-dark bg-bkg-dark-secondary p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-xl">🔥</span>
                <span className="text-2xl font-bold text-primary">{member.streak}</span>
              </div>
              <p className="text-xs text-grey-500 mt-1">Day Streak</p>
            </div>
          )}
          {member.showPoints !== false && (
            <div className="rounded border border-border-dark bg-bkg-dark-secondary p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-xl">⭐</span>
                <span className="text-2xl font-bold text-action">{member.points}</span>
              </div>
              <p className="text-xs text-grey-500 mt-1">Points</p>
            </div>
          )}
          {member.showBadges !== false && (
            <div className="rounded border border-border-dark bg-bkg-dark-secondary p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-xl">🏅</span>
                <span className="text-2xl font-bold text-purple">{member.badgesCount}</span>
              </div>
              <p className="text-xs text-grey-500 mt-1">Badges</p>
            </div>
          )}
          <div className="rounded border border-border-dark bg-bkg-dark-secondary p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="text-xl">📝</span>
              <span className="text-2xl font-bold text-content-light">{member.postsCount}</span>
            </div>
            <p className="text-xs text-grey-500 mt-1">Posts</p>
          </div>
        </div>

        {/* Recent Posts */}
        {posts.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-content-light mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded border border-border-dark bg-bkg-dark-secondary p-4"
                >
                  <div className="flex items-center gap-2 text-sm text-grey-500 mb-2">
                    <span>{post.postType === "win" ? "🏆" : "💭"}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  {post.title && (
                    <h3 className="font-semibold text-content-light mb-1">{post.title}</h3>
                  )}
                  <p className="text-grey-300 line-clamp-3">{post.content}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-grey-500">
                    <span>{post.reactionCount} reactions</span>
                    <span>{post.commentCount} comments</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {posts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-grey-500">No posts yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberProfilePage;
