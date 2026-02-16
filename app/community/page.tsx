"use client";

import { FC, useEffect, useState, useRef, KeyboardEvent } from "react";

import { useRouter } from "next/navigation";

import { usePopup } from "@contexts/UsePopup";
import { useSession } from "@contexts/UseSession";
import { triggerHaptic } from "@lib/utils/haptic";
import { cn } from "@lib/utils/style";
import CreatePostModal from "@modules/community/components/CreatePostModal";
import MemberCard from "@modules/community/components/MemberCard";
import PostCard from "@modules/community/components/PostCard";
import ReferralCard from "@modules/community/components/ReferralCard";
import { ReactionType, PostType, PostVisibility } from "@resources/types/community";
import { RootState } from "@store/configureStore";
import { useSelector, useDispatch } from "@store/hooks";
import {
  fetchFeed,
  fetchMembers,
  fetchReferrals,
  createPost,
  toggleReaction,
  setCreatePostOpen,
  sendEncouragement,
} from "@store/modules/community";

type TabType = "feed" | "members" | "referrals";
const TABS: TabType[] = ["feed", "members", "referrals"];

const CommunityPage: FC = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { session, authenticating } = useSession();
  const { messagePopupObj } = usePopup();

  const [activeTab, setActiveTab] = useState<TabType>("feed");
  const [postTypeFilter, setPostTypeFilter] = useState<string | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Handle tab keyboard navigation (WAI-ARIA pattern)
  const handleTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let newIndex: number | null = null;

    switch (e.key) {
      case "ArrowRight":
        newIndex = (index + 1) % TABS.length;
        break;
      case "ArrowLeft":
        newIndex = (index - 1 + TABS.length) % TABS.length;
        break;
      case "Home":
        newIndex = 0;
        break;
      case "End":
        newIndex = TABS.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    setActiveTab(TABS[newIndex]);
    tabRefs.current[newIndex]?.focus();
  };

  // Handle encouragement
  const handleSendEncouragement = async (memberId: string) => {
    const result = await dispatch(sendEncouragement(memberId));
    if (result.success) {
      messagePopupObj.open({ popupData: "Encouragement sent! 💪", popupType: "success" });
      triggerHaptic("success");
    } else {
      messagePopupObj.open({
        popupData: result.error || "Failed to send encouragement",
        popupType: "error",
      });
    }
  };

  // Handle view profile
  const handleViewProfile = (memberId: string) => {
    router.push(`/community/member/${memberId}`);
  };

  // Redux state
  const profile = useSelector((state: RootState) => state.profile.current);
  const {
    posts,
    feedLoading,
    feedError,
    hasMore,
    members,
    membersLoading,
    cohort,
    referralCode,
    referrals,
    milestones,
    referralsLoading,
    referralStats,
    createPostOpen,
  } = useSelector((state: RootState) => state.community);

  // Redirect if not logged in
  useEffect(() => {
    if (!authenticating && !session?.user) {
      router.push("/login");
    }
  }, [session, authenticating, router]);

  // Fetch data on mount
  useEffect(() => {
    if (session?.user) {
      dispatch(fetchFeed());
      dispatch(fetchMembers());
      dispatch(fetchReferrals());
    }
  }, [dispatch, session?.user]);

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Handle post creation
  const handleCreatePost = async (data: {
    postType: PostType;
    title?: string;
    content: string;
    visibility: PostVisibility;
  }) => {
    const result = await dispatch(createPost(data));
    return result as { success: boolean; error?: string };
  };

  // Handle reaction
  const handleReaction = (postId: string, reactionType: ReactionType) => {
    dispatch(toggleReaction(postId, reactionType));
  };

  // Handle load more
  const handleLoadMore = () => {
    if (hasMore && !feedLoading) {
      dispatch(fetchFeed({ append: true, postType: postTypeFilter || undefined }));
    }
  };

  // Handle filter change
  const handleFilterChange = (type: string | null) => {
    setPostTypeFilter(type);
    dispatch(fetchFeed({ postType: type || undefined }));
  };

  if (authenticating) {
    return (
      <div className="bg-bkg-dark flex min-h-screen items-center justify-center">
        <div className="border-action-100 border-t-action h-12 w-12 animate-spin rounded-full border-4" />
      </div>
    );
  }

  return (
    <div className="bg-bkg-dark min-h-screen">
      {/* Hero Header */}
      <div className="from-action-700 via-action-600 to-action-400 bg-gradient-to-br">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="text-center text-white">
            <h1 className="mb-2 text-4xl font-bold">Gynergy Community</h1>
            <p className="text-action-100 mb-8 text-lg">
              Connect, share wins, and grow together on your 45-Day Awakening Journey
            </p>

            {/* Quick Stats */}
            <div className="mx-auto grid max-w-2xl grid-cols-3 gap-4">
              <div className="rounded bg-white/10 p-4 backdrop-blur">
                <p className="text-3xl font-bold">{members.length}</p>
                <p className="text-action-100 text-sm">Community Members</p>
              </div>
              <div className="rounded bg-white/10 p-4 backdrop-blur">
                <p className="text-3xl font-bold">{posts.length}</p>
                <p className="text-action-100 text-sm">Wins Shared</p>
              </div>
              <div className="rounded bg-white/10 p-4 backdrop-blur">
                <p className="text-3xl font-bold">{referralStats.totalReferrals}</p>
                <p className="text-action-100 text-sm">Friends Invited</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex" role="tablist" aria-label="Community sections">
              {TABS.map((tab, index) => (
                <button
                  key={tab}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  role="tab"
                  id={`tab-${tab}`}
                  aria-selected={activeTab === tab}
                  aria-controls={`tabpanel-${tab}`}
                  tabIndex={activeTab === tab ? 0 : -1}
                  onClick={() => handleTabChange(tab)}
                  onKeyDown={(e) => handleTabKeyDown(e, index)}
                  className={cn(
                    "focus-visible:ring-action relative min-h-[48px] flex-1 px-6 py-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                    activeTab === tab ? "text-white" : "text-action-100 hover:text-white"
                  )}
                >
                  {tab === "feed" && "Activity Feed"}
                  {tab === "members" && `Members (${members.length})`}
                  {tab === "referrals" && "Invite Friends"}
                  {activeTab === tab && (
                    <div className="absolute right-0 bottom-0 left-0 h-1 bg-white" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Feed Tab */}
        {activeTab === "feed" && (
          <div
            role="tabpanel"
            id="tabpanel-feed"
            aria-labelledby="tab-feed"
            className="grid gap-8 lg:grid-cols-3"
          >
            {/* Main Feed */}
            <div className="space-y-6 lg:col-span-2">
              {/* Create Post CTA */}
              <div className="border-border-dark bg-bkg-dark-secondary rounded border p-4">
                <div className="flex items-center gap-4">
                  <div className="from-action-400 to-action-600 h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br">
                    {profile?.profileImage ? (
                      <img
                        src={profile.profileImage}
                        alt={profile.firstName || "You"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-content-dark flex h-full w-full items-center justify-center text-lg font-semibold">
                        {profile?.firstName?.[0] || "Y"}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => dispatch(setCreatePostOpen(true))}
                    className="border-border-dark bg-bkg-dark text-grey-500 hover:bg-bkg-dark-800 focus-visible:ring-action min-h-[44px] flex-1 rounded-full border px-6 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    Share a win or reflection...
                  </button>
                </div>
              </div>

              {/* Post Type Filters */}
              <fieldset className="m-0 flex flex-wrap gap-2 border-none p-0">
                <legend className="sr-only">Filter posts by type</legend>
                <button
                  onClick={() => handleFilterChange(null)}
                  aria-pressed={!postTypeFilter}
                  className={cn(
                    "focus-visible:ring-action min-h-[44px] rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
                    !postTypeFilter
                      ? "bg-action text-content-dark"
                      : "bg-bkg-dark-secondary text-grey-400 hover:bg-bkg-dark-800"
                  )}
                >
                  All Posts
                </button>
                {[
                  { type: "win", label: "Wins", emoji: "🏆" },
                  { type: "reflection", label: "Reflections", emoji: "💭" },
                  { type: "milestone", label: "Milestones", emoji: "🎯" },
                  { type: "celebration", label: "Celebrations", emoji: "🎉" },
                ].map(({ type, label, emoji }) => (
                  <button
                    key={type}
                    onClick={() => handleFilterChange(type)}
                    aria-pressed={postTypeFilter === type}
                    className={cn(
                      "focus-visible:ring-action flex min-h-[44px] items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
                      postTypeFilter === type
                        ? "bg-action text-content-dark"
                        : "bg-bkg-dark-secondary text-grey-400 hover:bg-bkg-dark-800"
                    )}
                  >
                    <span>{emoji}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </fieldset>

              {/* Posts */}
              {feedLoading && posts.length === 0 ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="border-border-dark bg-bkg-dark-secondary animate-pulse rounded border p-6"
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <div className="bg-bkg-dark-800 h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <div className="bg-bkg-dark-800 h-4 w-32 rounded" />
                          <div className="bg-bkg-dark-800 h-3 w-24 rounded" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="bg-bkg-dark-800 h-4 w-full rounded" />
                        <div className="bg-bkg-dark-800 h-4 w-3/4 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : feedError ? (
                <div className="border-danger/30 bg-danger/10 rounded border p-6 text-center">
                  <p className="text-danger">{feedError}</p>
                  <button
                    onClick={() => dispatch(fetchFeed())}
                    className="text-danger focus-visible:ring-action mt-2 text-sm font-medium underline focus-visible:ring-2 focus-visible:outline-none"
                  >
                    Try again
                  </button>
                </div>
              ) : posts.length === 0 ? (
                <div className="border-border-dark bg-bkg-dark-secondary rounded border py-12 text-center">
                  <p className="text-5xl">🌟</p>
                  <h3 className="text-content-light mt-4 text-lg font-semibold">No posts yet</h3>
                  <p className="text-grey-500 mt-1">
                    Be the first to share a win with the community!
                  </p>
                  <button
                    onClick={() => dispatch(setCreatePostOpen(true))}
                    className="bg-action text-content-dark hover:bg-action-100 focus-visible:ring-action mt-4 min-h-[44px] rounded px-6 py-2 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    Share Your Win
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} onReact={handleReaction} />
                    ))}
                  </div>

                  {hasMore && (
                    <div className="text-center">
                      <button
                        onClick={handleLoadMore}
                        disabled={feedLoading}
                        className="bg-bkg-dark-secondary text-content-light hover:bg-bkg-dark-800 focus-visible:ring-action min-h-[44px] rounded px-6 py-3 font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
                      >
                        {feedLoading ? "Loading..." : "Load More"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Cohort Info */}
              {cohort && (
                <div className="border-border-dark bg-bkg-dark-secondary rounded border p-4">
                  <h3 className="text-content-light mb-3 font-semibold">Your Cohort</h3>
                  <div className="from-action-900 to-action-800 rounded bg-gradient-to-r p-4">
                    <p className="text-action-200 font-bold">{cohort.name}</p>
                    <p className="text-action-300 text-sm">{members.length} members</p>
                  </div>
                </div>
              )}

              {/* Top Members */}
              <div className="border-border-dark bg-bkg-dark-secondary rounded border p-4">
                <h3 className="text-content-light mb-3 font-semibold">Top Streakers</h3>
                <div className="space-y-1">
                  {members
                    .slice()
                    .sort((a, b) => b.streak - a.streak)
                    .slice(0, 5)
                    .map((member, index) => (
                      <div key={member.id} className="flex items-center gap-2">
                        <span className="text-grey-500 w-6 text-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <MemberCard member={member} isCompact onViewProfile={handleViewProfile} />
                      </div>
                    ))}
                </div>
                <button
                  onClick={() => setActiveTab("members")}
                  className="text-action hover:text-action-100 focus-visible:ring-action mt-3 min-h-[44px] w-full text-center text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
                >
                  View All Members
                </button>
              </div>

              {/* Quick Referral */}
              <div className="border-primary/30 from-primary/20 to-primary-500/20 rounded border bg-gradient-to-br p-4">
                <h3 className="text-primary mb-2 font-semibold">Invite Friends & Earn</h3>
                <p className="text-primary/80 mb-3 text-sm">
                  Get 100 points for each friend who joins your journey!
                </p>
                <button
                  onClick={() => setActiveTab("referrals")}
                  className="from-primary to-primary-500 text-content-dark focus-visible:ring-action min-h-[44px] w-full rounded bg-gradient-to-r py-2 font-medium transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none"
                >
                  Share Your Link
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <div role="tabpanel" id="tabpanel-members" aria-labelledby="tab-members">
            {membersLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="border-border-dark bg-bkg-dark-secondary animate-pulse rounded border p-4"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="bg-bkg-dark-800 h-14 w-14 rounded-full" />
                      <div className="space-y-2">
                        <div className="bg-bkg-dark-800 h-4 w-24 rounded" />
                        <div className="bg-bkg-dark-800 h-3 w-16 rounded" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-bkg-dark-800 h-16 rounded" />
                      <div className="bg-bkg-dark-800 h-16 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : members.length === 0 ? (
              <div className="border-border-dark bg-bkg-dark-secondary rounded border py-12 text-center">
                <p className="text-5xl">👥</p>
                <h3 className="text-content-light mt-4 text-lg font-semibold">No members yet</h3>
                <p className="text-grey-500 mt-1">Invite friends to join your cohort!</p>
              </div>
            ) : (
              <>
                {/* Member Stats */}
                <div className="mb-6 grid gap-4 sm:grid-cols-3">
                  <div className="border-border-dark bg-bkg-dark-secondary rounded border p-4 text-center">
                    <p className="text-action text-3xl font-bold">{members.length}</p>
                    <p className="text-grey-500 text-sm">Total Members</p>
                  </div>
                  <div className="border-border-dark bg-bkg-dark-secondary rounded border p-4 text-center">
                    <p className="text-primary text-3xl font-bold">
                      {members.filter((m) => m.streak > 0).length}
                    </p>
                    <p className="text-grey-500 text-sm">Active Today</p>
                  </div>
                  <div className="border-border-dark bg-bkg-dark-secondary rounded border p-4 text-center">
                    <p className="text-success text-3xl font-bold">
                      {Math.max(...members.map((m) => m.streak), 0)}
                    </p>
                    <p className="text-grey-500 text-sm">Highest Streak</p>
                  </div>
                </div>

                {/* Member Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {members
                    .slice()
                    .sort((a, b) => b.points - a.points)
                    .map((member) => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        onSendEncouragement={handleSendEncouragement}
                        onViewProfile={handleViewProfile}
                      />
                    ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === "referrals" && (
          <div
            className="mx-auto max-w-2xl"
            role="tabpanel"
            id="tabpanel-referrals"
            aria-labelledby="tab-referrals"
          >
            <ReferralCard
              referralCode={referralCode}
              referrals={referrals}
              milestones={milestones}
              stats={referralStats}
              isLoading={referralsLoading}
            />

            {/* How It Works */}
            <div className="border-border-dark bg-bkg-dark-secondary mt-8 rounded border p-6">
              <h3 className="text-content-light mb-4 text-xl font-bold">How Referrals Work</h3>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center">
                  <div className="bg-action/20 text-action mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full text-2xl">
                    1
                  </div>
                  <h4 className="text-content-light font-semibold">Share Your Link</h4>
                  <p className="text-grey-500 mt-1 text-sm">
                    Copy your unique referral link and share it with friends
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-action/20 text-action mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full text-2xl">
                    2
                  </div>
                  <h4 className="text-content-light font-semibold">Friends Join</h4>
                  <p className="text-grey-500 mt-1 text-sm">
                    When they sign up using your link, they become part of your network
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-action/20 text-action mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full text-2xl">
                    3
                  </div>
                  <h4 className="text-content-light font-semibold">Earn Rewards</h4>
                  <p className="text-grey-500 mt-1 text-sm">
                    Get 100 points per referral + unlock milestone bonuses!
                  </p>
                </div>
              </div>
            </div>

            {/* Accountability Trio */}
            <div className="border-action/30 from-action-900/50 to-action-800/50 mt-6 rounded border-2 border-dashed bg-gradient-to-r p-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">👥</div>
                <div>
                  <h3 className="text-action font-bold">Build Your Accountability Trio</h3>
                  <p className="text-action-200 mt-1 text-sm">
                    Research shows that groups of 3 have the highest completion rates (78%!). Invite
                    2 friends to form your Accountability Trio and support each other through the
                    45-day journey.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                        referralStats.convertedReferrals >= 1
                          ? "bg-success text-content-dark"
                          : "bg-bkg-dark-800 text-grey-500"
                      )}
                    >
                      {referralStats.convertedReferrals >= 1 ? "✓" : "1"}
                    </div>
                    <div className="bg-bkg-dark-800 h-1 w-8" />
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                        referralStats.convertedReferrals >= 2
                          ? "bg-success text-content-dark"
                          : "bg-bkg-dark-800 text-grey-500"
                      )}
                    >
                      {referralStats.convertedReferrals >= 2 ? "✓" : "2"}
                    </div>
                    <div className="bg-bkg-dark-800 h-1 w-8" />
                    <div className="bg-action text-content-dark flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
                      You
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={createPostOpen}
        onClose={() => dispatch(setCreatePostOpen(false))}
        onSubmit={handleCreatePost}
        userImage={profile?.profileImage}
        userName={profile?.firstName}
      />
    </div>
  );
};

export default CommunityPage;
