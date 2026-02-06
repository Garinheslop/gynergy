"use client";

import { useState, useEffect, useCallback } from "react";

import { cn } from "@lib/utils/style";
import { AdminLayout, StatCard } from "@modules/admin";

interface ModerationItem {
  id: string;
  content_type: string;
  content_id: string;
  content_preview: string;
  reported_by?: string;
  report_reason?: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "pending" | "in_review" | "approved" | "rejected" | "escalated";
  ai_risk_score?: number;
  ai_risk_factors?: string[];
  ai_recommendation?: string;
  created_at: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution_note?: string;
}

interface ModerationStats {
  pending: number;
  inReview: number;
  approved: number;
  rejected: number;
  escalated: number;
}

interface ModerationData {
  queue: ModerationItem[];
  stats: ModerationStats;
  recentActivity: {
    posts: Array<{ id: string; content: string; created_at: string; is_flagged?: boolean }>;
    comments: Array<{ id: string; content: string; created_at: string; is_flagged?: boolean }>;
    flaggedPosts: number;
    flaggedComments: number;
  };
}

const defaultData: ModerationData = {
  queue: [],
  stats: {
    pending: 0,
    inReview: 0,
    approved: 0,
    rejected: 0,
    escalated: 0,
  },
  recentActivity: {
    posts: [],
    comments: [],
    flaggedPosts: 0,
    flaggedComments: 0,
  },
};

export default function CommunityModerationPage() {
  const [data, setData] = useState<ModerationData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [contentTypeFilter, setContentTypeFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [isActioning, setIsActioning] = useState(false);

  const fetchModerationData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        contentType: contentTypeFilter,
      });
      const res = await fetch(`/api/admin/community?${params}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      }
    } catch (error) {
      console.error("Error fetching moderation data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, contentTypeFilter]);

  useEffect(() => {
    fetchModerationData();
  }, [fetchModerationData]);

  const handleAction = async (itemId: string, action: string) => {
    setIsActioning(true);
    try {
      const res = await fetch("/api/admin/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, action, note: actionNote }),
      });

      if (res.ok) {
        setSelectedItem(null);
        setActionNote("");
        await fetchModerationData();
      }
    } catch (error) {
      console.error("Error performing moderation action:", error);
    } finally {
      setIsActioning(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-error text-white";
      case "high":
        return "bg-warning text-grey-900";
      case "normal":
        return "bg-action-600 text-white";
      default:
        return "bg-grey-600 text-white";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning/20 text-warning";
      case "in_review":
        return "bg-purple/20 text-purple";
      case "approved":
        return "bg-action-900 text-action-400";
      case "rejected":
        return "bg-error/20 text-error";
      case "escalated":
        return "bg-grey-600 text-white";
      default:
        return "bg-grey-700 text-grey-400";
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return "text-error";
    if (score >= 50) return "text-warning";
    return "text-action-400";
  };

  return (
    <AdminLayout title="Community Moderation" subtitle="Content review and moderation queue">
      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Pending Review" value={data.stats.pending} icon="gng-clock" />
        <StatCard title="In Review" value={data.stats.inReview} icon="gng-eye" />
        <StatCard title="Approved" value={data.stats.approved} icon="gng-check" />
        <StatCard title="Rejected" value={data.stats.rejected} icon="gng-x" />
        <StatCard title="Escalated" value={data.stats.escalated} icon="gng-alert-triangle" />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-grey-400 text-sm">Status:</span>
          {["pending", "in_review", "escalated", "all"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                statusFilter === status
                  ? "bg-action-600 text-white"
                  : "bg-grey-800 text-grey-400 hover:bg-grey-700"
              )}
            >
              {status === "in_review"
                ? "In Review"
                : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-grey-400 text-sm">Type:</span>
          {["all", "post", "comment", "profile"].map((type) => (
            <button
              key={type}
              onClick={() => setContentTypeFilter(type)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                contentTypeFilter === type
                  ? "bg-action-600 text-white"
                  : "bg-grey-800 text-grey-400 hover:bg-grey-700"
              )}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <button
          onClick={fetchModerationData}
          disabled={isLoading}
          className="bg-grey-800 text-grey-400 hover:bg-grey-700 ml-auto flex items-center gap-2 rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          <i className={`gng-refresh ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Queue */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Queue List */}
        <div className="lg:col-span-2">
          <div className="border-grey-800 bg-grey-900 rounded-xl border">
            <div className="border-grey-800 border-b p-4">
              <h3 className="font-semibold text-white">Moderation Queue</h3>
            </div>

            {isLoading ? (
              <div className="text-grey-500 p-8 text-center">Loading...</div>
            ) : data.queue.length === 0 ? (
              <div className="text-grey-500 p-8 text-center">
                <i className="gng-check-circle text-action-400 mb-2 text-3xl" />
                <p>No items in queue</p>
              </div>
            ) : (
              <div className="divide-grey-800 divide-y">
                {data.queue.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={cn(
                      "hover:bg-grey-800/50 cursor-pointer p-4 transition-colors",
                      selectedItem?.id === item.id && "bg-grey-800"
                    )}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-xs font-medium",
                            getPriorityColor(item.priority)
                          )}
                        >
                          {item.priority.toUpperCase()}
                        </span>
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-xs font-medium",
                            getStatusColor(item.status)
                          )}
                        >
                          {item.status.replace("_", " ")}
                        </span>
                        <span className="bg-grey-700 text-grey-300 rounded px-2 py-0.5 text-xs">
                          {item.content_type}
                        </span>
                      </div>
                      {item.ai_risk_score !== undefined && (
                        <span
                          className={cn(
                            "text-sm font-medium",
                            getRiskScoreColor(item.ai_risk_score)
                          )}
                        >
                          Risk: {item.ai_risk_score}%
                        </span>
                      )}
                    </div>

                    <p className="text-grey-300 mb-2 line-clamp-2 text-sm">
                      {item.content_preview || "No preview available"}
                    </p>

                    {item.report_reason && (
                      <p className="text-grey-500 text-xs">
                        <i className="gng-flag mr-1" />
                        Reported: {item.report_reason}
                      </p>
                    )}

                    <p className="text-grey-500 mt-2 text-xs">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          <div className="border-grey-800 bg-grey-900 sticky top-6 rounded-xl border">
            {selectedItem ? (
              <>
                <div className="border-grey-800 border-b p-4">
                  <h3 className="font-semibold text-white">Review Content</h3>
                </div>

                <div className="p-4">
                  {/* Content Preview */}
                  <div className="bg-grey-800 mb-4 rounded-lg p-4">
                    <p className="text-grey-300 text-sm">
                      {selectedItem.content_preview || "No content preview"}
                    </p>
                  </div>

                  {/* AI Analysis */}
                  {selectedItem.ai_risk_score !== undefined && (
                    <div className="mb-4">
                      <h4 className="text-grey-400 mb-2 text-sm font-medium">AI Analysis</h4>
                      <div className="bg-grey-800 rounded-lg p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-grey-400 text-sm">Risk Score</span>
                          <span
                            className={cn(
                              "text-lg font-bold",
                              getRiskScoreColor(selectedItem.ai_risk_score)
                            )}
                          >
                            {selectedItem.ai_risk_score}%
                          </span>
                        </div>
                        {selectedItem.ai_risk_factors &&
                          selectedItem.ai_risk_factors.length > 0 && (
                            <div className="mb-2">
                              <p className="text-grey-500 mb-1 text-xs">Risk Factors:</p>
                              <div className="flex flex-wrap gap-1">
                                {selectedItem.ai_risk_factors.map((factor, i) => (
                                  <span
                                    key={i}
                                    className="bg-grey-700 text-grey-300 rounded px-2 py-0.5 text-xs"
                                  >
                                    {factor}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        {selectedItem.ai_recommendation && (
                          <p className="text-grey-400 text-xs">
                            <strong>Recommendation:</strong> {selectedItem.ai_recommendation}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Report Info */}
                  {selectedItem.report_reason && (
                    <div className="mb-4">
                      <h4 className="text-grey-400 mb-2 text-sm font-medium">Report Details</h4>
                      <div className="bg-grey-800 rounded-lg p-3">
                        <p className="text-grey-300 text-sm">{selectedItem.report_reason}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Note */}
                  <div className="mb-4">
                    <label className="text-grey-400 mb-2 block text-sm font-medium">
                      Resolution Note (optional)
                    </label>
                    <textarea
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      className="border-grey-700 bg-grey-800 placeholder-grey-500 focus:border-action-500 w-full rounded-lg border p-3 text-sm text-white focus:outline-none"
                      rows={2}
                      placeholder="Add a note about this decision..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {selectedItem.status === "pending" && (
                      <button
                        onClick={() => handleAction(selectedItem.id, "start_review")}
                        disabled={isActioning}
                        className="bg-purple/20 text-purple hover:bg-purple/30 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        <i className="gng-eye" />
                        Start Review
                      </button>
                    )}

                    <button
                      onClick={() => handleAction(selectedItem.id, "approve")}
                      disabled={isActioning}
                      className="bg-action-600 hover:bg-action-700 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
                    >
                      <i className="gng-check" />
                      Approve
                    </button>

                    <button
                      onClick={() => handleAction(selectedItem.id, "reject")}
                      disabled={isActioning}
                      className="bg-error hover:bg-error/80 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
                    >
                      <i className="gng-x" />
                      Reject & Hide
                    </button>

                    <button
                      onClick={() => handleAction(selectedItem.id, "escalate")}
                      disabled={isActioning}
                      className="bg-grey-700 hover:bg-grey-600 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
                    >
                      <i className="gng-arrow-up" />
                      Escalate
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-grey-500 p-8 text-center">
                <i className="gng-mouse-pointer mb-2 text-2xl" />
                <p>Select an item to review</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="border-grey-800 bg-grey-900 mt-6 rounded-xl border p-5">
        <h3 className="mb-4 font-semibold text-white">Recent Community Activity</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="text-grey-400 mb-2 text-sm font-medium">
              Recent Posts ({data.recentActivity.flaggedPosts} flagged)
            </h4>
            {data.recentActivity.posts.length > 0 ? (
              <div className="space-y-2">
                {data.recentActivity.posts.slice(0, 5).map((post) => (
                  <div
                    key={post.id}
                    className={cn(
                      "bg-grey-800 rounded-lg p-3",
                      post.is_flagged && "border-warning/50 border"
                    )}
                  >
                    <p className="text-grey-300 line-clamp-2 text-sm">{post.content}</p>
                    <p className="text-grey-500 mt-1 text-xs">
                      {new Date(post.created_at).toLocaleString()}
                      {post.is_flagged && (
                        <span className="text-warning ml-2">
                          <i className="gng-flag mr-1" />
                          Flagged
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-grey-500 text-sm">No recent posts</p>
            )}
          </div>

          <div>
            <h4 className="text-grey-400 mb-2 text-sm font-medium">
              Recent Comments ({data.recentActivity.flaggedComments} flagged)
            </h4>
            {data.recentActivity.comments.length > 0 ? (
              <div className="space-y-2">
                {data.recentActivity.comments.slice(0, 5).map((comment) => (
                  <div
                    key={comment.id}
                    className={cn(
                      "bg-grey-800 rounded-lg p-3",
                      comment.is_flagged && "border-warning/50 border"
                    )}
                  >
                    <p className="text-grey-300 line-clamp-2 text-sm">{comment.content}</p>
                    <p className="text-grey-500 mt-1 text-xs">
                      {new Date(comment.created_at).toLocaleString()}
                      {comment.is_flagged && (
                        <span className="text-warning ml-2">
                          <i className="gng-flag mr-1" />
                          Flagged
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-grey-500 text-sm">No recent comments</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
