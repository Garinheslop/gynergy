"use client";

import { useState, useEffect, useCallback } from "react";

import { cn } from "@lib/utils/style";
import { AdminLayout, StatCard } from "@modules/admin";

interface ChallengeDayContent {
  id: string;
  dayNumber: number;
  title: string;
  description?: string;
  videoId?: string;
  reflectionPrompt?: string;
  journalPrompt?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface VideoContent {
  id: string;
  title: string;
  description?: string;
  bunnyVideoId?: string;
  thumbnailUrl?: string;
  duration?: number;
  category?: string;
  isPublished: boolean;
  viewCount: number;
  createdAt: string;
}

interface QuoteContent {
  id: string;
  text: string;
  author?: string;
  category?: string;
  dayNumber?: number;
}

interface ContentStats {
  totalChallengeDays: number;
  totalVideos: number;
  totalQuotes: number;
  totalMeditations: number;
  totalPrompts: number;
  publishedChallengeDays: number;
  draftChallengeDays: number;
}

interface ContentData {
  stats: ContentStats;
  content: {
    challengeDays?: ChallengeDayContent[];
    videos?: VideoContent[];
    quotes?: QuoteContent[];
  };
}

const defaultData: ContentData = {
  stats: {
    totalChallengeDays: 0,
    totalVideos: 0,
    totalQuotes: 0,
    totalMeditations: 0,
    totalPrompts: 0,
    publishedChallengeDays: 0,
    draftChallengeDays: 0,
  },
  content: {},
};

type ContentTab = "challenge" | "videos" | "quotes";

export default function ContentManagementPage() {
  const [data, setData] = useState<ContentData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ContentTab>("challenge");
  const [_editingItem, setEditingItem] = useState<
    ChallengeDayContent | VideoContent | QuoteContent | null
  >(null);
  const [_isEditing, setIsEditing] = useState(false);

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/content");
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      }
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleTogglePublish = async (
    contentType: string,
    item: ChallengeDayContent | VideoContent
  ) => {
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          contentType: contentType === "challenge" ? "challenge_day" : "video",
          data: { ...item, isPublished: !item.isPublished },
        }),
      });

      if (res.ok) {
        fetchContent();
      }
    } catch (error) {
      console.error("Error toggling publish:", error);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const tabs: { id: ContentTab; label: string; icon: string }[] = [
    { id: "challenge", label: "Challenge Days", icon: "gng-calendar" },
    { id: "videos", label: "Video Library", icon: "gng-play" },
    { id: "quotes", label: "Quotes", icon: "gng-quote" },
  ];

  return (
    <AdminLayout title="Content Management" subtitle="Manage challenge content, videos, and quotes">
      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Challenge Days"
          value={data.stats.totalChallengeDays}
          icon="gng-calendar"
        />
        <StatCard
          title="Published"
          value={data.stats.publishedChallengeDays}
          icon="gng-check-circle"
        />
        <StatCard title="Videos" value={data.stats.totalVideos} icon="gng-play" />
        <StatCard title="Quotes" value={data.stats.totalQuotes} icon="gng-message-square" />
        <StatCard title="Meditations" value={data.stats.totalMeditations} icon="gng-headphones" />
      </div>

      {/* Tabs */}
      <div className="bg-grey-800 mb-6 flex items-center gap-1 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id ? "bg-grey-700 text-white" : "text-grey-400 hover:text-white"
            )}
          >
            <i className={tab.icon} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="border-action-500 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Challenge Days Tab */}
          {activeTab === "challenge" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">45-Day Challenge Content</h3>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setIsEditing(true);
                  }}
                  className="bg-action-600 hover:bg-action-700 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
                >
                  <i className="gng-plus" />
                  Add Day
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.content.challengeDays?.map((day) => (
                  <div
                    key={day.id}
                    className={cn(
                      "hover:border-grey-700 rounded-xl border p-4 transition-all",
                      day.isPublished
                        ? "border-action-800 bg-action-900/20"
                        : "border-grey-800 bg-grey-900"
                    )}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="bg-action-600 flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold text-white">
                          {day.dayNumber}
                        </span>
                        <div>
                          <h4 className="font-medium text-white">{day.title}</h4>
                          <span
                            className={cn(
                              "text-xs",
                              day.isPublished ? "text-action-400" : "text-grey-500"
                            )}
                          >
                            {day.isPublished ? "Published" : "Draft"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleTogglePublish("challenge", day)}
                          className={cn(
                            "rounded-lg p-2 transition-colors",
                            day.isPublished
                              ? "text-action-400 hover:bg-action-900"
                              : "text-grey-500 hover:bg-grey-800"
                          )}
                          title={day.isPublished ? "Unpublish" : "Publish"}
                        >
                          <i className={day.isPublished ? "gng-eye" : "gng-eye-off"} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingItem(day);
                            setIsEditing(true);
                          }}
                          className="text-grey-400 hover:bg-grey-800 rounded-lg p-2 transition-colors hover:text-white"
                        >
                          <i className="gng-edit" />
                        </button>
                      </div>
                    </div>

                    {day.description && (
                      <p className="text-grey-400 mb-3 line-clamp-2 text-sm">{day.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2 text-xs">
                      {day.videoId && (
                        <span className="bg-purple/20 text-purple rounded-full px-2 py-0.5">
                          <i className="gng-play mr-1" />
                          Video
                        </span>
                      )}
                      {day.reflectionPrompt && (
                        <span className="rounded-full bg-pink-900 px-2 py-0.5 text-pink-400">
                          <i className="gng-heart mr-1" />
                          Reflection
                        </span>
                      )}
                      {day.journalPrompt && (
                        <span className="bg-warning/20 text-warning rounded-full px-2 py-0.5">
                          <i className="gng-book mr-1" />
                          Journal
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {(!data.content.challengeDays || data.content.challengeDays.length === 0) && (
                <div className="border-grey-800 bg-grey-900 rounded-xl border p-12 text-center">
                  <i className="gng-calendar text-grey-600 mb-4 text-4xl" />
                  <h3 className="mb-2 text-lg font-medium text-white">No Challenge Days</h3>
                  <p className="text-grey-400 mb-4">Start building your 45-day challenge content</p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-action-600 hover:bg-action-700 rounded-lg px-4 py-2 text-sm font-medium text-white"
                  >
                    Create First Day
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Videos Tab */}
          {activeTab === "videos" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Video Library</h3>
                <button className="bg-action-600 hover:bg-action-700 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white">
                  <i className="gng-upload" />
                  Upload Video
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.content.videos?.map((video) => (
                  <div
                    key={video.id}
                    className="border-grey-800 bg-grey-900 overflow-hidden rounded-xl border"
                  >
                    <div className="bg-grey-800 relative aspect-video">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <i className="gng-play text-grey-600 text-4xl" />
                        </div>
                      )}
                      <div className="absolute right-2 bottom-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
                        {formatDuration(video.duration)}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <h4 className="font-medium text-white">{video.title}</h4>
                        <button
                          onClick={() => handleTogglePublish("video", video)}
                          className={cn(
                            "rounded p-1",
                            video.isPublished ? "text-action-400" : "text-grey-500"
                          )}
                        >
                          <i className={video.isPublished ? "gng-eye" : "gng-eye-off"} />
                        </button>
                      </div>
                      {video.category && (
                        <span className="bg-grey-800 text-grey-400 rounded-full px-2 py-0.5 text-xs">
                          {video.category}
                        </span>
                      )}
                      <p className="text-grey-500 mt-2 text-xs">
                        {video.viewCount.toLocaleString()} views
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {(!data.content.videos || data.content.videos.length === 0) && (
                <div className="border-grey-800 bg-grey-900 rounded-xl border p-12 text-center">
                  <i className="gng-play text-grey-600 mb-4 text-4xl" />
                  <h3 className="mb-2 text-lg font-medium text-white">No Videos</h3>
                  <p className="text-grey-400">Upload videos to your library</p>
                </div>
              )}
            </div>
          )}

          {/* Quotes Tab */}
          {activeTab === "quotes" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Daily Quotes</h3>
                <button className="bg-action-600 hover:bg-action-700 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white">
                  <i className="gng-plus" />
                  Add Quote
                </button>
              </div>

              <div className="space-y-3">
                {data.content.quotes?.map((quote) => (
                  <div key={quote.id} className="border-grey-800 bg-grey-900 rounded-xl border p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="mb-2 text-lg text-white italic">&quot;{quote.text}&quot;</p>
                        {quote.author && (
                          <p className="text-action-400 text-sm">— {quote.author}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {quote.dayNumber && (
                          <span className="bg-grey-800 text-grey-400 rounded-full px-2 py-0.5 text-xs">
                            Day {quote.dayNumber}
                          </span>
                        )}
                        <button className="text-grey-400 hover:bg-grey-800 rounded-lg p-2 hover:text-white">
                          <i className="gng-edit" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {(!data.content.quotes || data.content.quotes.length === 0) && (
                <div className="border-grey-800 bg-grey-900 rounded-xl border p-12 text-center">
                  <i className="gng-message-square text-grey-600 mb-4 text-4xl" />
                  <h3 className="mb-2 text-lg font-medium text-white">No Quotes</h3>
                  <p className="text-grey-400">Add inspirational quotes for users</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
