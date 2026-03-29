"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function PricingContent() {
  const searchParams = useSearchParams();
  const canceled = searchParams.get("canceled");
  const [loading, setLoading] = useState<"STARTER" | "PRO" | null>(null);
  const [error, setError] = useState("");

  const handleUpgrade = async (plan: "STARTER" | "PRO") => {
    setError("");
    setLoading(plan);

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.redirectTo) {
        window.location.href = data.redirectTo;
        return;
      }
      setError(data.error || "Something went wrong. Please try again.");
      setLoading(null);
      return;
    }

    window.location.href = data.url;
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-center text-3xl font-bold text-slate-900 sm:text-4xl">
          Simple, Transparent Pricing
        </h1>
        <p className="mt-3 text-center text-slate-600">
          30-day free trial on every plan. No charge until day 30.
        </p>
        <p className="mt-1 text-center text-sm text-slate-500">
          Card required to start. Cancel anytime.
        </p>
        <p className="mt-1 text-center text-sm text-slate-500">
          We'll send you a reminder email 3 days before your trial ends.
        </p>

        {canceled && (
          <p className="mt-6 text-center text-sm text-red-600">
            Checkout was canceled. No charges were made.
          </p>
        )}

        {error && (
          <p className="mt-6 text-center text-sm text-red-600">{error}</p>
        )}

        <div className="mt-10 grid gap-5 sm:mt-12 sm:gap-8 sm:grid-cols-2">
          {/* Starter */}
          <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="absolute -top-3 left-6 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
              First month free
            </div>

            <h2 className="mt-2 text-xl font-semibold text-slate-900">Starter</h2>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              $9.99
              <span className="text-base font-normal text-slate-500">/mo after trial</span>
            </p>

            <ul className="mt-6 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                15 analyses per month
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                5 analyses during your free trial
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                Risk scoring with severity levels
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                Clause-level recommendations
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                PDF export
              </li>
            </ul>

            <button
              onClick={() => handleUpgrade("STARTER")}
              disabled={loading !== null}
              className="mt-8 w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {loading === "STARTER" ? "Redirecting..." : "Start free trial — Starter"}
            </button>
          </div>

          {/* Pro */}
          <div className="relative rounded-2xl border-2 border-blue-500 bg-white p-6 shadow-sm sm:p-8">
            <div className="absolute -top-3 left-6 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
              Most Popular
            </div>
            <div className="absolute -top-3 right-6 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
              First month free
            </div>

            <h2 className="mt-2 text-xl font-semibold text-slate-900">Pro</h2>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              $29.99
              <span className="text-base font-normal text-slate-500">/mo after trial</span>
            </p>

            <ul className="mt-6 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <span className="text-blue-500 font-bold">✓</span>
                70 analyses per month
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500 font-bold">✓</span>
                5 analyses during your free trial
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500 font-bold">✓</span>
                Risk scoring with severity levels
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500 font-bold">✓</span>
                Clause-level recommendations
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500 font-bold">✓</span>
                PDF export
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500 font-bold">✓</span>
                Priority support
              </li>
            </ul>

            <button
              onClick={() => handleUpgrade("PRO")}
              disabled={loading !== null}
              className="mt-8 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading === "PRO" ? "Redirecting..." : "Start free trial — Pro"}
            </button>
          </div>
        </div>

        {/* Add-on packs */}
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">Need more analyses?</h2>
          <p className="mt-1 text-sm text-slate-600">
            Purchase one-time add-on packs any time you hit your monthly limit.
            Add-ons do not roll over to the next month.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="rounded-xl border border-slate-200 px-5 py-4">
              <p className="font-semibold text-slate-900">5 Extra Analyses</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">$4.99</p>
              <p className="mt-1 text-xs text-slate-500">One-time purchase</p>
            </div>
            <div className="rounded-xl border border-slate-200 px-5 py-4">
              <p className="font-semibold text-slate-900">10 Extra Analyses</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">$7.99</p>
              <p className="mt-1 text-xs text-slate-500">One-time purchase · Best value</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Available from your dashboard once you have an active subscription.
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          This tool is not a substitute for professional legal advice. Secure checkout powered by Stripe.
        </p>
      </div>
    </main>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PricingContent />
    </Suspense>
  );
}
