"use client";

import { FC, useEffect, useState, useRef, useCallback, KeyboardEvent } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { usePopup } from "@contexts/UsePopup";
import { useSession } from "@contexts/UseSession";
import { useCommunityCallState } from "@lib/hooks/useCommunityCallState";
import { triggerHaptic } from "@lib/utils/haptic";
import { cn } from "@lib/utils/style";
import CommunityCallCard from "@modules/community/components/CommunityCallCard";
import CreatePostModal from "@modules/community/components/CreatePostModal";
import EventsList from "@modules/community/components/EventsList";
import LiveCallBar from "@modules/community/components/LiveCallBar";
import MemberCard from "@modules/community/components/MemberCard";
import PostCard from "@modules/community/components/PostCard";
import ReferralCard from "@modules/community/components/ReferralCard";
import {
  ReactionType,
  PostType,
  PostVisibility,
  POST_TYPE_LABELS,
} from "@resources/types/community";
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

type TabType = "feed" | "members" | "events" | "referrals";
const TABS: TabType[] = ["feed", "members", "events", "referrals"];

const CommunityPage: FC = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { session, authenticating } = useSession();
  const { messagePopupObj } = usePopup();

  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: TabType =
    tabParam && TABS.includes(tabParam as TabType) ? (tabParam as TabType) : "feed";

  const [postTypeFilter, setPostTypeFilter] = useState<string | null>(null);
  const [membersDisplayCount, setMembersDisplayCount] = useState(12);
  const [heroStats, setHeroStats] = useState<{
    totalPosts: number;
    totalMembers: number;
    totalReferrals: number;
  } | null>(null);
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
    handleTabChange(TABS[newIndex]);
    tabRefs.current[newIndex]?.focus();
  };

  // Handle encouragement
  const handleSendEncouragement = async (memberId: string) => {
    const result = await dispatch(sendEncouragement(memberId));
    if (result.success) {
      messagePopupObj.open({ popupData: "Encouragement sent!", popupType: "success" });
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
    membersError,
    cohort,
    referralCode,
    referrals,
    milestones,
    referralsLoading,
    referralsError,
    referralStats,
    createPostOpen,
  } = useSelector((state: RootState) => state.community);

  // Community calls state
  const {
    primaryState: callState,
    upcoming: upcomingEvents,
    past: pastEvents,
    attendees: eventAttendees,
    loading: eventsLoading,
    rsvp: handleRsvp,
  } = useCommunityCallState();

  const isCallLive = callState.state === "live_now" || callState.state === "ending_soon";
  const isCallStartingSoon = callState.state === "starting_soon";

  // Redirect if not logged in
  useEffect(() => {
    if (!authenticating && !session?.user) {
      router.push("/login");
    }
  }, [session, authenticating, router]);

  // Fetch real aggregate stats for hero section
  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/community/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setHeroStats(data);
      })
      .catch(() => {});
  }, [session?.user]);

  // Track which tabs have had their data fetched
  const fetchedTabsRef = useRef<Set<TabType>>(new Set());

  // Lazy-load data per tab — only fetch when tab is first activated
  const ensureTabData = useCallback(
    (tab: TabType) => {
      if (!session?.user || fetchedTabsRef.current.has(tab)) return;
      fetchedTabsRef.current.add(tab);

      switch (tab) {
        case "feed":
          dispatch(fetchFeed());
          break;
        case "members":
          dispatch(fetchMembers());
          break;
        case "referrals":
          dispatch(fetchReferrals());
          break;
        // Events are fetched by useCommunityCallState hook automatically
      }
    },
    [dispatch, session?.user]
  );

  // Fetch data for the active tab
  useEffect(() => {
    ensureTabData(activeTab);
  }, [activeTab, ensureTabData]);

  // Handle tab change — sync with URL for deep linking + back button
  const handleTabChange = (tab: TabType) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "feed") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const query = params.toString();
    router.push(`/community${query ? `?${query}` : ""}`, { scroll: false });
  };

  // Handle post creation
  const handleCreatePost = async (data: {
    postType: PostType;
    title?: string;
    content: string;
    visibility: PostVisibility;
    mediaUrls?: string[];
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
      <div
        className={cn(
          "bg-gradient-to-br transition-colors duration-500",
          isCallLive
            ? "from-action-800 via-action-700 to-danger/30"
            : "from-action-700 via-action-600 to-action-400"
        )}
      >
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="text-center text-white">
            {isCallLive && callState.event ? (
              <>
                <div className="mb-3 flex items-center justify-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                  </span>
                  <span className="text-sm font-bold tracking-wider text-red-300 uppercase">
                    Live Now
                  </span>
                </div>
                <h1 className="mb-2 text-4xl font-bold">{callState.event.title}</h1>
                <p className="text-action-100 mb-8 text-lg">Hosted by {callState.event.hostName}</p>
                <div className="mx-auto grid max-w-2xl grid-cols-3 gap-4">
                  <div className="rounded bg-white/10 p-4 backdrop-blur">
                    <p className="text-3xl font-bold">{callState.event.participantCount}</p>
                    <p className="text-action-100 text-sm">Joined</p>
                  </div>
                  <div className="rounded bg-white/10 p-4 backdrop-blur">
                    <p className="text-3xl font-bold">{callState.minutesRemaining ?? 0}</p>
                    <p className="text-action-100 text-sm">Min Remaining</p>
                  </div>
                  <button
                    onClick={() => router.push(`/community/call/${callState.event!.roomId}`)}
                    className="from-primary to-primary-500 focus-visible:ring-action min-h-[56px] rounded bg-gradient-to-r p-4 font-bold text-white transition-all hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none active:scale-95"
                  >
                    Join Now
                  </button>
                </div>
              </>
            ) : isCallStartingSoon && callState.event ? (
              <>
                <h1 className="mb-2 text-4xl font-bold">Gynergy Community</h1>
                <p className="text-action-100 mb-2 text-lg">
                  Connect, share wins, and grow together on your 45-Day Awakening Journey
                </p>
                <p className="mb-8 text-sm font-semibold text-yellow-200">
                  {callState.event.title} starts in {Math.max(0, callState.minutesUntilStart ?? 0)}{" "}
                  minutes
                </p>
                <div className="mx-auto grid max-w-2xl grid-cols-3 gap-4">
                  <div className="rounded bg-white/10 p-4 backdrop-blur">
                    <p className="text-3xl font-bold">
                      {heroStats?.totalMembers ?? members.length}
                    </p>
                    <p className="text-action-100 text-sm">Community Members</p>
                  </div>
                  <div className="rounded bg-white/10 p-4 backdrop-blur">
                    <p className="text-3xl font-bold">{callState.event.rsvpCount}</p>
                    <p className="text-action-100 text-sm">RSVPs</p>
                  </div>
                  <button
                    onClick={() => router.push(`/community/call/${callState.event!.roomId}`)}
                    className="bg-action focus-visible:ring-action text-content-dark min-h-[56px] rounded p-4 font-bold transition-all hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none active:scale-95"
                  >
                    Join Early
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="mb-2 text-4xl font-bold">Gynergy Community</h1>
                <p className="text-action-100 mb-8 text-lg">
                  Connect, share wins, and grow together on your 45-Day Awakening Journey
                </p>
                <div className="mx-auto grid max-w-2xl grid-cols-3 gap-4">
                  <div className="rounded bg-white/10 p-4 backdrop-blur">
                    <p className="text-3xl font-bold">
                      {heroStats?.totalMembers ?? members.length}
                    </p>
                    <p className="text-action-100 text-sm">Community Members</p>
                  </div>
                  <div className="rounded bg-white/10 p-4 backdrop-blur">
                    <p className="text-3xl font-bold">{heroStats?.totalPosts ?? posts.length}</p>
                    <p className="text-action-100 text-sm">Wins Shared</p>
                  </div>
                  <div className="rounded bg-white/10 p-4 backdrop-blur">
                    <p className="text-3xl font-bold">
                      {heroStats?.totalReferrals ?? referralStats.totalReferrals}
                    </p>
                    <p className="text-action-100 text-sm">Friends Invited</p>
                  </div>
                </div>
              </>
            )}
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
                  {tab === "events" && (
                    <span className="flex items-center gap-2">
                      Events
                      {isCallLive && (
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                        </span>
                      )}
                    </span>
                  )}
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
                {Object.entries(POST_TYPE_LABELS).map(([type, { label, color }]) => (
                  <button
                    key={type}
                    onClick={() => handleFilterChange(type)}
                    aria-pressed={postTypeFilter === type}
                    className={cn(
                      "focus-visible:ring-action flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
                      postTypeFilter === type
                        ? "bg-action text-content-dark"
                        : "bg-bkg-dark-secondary text-grey-400 hover:bg-bkg-dark-800"
                    )}
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
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
                  <div className="bg-action/20 mx-auto flex h-14 w-14 items-center justify-center rounded-full">
                    <svg
                      className="text-action h-7 w-7"
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
                  </div>
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
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={session?.user?.id}
                        onReact={handleReaction}
                      />
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
              {/* Next/Live Community Call */}
              {callState.event && callState.state !== "no_events" && (
                <CommunityCallCard
                  event={callState.event}
                  state={callState.state}
                  onRsvp={handleRsvp}
                />
              )}

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
                  onClick={() => handleTabChange("members")}
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
                  onClick={() => handleTabChange("referrals")}
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
            ) : membersError ? (
              <div className="border-border-dark bg-bkg-dark-secondary rounded border py-12 text-center">
                <div className="bg-danger/20 mx-auto flex h-14 w-14 items-center justify-center rounded-full">
                  <svg
                    className="text-danger h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-content-light mt-4 text-lg font-semibold">
                  Failed to load members
                </h3>
                <p className="text-grey-500 mt-1">{membersError}</p>
                <button
                  onClick={() => dispatch(fetchMembers())}
                  className="bg-action text-content-dark hover:bg-action-100 mt-4 min-h-[44px] rounded px-6 py-2 font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : members.length === 0 ? (
              <div className="border-border-dark bg-bkg-dark-secondary rounded border py-12 text-center">
                <div className="bg-action/20 mx-auto flex h-14 w-14 items-center justify-center rounded-full">
                  <svg
                    className="text-action h-7 w-7"
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
                    .slice(0, membersDisplayCount)
                    .map((member) => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        onSendEncouragement={handleSendEncouragement}
                        onViewProfile={handleViewProfile}
                      />
                    ))}
                </div>

                {/* Show More */}
                {members.length > membersDisplayCount && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setMembersDisplayCount((prev) => prev + 12)}
                      className="bg-bkg-dark-secondary text-grey-400 hover:bg-bkg-dark-800 hover:text-content-light border-border-dark min-h-[44px] rounded-full border px-8 py-2 font-medium transition-colors"
                    >
                      Show More ({members.length - membersDisplayCount} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <div role="tabpanel" id="tabpanel-events" aria-labelledby="tab-events">
            <EventsList
              upcoming={upcomingEvents}
              past={pastEvents}
              attendees={eventAttendees}
              loading={eventsLoading}
              onRsvp={handleRsvp}
            />
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
            {referralsError ? (
              <div className="border-border-dark bg-bkg-dark-secondary rounded border py-12 text-center">
                <div className="bg-danger/20 mx-auto flex h-14 w-14 items-center justify-center rounded-full">
                  <svg
                    className="text-danger h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-content-light mt-4 text-lg font-semibold">
                  Failed to load referrals
                </h3>
                <p className="text-grey-500 mt-1">{referralsError}</p>
                <button
                  onClick={() => dispatch(fetchReferrals())}
                  className="bg-action text-content-dark hover:bg-action-100 mt-4 min-h-[44px] rounded px-6 py-2 font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <ReferralCard
                referralCode={referralCode}
                referrals={referrals}
                milestones={milestones}
                stats={referralStats}
                isLoading={referralsLoading}
              />
            )}

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
                <div className="bg-action/20 flex h-12 w-12 items-center justify-center rounded-full">
                  <svg
                    className="text-action h-6 w-6"
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
                      {referralStats.convertedReferrals >= 1 ? (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        "1"
                      )}
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
                      {referralStats.convertedReferrals >= 2 ? (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        "2"
                      )}
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

      {/* Mobile Live Call Bar */}
      {callState.event && (isCallLive || isCallStartingSoon) && (
        <LiveCallBar event={callState.event} state={callState.state} />
      )}

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
