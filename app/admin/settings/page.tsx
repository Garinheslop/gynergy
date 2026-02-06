"use client";

import { useState, useEffect, useCallback } from "react";

import { cn } from "@lib/utils/style";
import { AdminLayout } from "@modules/admin";

interface AdminPreferences {
  defaultDateRange: "7d" | "30d" | "90d";
  sidebarCollapsed: boolean;
  ariaEnabled: boolean;
  ariaAutoInsights: boolean;
  emailNotifications: boolean;
  alertThresholds: {
    revenueDropPercent: number;
    refundRatePercent: number;
    churnRatePercent: number;
    moderationBacklog: number;
  };
}

const defaultPreferences: AdminPreferences = {
  defaultDateRange: "30d",
  sidebarCollapsed: false,
  ariaEnabled: true,
  ariaAutoInsights: true,
  emailNotifications: true,
  alertThresholds: {
    revenueDropPercent: 50,
    refundRatePercent: 5,
    churnRatePercent: 10,
    moderationBacklog: 10,
  },
};

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<AdminPreferences>(defaultPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"general" | "aria" | "alerts" | "account">(
    "general"
  );

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPreferences({ ...defaultPreferences, ...data.data });
        }
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (res.ok) {
        setSaveMessage("Settings saved successfully");
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      setSaveMessage("Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = <K extends keyof AdminPreferences>(
    key: K,
    value: AdminPreferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const updateAlertThreshold = (key: keyof AdminPreferences["alertThresholds"], value: number) => {
    setPreferences((prev) => ({
      ...prev,
      alertThresholds: { ...prev.alertThresholds, [key]: value },
    }));
  };

  const sections = [
    { id: "general", label: "General", icon: "gng-settings" },
    { id: "aria", label: "Aria AI", icon: "gng-cpu" },
    { id: "alerts", label: "Alert Thresholds", icon: "gng-bell" },
    { id: "account", label: "Account", icon: "gng-user" },
  ] as const;

  return (
    <AdminLayout title="Settings" subtitle="Configure your admin preferences">
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="border-grey-800 bg-grey-900 space-y-1 rounded-xl border p-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors",
                  activeSection === section.id
                    ? "bg-action-600 text-white"
                    : "text-grey-400 hover:bg-grey-800 hover:text-white"
                )}
              >
                <i className={section.icon} />
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="border-grey-800 bg-grey-900 rounded-xl border p-6">
            {/* General Settings */}
            {activeSection === "general" && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-white">General Settings</h3>
                  <p className="text-grey-400 mb-6 text-sm">
                    Configure your default dashboard preferences.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-grey-400 mb-2 block text-sm font-medium">
                      Default Date Range
                    </label>
                    <div className="flex gap-2">
                      {(["7d", "30d", "90d"] as const).map((range) => (
                        <button
                          key={range}
                          onClick={() => updatePreference("defaultDateRange", range)}
                          className={cn(
                            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                            preferences.defaultDateRange === range
                              ? "bg-action-600 text-white"
                              : "bg-grey-800 text-grey-400 hover:bg-grey-700"
                          )}
                        >
                          {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-grey-800 flex items-center justify-between rounded-lg p-4">
                    <div>
                      <p className="font-medium text-white">Collapsed Sidebar</p>
                      <p className="text-grey-500 text-sm">Start with sidebar minimized</p>
                    </div>
                    <button
                      onClick={() =>
                        updatePreference("sidebarCollapsed", !preferences.sidebarCollapsed)
                      }
                      className={cn(
                        "relative h-6 w-11 rounded-full transition-colors",
                        preferences.sidebarCollapsed ? "bg-action-600" : "bg-grey-600"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                          preferences.sidebarCollapsed ? "left-[22px]" : "left-0.5"
                        )}
                      />
                    </button>
                  </div>

                  <div className="bg-grey-800 flex items-center justify-between rounded-lg p-4">
                    <div>
                      <p className="font-medium text-white">Email Notifications</p>
                      <p className="text-grey-500 text-sm">Receive daily digest and alerts</p>
                    </div>
                    <button
                      onClick={() =>
                        updatePreference("emailNotifications", !preferences.emailNotifications)
                      }
                      className={cn(
                        "relative h-6 w-11 rounded-full transition-colors",
                        preferences.emailNotifications ? "bg-action-600" : "bg-grey-600"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                          preferences.emailNotifications ? "left-[22px]" : "left-0.5"
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Aria AI Settings */}
            {activeSection === "aria" && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-white">Aria AI Settings</h3>
                  <p className="text-grey-400 mb-6 text-sm">
                    Configure your AI assistant preferences.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-grey-800 flex items-center justify-between rounded-lg p-4">
                    <div>
                      <p className="font-medium text-white">Enable Aria</p>
                      <p className="text-grey-500 text-sm">Show Aria AI assistant panel</p>
                    </div>
                    <button
                      onClick={() => updatePreference("ariaEnabled", !preferences.ariaEnabled)}
                      className={cn(
                        "relative h-6 w-11 rounded-full transition-colors",
                        preferences.ariaEnabled ? "bg-action-600" : "bg-grey-600"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                          preferences.ariaEnabled ? "left-[22px]" : "left-0.5"
                        )}
                      />
                    </button>
                  </div>

                  <div className="bg-grey-800 flex items-center justify-between rounded-lg p-4">
                    <div>
                      <p className="font-medium text-white">Auto Insights</p>
                      <p className="text-grey-500 text-sm">Let Aria proactively share insights</p>
                    </div>
                    <button
                      onClick={() =>
                        updatePreference("ariaAutoInsights", !preferences.ariaAutoInsights)
                      }
                      className={cn(
                        "relative h-6 w-11 rounded-full transition-colors",
                        preferences.ariaAutoInsights ? "bg-action-600" : "bg-grey-600"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                          preferences.ariaAutoInsights ? "left-[22px]" : "left-0.5"
                        )}
                      />
                    </button>
                  </div>

                  <div className="border-grey-700 bg-grey-800/50 rounded-lg border p-4">
                    <h4 className="mb-2 font-medium text-white">Keyboard Shortcuts</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-grey-400">Open Aria</span>
                        <kbd className="bg-grey-700 text-grey-300 rounded px-2 py-1 text-xs">
                          ⌘ + .
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-grey-400">Quick Search</span>
                        <kbd className="bg-grey-700 text-grey-300 rounded px-2 py-1 text-xs">
                          ⌘ + K
                        </kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Alert Thresholds */}
            {activeSection === "alerts" && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-white">Alert Thresholds</h3>
                  <p className="text-grey-400 mb-6 text-sm">
                    Configure when alerts should be triggered.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-grey-800 rounded-lg p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-medium text-white">Revenue Drop Alert</p>
                      <span className="text-action-400">
                        {preferences.alertThresholds.revenueDropPercent}%
                      </span>
                    </div>
                    <p className="text-grey-500 mb-3 text-sm">
                      Alert when revenue drops by this percentage vs previous day
                    </p>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={preferences.alertThresholds.revenueDropPercent}
                      onChange={(e) =>
                        updateAlertThreshold("revenueDropPercent", parseInt(e.target.value))
                      }
                      className="accent-action-500 w-full"
                    />
                  </div>

                  <div className="bg-grey-800 rounded-lg p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-medium text-white">Refund Rate Alert</p>
                      <span className="text-action-400">
                        {preferences.alertThresholds.refundRatePercent}%
                      </span>
                    </div>
                    <p className="text-grey-500 mb-3 text-sm">
                      Alert when refund rate exceeds this percentage
                    </p>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={preferences.alertThresholds.refundRatePercent}
                      onChange={(e) =>
                        updateAlertThreshold("refundRatePercent", parseInt(e.target.value))
                      }
                      className="accent-action-500 w-full"
                    />
                  </div>

                  <div className="bg-grey-800 rounded-lg p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-medium text-white">Churn Rate Alert</p>
                      <span className="text-action-400">
                        {preferences.alertThresholds.churnRatePercent}%
                      </span>
                    </div>
                    <p className="text-grey-500 mb-3 text-sm">
                      Alert when weekly subscription churn exceeds this percentage
                    </p>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={preferences.alertThresholds.churnRatePercent}
                      onChange={(e) =>
                        updateAlertThreshold("churnRatePercent", parseInt(e.target.value))
                      }
                      className="accent-action-500 w-full"
                    />
                  </div>

                  <div className="bg-grey-800 rounded-lg p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-medium text-white">Moderation Backlog</p>
                      <span className="text-action-400">
                        {preferences.alertThresholds.moderationBacklog} items
                      </span>
                    </div>
                    <p className="text-grey-500 mb-3 text-sm">
                      Alert when pending moderation items exceed this count
                    </p>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={preferences.alertThresholds.moderationBacklog}
                      onChange={(e) =>
                        updateAlertThreshold("moderationBacklog", parseInt(e.target.value))
                      }
                      className="accent-action-500 w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Account Settings */}
            {activeSection === "account" && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-white">Account Settings</h3>
                  <p className="text-grey-400 mb-6 text-sm">Manage your admin account.</p>
                </div>

                <div className="space-y-4">
                  <div className="border-grey-700 bg-grey-800/50 rounded-lg border p-4">
                    <h4 className="mb-3 font-medium text-white">Admin Role</h4>
                    <span className="bg-action-900 text-action-400 rounded-full px-3 py-1 text-sm font-medium">
                      Super Admin
                    </span>
                  </div>

                  <div className="border-grey-700 bg-grey-800/50 rounded-lg border p-4">
                    <h4 className="mb-3 font-medium text-white">Session</h4>
                    <p className="text-grey-400 mb-2 text-sm">You are currently logged in.</p>
                    <button className="text-error text-sm hover:underline">
                      Sign out of admin dashboard
                    </button>
                  </div>

                  <div className="border-error/50 bg-error/10 rounded-lg border p-4">
                    <h4 className="text-error mb-2 font-medium">Danger Zone</h4>
                    <p className="text-grey-400 mb-3 text-sm">
                      These actions are irreversible. Be careful.
                    </p>
                    <button className="border-error text-error hover:bg-error rounded-lg border px-4 py-2 text-sm font-medium hover:text-white">
                      Export All Data
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="border-grey-800 mt-8 flex items-center justify-between border-t pt-6">
              {saveMessage && (
                <span
                  className={cn(
                    "text-sm",
                    saveMessage.includes("success") ? "text-action-400" : "text-error"
                  )}
                >
                  {saveMessage}
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-action-600 hover:bg-action-700 ml-auto flex items-center gap-2 rounded-lg px-6 py-2 font-medium text-white disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <i className="gng-refresh animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="gng-check" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
