"use client";

import { useState } from "react";

import { cn } from "@lib/utils/style";

interface FriendCode {
  code: string;
  isUsed: boolean;
  usedAt: string | null;
  createdAt: string;
}

interface FriendCodeShareProps {
  friendCodes: FriendCode[];
}

export default function FriendCodeShare({ friendCodes }: FriendCodeShareProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareCode = async (code: string) => {
    const shareData = {
      title: "Join the 45-Day Awakening Challenge!",
      text: `I'm inviting you to join me on the 45-Day Awakening Challenge! Use my friend code: ${code}`,
      url: `${window.location.origin}/pricing?code=${code}`,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed
        copyToClipboard(code);
      }
    } else {
      copyToClipboard(code);
    }
  };

  const availableCodes = friendCodes.filter((fc) => !fc.isUsed);
  const usedCodes = friendCodes.filter((fc) => fc.isUsed);

  if (friendCodes.length === 0) {
    return (
      <div className="rounded-xl bg-gray-50 p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
          <svg
            className="h-6 w-6 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
        <p className="text-sm text-gray-600">No friend codes available yet.</p>
        <p className="mt-1 text-xs text-gray-500">
          Purchase the challenge to receive 2 friend codes to share.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="from-action-50 to-action-100 border-b border-gray-200 bg-gradient-to-r px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">Your Accountability Trio Codes</h3>
        <p className="mt-1 text-sm text-gray-600">
          Share these codes with 2 friends to start the journey together!
        </p>
      </div>

      <div className="space-y-4 p-6">
        {availableCodes.length > 0 && (
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              Available Codes ({availableCodes.length})
            </h4>
            <div className="space-y-3">
              {availableCodes.map((fc) => (
                <div
                  key={fc.code}
                  className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg font-bold tracking-wider text-gray-900">
                      {fc.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(fc.code)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                        copiedCode === fc.code
                          ? "bg-green-600 text-white"
                          : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      {copiedCode === fc.code ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={() => shareCode(fc.code)}
                      className="bg-action-600 hover:bg-action-700 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors"
                    >
                      Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {usedCodes.length > 0 && (
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
              <span className="h-2 w-2 rounded-full bg-gray-400"></span>
              Used Codes ({usedCodes.length})
            </h4>
            <div className="space-y-3">
              {usedCodes.map((fc) => (
                <div
                  key={fc.code}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg tracking-wider text-gray-500 line-through">
                      {fc.code}
                    </span>
                    <span className="text-xs text-gray-500">
                      Redeemed {fc.usedAt ? new Date(fc.usedAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <span className="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-600">
                    Used
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {availableCodes.length === 2 && (
        <div className="border-t border-amber-200 bg-amber-50 px-6 py-4">
          <p className="flex items-start gap-2 text-sm text-amber-800">
            <svg className="mt-0.5 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              <strong>Tip:</strong> Form an Accountability Trio! Research shows groups of 3 have the
              highest completion rates. Share both codes and start the challenge together.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
