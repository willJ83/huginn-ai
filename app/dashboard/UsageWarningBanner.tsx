"use client";

import { useState } from "react";

type UsageWarningBannerProps = {
  remaining: number;
  planRemaining: number;
  inTrial: boolean;
  plan: string;
};

export default function UsageWarningBanner({
  remaining,
  planRemaining,
  inTrial,
  plan,
}: UsageWarningBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const isFree = plan === "FREE";

  // For FREE tier: only show when fully exhausted (0 remaining)
  // For paid plans: show when 3 or fewer remaining
  const threshold = isFree ? 0 : 3;
  if (remaining > threshold || dismissed) return null;

  let bgClass: string;
  let borderClass: string;
  let textClass: string;
  let message: string;

  if (remaining === 0) {
    bgClass = "bg-red-50";
    borderClass = "border-red-200";
    textClass = "text-red-800";
    message = isFree
      ? "You've used all 3 free analyses. Subscribe to keep going."
      : "You've used all your analyses this month. Buy more or upgrade your plan.";
  } else if (remaining === 1) {
    bgClass = "bg-orange-50";
    borderClass = "border-orange-200";
    textClass = "text-orange-800";
    message = "Last analysis remaining this month. Buy more or upgrade to avoid interruption.";
  } else {
    bgClass = "bg-yellow-50";
    borderClass = "border-yellow-200";
    textClass = "text-yellow-800";
    message = `You have ${remaining} analyses left this month. Buy more or upgrade your plan.`;
  }

  async function handleBuyMore(pack: "5" | "10") {
    const res = await fetch("/api/stripe/buy-analyses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pack }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Something went wrong.");
      return;
    }

    window.location.href = data.url;
  }

  return (
    <div className={`mt-4 rounded-xl border ${borderClass} ${bgClass} px-4 py-3`}>
      <div className="flex items-start justify-between gap-3">
        <p className={`text-sm font-medium ${textClass}`}>{message}</p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className={`shrink-0 text-xs ${textClass} opacity-60 hover:opacity-100`}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {isFree ? (
          <a
            href="/select-plan"
            className={`rounded-lg border ${borderClass} bg-white px-3 py-1.5 text-xs font-semibold ${textClass} transition hover:opacity-80`}
          >
            Subscribe — Starter $9.99/mo or Pro $29.99/mo
          </a>
        ) : (
          <>
            <button
              type="button"
              onClick={() => handleBuyMore("5")}
              className={`rounded-lg border ${borderClass} bg-white px-3 py-1.5 text-xs font-semibold ${textClass} transition hover:opacity-80`}
            >
              Buy 5 analyses — $4.99
            </button>
            <button
              type="button"
              onClick={() => handleBuyMore("10")}
              className={`rounded-lg border ${borderClass} bg-white px-3 py-1.5 text-xs font-semibold ${textClass} transition hover:opacity-80`}
            >
              Buy 10 analyses — $7.99
            </button>
            {plan !== "PRO" && (
              <a
                href="/pricing"
                className={`rounded-lg border ${borderClass} bg-white px-3 py-1.5 text-xs font-semibold ${textClass} transition hover:opacity-80`}
              >
                Upgrade Plan
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}
