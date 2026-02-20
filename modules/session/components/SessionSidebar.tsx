"use client";

import React, { useState } from "react";

import { cn } from "@lib/utils/style";

interface SessionSidebarProps {
  chatTab: React.ReactNode;
  handRaiseTab?: React.ReactNode;
  breakoutTab?: React.ReactNode;
  hotSeatEnabled: boolean;
  breakoutEnabled: boolean;
}

type Tab = "chat" | "hands" | "breakout";

const SessionSidebar: React.FC<SessionSidebarProps> = ({
  chatTab,
  handRaiseTab,
  breakoutTab,
  hotSeatEnabled,
  breakoutEnabled,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  const tabs: Array<{ id: Tab; label: string; show: boolean }> = [
    { id: "chat", label: "Chat", show: true },
    { id: "hands", label: "Hands", show: hotSeatEnabled },
    { id: "breakout", label: "Rooms", show: breakoutEnabled },
  ];

  const visibleTabs = tabs.filter((t) => t.show);

  return (
    <div className="flex h-full flex-col border-l border-gray-700 bg-gray-900">
      {/* Tab bar */}
      <div className="flex border-b border-gray-700">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 py-2.5 text-xs font-medium transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-teal-500 text-teal-400"
                : "text-gray-500 hover:text-gray-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "chat" && chatTab}
        {activeTab === "hands" && handRaiseTab}
        {activeTab === "breakout" && (
          <div className="h-full overflow-y-auto p-3">{breakoutTab}</div>
        )}
      </div>
    </div>
  );
};

export default SessionSidebar;
