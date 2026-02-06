"use client";

import { cn } from "@lib/utils/style";

interface Alert {
  id: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  createdAt: string;
}

interface AlertsWidgetProps {
  alerts: Alert[];
  onDismiss?: (id: string) => void;
  isLoading?: boolean;
}

const alertConfig = {
  info: {
    icon: "gng-info",
    borderColor: "border-l-action-500",
    iconColor: "text-action-400",
    bgColor: "bg-action-900/30",
  },
  warning: {
    icon: "gng-warning",
    borderColor: "border-l-warning",
    iconColor: "text-warning",
    bgColor: "bg-warning/10",
  },
  error: {
    icon: "gng-error",
    borderColor: "border-l-danger",
    iconColor: "text-danger",
    bgColor: "bg-danger/10",
  },
  success: {
    icon: "gng-check-circle",
    borderColor: "border-l-success",
    iconColor: "text-success",
    bgColor: "bg-success/10",
  },
};

export default function AlertsWidget({ alerts, onDismiss, isLoading = false }: AlertsWidgetProps) {
  if (isLoading) {
    return (
      <div className="border-grey-800 bg-grey-900 rounded-xl border p-5">
        <div className="bg-grey-800 mb-4 h-6 w-24 animate-pulse rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-grey-800 h-20 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border-grey-800 bg-grey-900 rounded-xl border p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-white">Alerts</h3>
        {alerts.length > 0 && (
          <span className="bg-danger flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold text-white">
            {alerts.length}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center py-8">
            <div className="bg-action-900 flex h-12 w-12 items-center justify-center rounded-full">
              <i className="gng-check text-action-400 text-2xl" />
            </div>
            <p className="text-grey-500 mt-3 text-sm">All systems operational</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const config = alertConfig[alert.type];
            return (
              <div
                key={alert.id}
                className={cn(
                  "relative rounded-lg border-l-4 p-4",
                  config.borderColor,
                  config.bgColor
                )}
              >
                {onDismiss && (
                  <button
                    onClick={() => onDismiss(alert.id)}
                    className="text-grey-500 hover:bg-grey-700 absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded transition-colors hover:text-white"
                  >
                    <i className="gng-close text-xs" />
                  </button>
                )}
                <div className="flex items-start gap-3">
                  <i className={cn(config.icon, config.iconColor, "text-lg")} />
                  <div className="flex-1 pr-6">
                    <p className="text-sm font-medium text-white">{alert.title}</p>
                    <p className="text-grey-400 mt-1 text-xs">{alert.description}</p>
                    {alert.actionLabel && (
                      <button className="text-action-400 hover:text-action-300 mt-2 text-xs font-medium">
                        {alert.actionLabel} &rarr;
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
