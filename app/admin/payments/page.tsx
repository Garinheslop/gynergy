"use client";

import { useState, useEffect, useCallback } from "react";

import { cn } from "@lib/utils/style";
import { AdminLayout, StatCard, ChartContainer, BarChartWidget } from "@modules/admin";
import type { ChartDataPoint } from "@modules/admin";

interface PaymentMetrics {
  totalRevenue: number;
  revenueToday: number;
  revenueRange: number;
  mrr: number;
  arr: number;
  dailyChange: number;
  refundsTotal: number;
  refundCount: number;
  refundRate: number;
  challengePurchases: number;
  challengeRevenue: number;
  friendCodeRedemptions: number;
  activeSubscriptions: number;
  subscriptionRevenue: number;
  friendCodesCreated: number;
  friendCodesUsed: number;
  friendCodeConversionRate: number;
  revenueTrend: ChartDataPoint[];
  recentPurchases: Array<{
    id: string;
    type: string;
    amount: number;
    date: string;
  }>;
}

const defaultMetrics: PaymentMetrics = {
  totalRevenue: 0,
  revenueToday: 0,
  revenueRange: 0,
  mrr: 0,
  arr: 0,
  dailyChange: 0,
  refundsTotal: 0,
  refundCount: 0,
  refundRate: 0,
  challengePurchases: 0,
  challengeRevenue: 0,
  friendCodeRedemptions: 0,
  activeSubscriptions: 0,
  subscriptionRevenue: 0,
  friendCodesCreated: 0,
  friendCodesUsed: 0,
  friendCodeConversionRate: 0,
  revenueTrend: [],
  recentPurchases: [],
};

export default function PaymentsPage() {
  const [metrics, setMetrics] = useState<PaymentMetrics>(defaultMetrics);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

  const fetchPaymentData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/payments?range=${dateRange}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMetrics(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching payment data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchPaymentData();
  }, [fetchPaymentData]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);

  return (
    <AdminLayout title="Payment Analytics" subtitle="Revenue tracking and financial insights">
      {/* Date Range Selector */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                dateRange === range
                  ? "bg-action-600 text-white"
                  : "bg-grey-800 text-grey-400 hover:bg-grey-700"
              )}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
        <button
          onClick={fetchPaymentData}
          disabled={isLoading}
          className="bg-grey-800 text-grey-400 hover:bg-grey-700 flex items-center gap-2 rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          <i className={`gng-refresh ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Revenue Stats - Row 1 */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={metrics.totalRevenue}
          format="currency"
          icon="gng-dollar"
        />
        <StatCard
          title="Monthly Recurring (MRR)"
          value={metrics.mrr}
          format="currency"
          icon="gng-trending-up"
        />
        <StatCard
          title="Annual Run Rate (ARR)"
          value={metrics.arr}
          format="currency"
          icon="gng-calendar"
        />
        <StatCard
          title="Today's Revenue"
          value={metrics.revenueToday}
          format="currency"
          icon="gng-zap"
          change={
            metrics.dailyChange !== 0
              ? {
                  value: Math.abs(metrics.dailyChange),
                  period: "24h",
                  isPositive: metrics.dailyChange > 0,
                }
              : undefined
          }
        />
      </div>

      {/* Sales Stats - Row 2 */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Challenge Purchases"
          value={metrics.challengePurchases}
          icon="gng-check-circle"
        />
        <StatCard
          title="Friend Code Redemptions"
          value={metrics.friendCodeRedemptions}
          icon="gng-share"
        />
        <StatCard
          title="Active Subscriptions"
          value={metrics.activeSubscriptions}
          icon="gng-users"
        />
        <StatCard
          title="Refund Rate"
          value={metrics.refundRate}
          format="percentage"
          icon="gng-alert-circle"
        />
      </div>

      {/* Revenue Chart */}
      <div className="mb-6">
        <ChartContainer
          title="Revenue Trend"
          subtitle={`${dateRange === "90d" ? "Weekly" : "Daily"} breakdown`}
          actions={
            <span className="text-grey-500 text-sm">
              {formatCurrency(metrics.revenueRange)} in period
            </span>
          }
        >
          {metrics.revenueTrend.length > 0 ? (
            <BarChartWidget
              data={metrics.revenueTrend}
              xKey="name"
              yKey="value"
              color="#ffc878"
              formatTooltip={formatCurrency}
            />
          ) : (
            <div className="text-grey-500 flex h-full items-center justify-center">
              {isLoading ? "Loading..." : "No revenue data available"}
            </div>
          )}
        </ChartContainer>
      </div>

      {/* Sales Breakdown */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Revenue Sources */}
        <div className="border-grey-800 bg-grey-900 rounded-xl border p-5">
          <h3 className="mb-4 font-semibold text-white">Revenue Breakdown</h3>
          <div className="space-y-4">
            <div className="bg-grey-800 flex items-center justify-between rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-action-900 text-action-400 flex h-10 w-10 items-center justify-center rounded-lg">
                  <i className="gng-check-circle text-lg" />
                </div>
                <div>
                  <p className="font-medium text-white">Challenge Purchases</p>
                  <p className="text-grey-400 text-sm">{metrics.challengePurchases} purchases</p>
                </div>
              </div>
              <p className="text-lg font-bold text-white">
                {formatCurrency(metrics.challengeRevenue)}
              </p>
            </div>

            <div className="bg-grey-800 flex items-center justify-between rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple/20 text-purple flex h-10 w-10 items-center justify-center rounded-lg">
                  <i className="gng-repeat text-lg" />
                </div>
                <div>
                  <p className="font-medium text-white">Subscriptions</p>
                  <p className="text-grey-400 text-sm">{metrics.activeSubscriptions} active</p>
                </div>
              </div>
              <p className="text-lg font-bold text-white">
                {formatCurrency(metrics.subscriptionRevenue)}/mo
              </p>
            </div>

            <div className="bg-grey-800 flex items-center justify-between rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-error/20 text-error flex h-10 w-10 items-center justify-center rounded-lg">
                  <i className="gng-arrow-left text-lg" />
                </div>
                <div>
                  <p className="font-medium text-white">Refunds</p>
                  <p className="text-grey-400 text-sm">
                    {metrics.refundCount} refunds ({metrics.refundRate}%)
                  </p>
                </div>
              </div>
              <p className="text-error text-lg font-bold">
                -{formatCurrency(metrics.refundsTotal)}
              </p>
            </div>
          </div>
        </div>

        {/* Friend Code Performance */}
        <div className="border-grey-800 bg-grey-900 rounded-xl border p-5">
          <h3 className="mb-4 font-semibold text-white">Friend Code Performance</h3>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-action-400 text-3xl font-bold">
                {metrics.friendCodeConversionRate.toFixed(1)}%
              </p>
              <p className="text-grey-400 text-sm">Conversion Rate</p>
            </div>
            <div className="h-20 w-20">
              <svg className="h-full w-full -rotate-90 transform">
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-grey-800"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${(metrics.friendCodeConversionRate / 100) * 220} 220`}
                  className="text-action-400"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-grey-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">{metrics.friendCodesCreated}</p>
              <p className="text-grey-400 text-sm">Codes Created</p>
            </div>
            <div className="bg-grey-800 rounded-lg p-4 text-center">
              <p className="text-action-400 text-2xl font-bold">{metrics.friendCodesUsed}</p>
              <p className="text-grey-400 text-sm">Codes Redeemed</p>
            </div>
          </div>

          <p className="text-grey-400 mt-4 text-sm">
            {metrics.friendCodesCreated - metrics.friendCodesUsed} friend codes still available for
            redemption.
          </p>
        </div>
      </div>

      {/* Recent Purchases */}
      <div className="border-grey-800 bg-grey-900 rounded-xl border p-5">
        <h3 className="mb-4 font-semibold text-white">Recent Purchases</h3>
        {metrics.recentPurchases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-grey-800 text-grey-400 border-b text-left text-sm">
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-grey-800 divide-y">
                {metrics.recentPurchases.map((purchase) => (
                  <tr key={purchase.id} className="text-sm">
                    <td className="py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          purchase.type === "challenge"
                            ? "bg-action-900 text-action-400"
                            : "bg-purple/20 text-purple"
                        )}
                      >
                        {purchase.type === "challenge" ? "Challenge" : purchase.type}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-white">
                      {formatCurrency(purchase.amount)}
                    </td>
                    <td className="text-grey-400 py-3">
                      {purchase.date ? new Date(purchase.date).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-grey-500 py-8 text-center">
            {isLoading ? "Loading purchases..." : "No recent purchases"}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
