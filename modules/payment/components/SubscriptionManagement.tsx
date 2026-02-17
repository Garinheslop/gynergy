"use client";

import React, { useEffect, useState } from "react";

import { usePopup } from "@contexts/UsePopup";
import ActionButton from "@modules/common/components/ActionButton";
import Heading from "@modules/common/components/typography/Heading";
import Paragraph from "@modules/common/components/typography/Paragraph";
import { headingVariants, paragraphVariants } from "@resources/variants";
import { useDispatch, useSelector } from "@store/hooks";
import {
  fetchSubscriptionDetails,
  cancelUserSubscription,
  resumeUserSubscription,
} from "@store/modules/payment";

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusLabel(status: string, cancelAtPeriodEnd: boolean): string {
  if (cancelAtPeriodEnd) return "Cancelling at period end";
  switch (status) {
    case "active":
      return "Active";
    case "trialing":
      return "Trial";
    case "past_due":
      return "Past Due";
    case "canceled":
      return "Cancelled";
    case "unpaid":
      return "Unpaid";
    default:
      return status;
  }
}

function getStatusColor(status: string, cancelAtPeriodEnd: boolean): string {
  if (cancelAtPeriodEnd) return "text-yellow-400";
  switch (status) {
    case "active":
    case "trialing":
      return "text-green-400";
    case "past_due":
    case "unpaid":
      return "text-red-400";
    case "canceled":
      return "text-content-dark/50";
    default:
      return "text-content-dark";
  }
}

const SubscriptionManagement: React.FC = () => {
  const dispatch = useDispatch();
  const { messagePopupObj } = usePopup();
  const { subscriptionDetails, invoices, subscriptionLoading, cancelling } = useSelector(
    (state) => state.payment
  );
  const [showInvoices, setShowInvoices] = useState(false);

  useEffect(() => {
    dispatch(fetchSubscriptionDetails());
  }, [dispatch]);

  const handleCancel = () => {
    messagePopupObj.open({
      popupData: {
        heading: "Cancel Subscription",
        description:
          "Your subscription will remain active until the end of your current billing period. You can resume anytime before then.",
        cta: {
          action: async () => {
            const result = await dispatch(cancelUserSubscription());
            if (result.success) {
              messagePopupObj.open({
                popupData: {
                  heading: "Subscription Cancelled",
                  description:
                    "Your subscription will end at the current billing period. You can resume anytime before then.",
                },
              });
            } else {
              messagePopupObj.open({
                popupData: {
                  heading: "Error",
                  description: result.error || "Failed to cancel subscription. Please try again.",
                },
              });
            }
          },
          label: "Confirm Cancellation",
          style: "bg-danger [&>p]:text-content-light",
        },
      },
    });
  };

  const handleResume = async () => {
    const result = await dispatch(resumeUserSubscription());
    if (result.success) {
      messagePopupObj.open({
        popupData: {
          heading: "Subscription Resumed",
          description: "Your subscription has been resumed and will continue as normal.",
        },
      });
    } else {
      messagePopupObj.open({
        popupData: {
          heading: "Error",
          description: result.error || "Failed to resume subscription. Please try again.",
        },
      });
    }
  };

  if (subscriptionLoading) {
    return (
      <div className="flex flex-col gap-5">
        <Heading variant={headingVariants.title} sx="!font-bold">
          Subscription
        </Heading>
        <div className="flex items-center justify-center py-8">
          <div className="border-action h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!subscriptionDetails) {
    return (
      <div className="flex flex-col gap-5">
        <Heading variant={headingVariants.title} sx="!font-bold">
          Subscription
        </Heading>
        <Paragraph
          variant={paragraphVariants.regular}
          content="No active subscription. Visit pricing to subscribe to the Digital Journal."
        />
        <ActionButton label="View Pricing" href="/pricing" />
      </div>
    );
  }

  const statusLabel = getStatusLabel(
    subscriptionDetails.status,
    subscriptionDetails.cancelAtPeriodEnd
  );
  const statusColor = getStatusColor(
    subscriptionDetails.status,
    subscriptionDetails.cancelAtPeriodEnd
  );
  const isActive =
    subscriptionDetails.status === "active" || subscriptionDetails.status === "trialing";
  const isCancelling = subscriptionDetails.cancelAtPeriodEnd;

  return (
    <div className="flex flex-col gap-5">
      <Heading variant={headingVariants.title} sx="!font-bold">
        Subscription
      </Heading>

      {/* Plan Details */}
      <div className="bg-bkg-dark-secondary flex flex-col gap-4 rounded p-5">
        <div className="flex items-center justify-between">
          <Paragraph
            variant={paragraphVariants.regular}
            content={subscriptionDetails.planName}
            sx="!font-bold"
          />
          <span className={`text-sm font-semibold ${statusColor}`}>{statusLabel}</span>
        </div>

        <div className="border-border-light/20 border-t pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Paragraph
                variant={paragraphVariants.meta}
                content="Amount"
                sx="text-content-dark/60"
              />
              <Paragraph
                variant={paragraphVariants.regular}
                content={`${subscriptionDetails.planAmount}/${subscriptionDetails.planInterval}`}
              />
            </div>
            <div>
              <Paragraph
                variant={paragraphVariants.meta}
                content="Current Period"
                sx="text-content-dark/60"
              />
              <Paragraph
                variant={paragraphVariants.regular}
                content={`${formatDate(subscriptionDetails.currentPeriodStart)} - ${formatDate(subscriptionDetails.currentPeriodEnd)}`}
              />
            </div>
            {isCancelling && subscriptionDetails.currentPeriodEnd && (
              <div className="col-span-2">
                <Paragraph
                  variant={paragraphVariants.meta}
                  content="Access ends"
                  sx="text-yellow-400/80"
                />
                <Paragraph
                  variant={paragraphVariants.regular}
                  content={formatDate(subscriptionDetails.currentPeriodEnd)}
                  sx="text-yellow-400"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      {isActive && !isCancelling && (
        <ActionButton
          label="Cancel Subscription"
          onClick={handleCancel}
          isLoading={cancelling}
          isSpinner
          sx="bg-transparent border border-danger text-danger hover:bg-danger/10 [&>p]:text-danger"
        />
      )}

      {isCancelling && (
        <ActionButton
          label="Resume Subscription"
          onClick={handleResume}
          isLoading={cancelling}
          isSpinner
          sx="bg-action"
        />
      )}

      {/* Invoices */}
      {invoices.length > 0 && (
        <div className="flex flex-col gap-3">
          <button
            className="flex cursor-pointer items-center gap-2 text-left"
            onClick={() => setShowInvoices(!showInvoices)}
          >
            <Paragraph
              variant={paragraphVariants.regular}
              content="Billing History"
              sx="!font-bold"
            />
            <i
              className={`gng-arrow-down text-xs transition-transform ${showInvoices ? "rotate-180" : ""}`}
            />
          </button>

          {showInvoices && (
            <div className="bg-bkg-dark-secondary flex flex-col gap-2 rounded p-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="border-border-light/10 flex items-center justify-between border-b py-2 last:border-0"
                >
                  <div className="flex flex-col">
                    <Paragraph variant={paragraphVariants.meta} content={invoice.amount} />
                    <Paragraph
                      variant={paragraphVariants.meta}
                      content={formatDate(invoice.date)}
                      sx="text-content-dark/50 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs capitalize ${invoice.status === "paid" ? "text-green-400" : "text-yellow-400"}`}
                    >
                      {invoice.status}
                    </span>
                    {invoice.pdfUrl && (
                      <a
                        href={invoice.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-action hover:text-action-100 text-xs underline"
                      >
                        PDF
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;
