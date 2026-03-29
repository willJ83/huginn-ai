"use client";

import { useState } from "react";

export default function SelectPlanPage() {
  const [loading, setLoading] = useState<"STARTER" | "PRO" | null>(null);
  const [error, setError] = useState("");

  async function handleSelect(plan: "STARTER" | "PRO") {
    setError("");
    setLoading(plan);

    try {
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
    } catch {
      setError("Network error. Please try again.");
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Choose your plan</h1>
          <p className="mt-3 text-slate-600">
            30-day free trial on both plans. No charge until day 30.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Card required to start. Cancel anytime.
          </p>
        </div>

        {error && (
          <p className="mt-6 text-center text-sm text-red-600">{error}</p>
        )}

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {/* Starter */}
          <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="absolute -top-3 left-6 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
              First month free
            </div>

            <h2 className="mt-2 text-xl font-semibold text-slate-900">Starter</h2>
            <div className="mt-2 flex items-end gap-1">
              <span className="text-4xl font-bold text-slate-900">$9.99</span>
              <span className="mb-1 text-slate-500">/month after trial</span>
            </div>

            <ul className="mt-6 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span>
                15 analyses per month
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span>
                5 analyses during your trial
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span>
                Risk scoring with severity levels
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span>
                Clause-level recommendations
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span>
                PDF export
              </li>
            </ul>

            <button
              onClick={() => handleSelect("STARTER")}
              disabled={loading !== null}
              className="mt-8 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {loading === "STARTER" ? "Redirecting to checkout..." : "Start free trial — Starter"}
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
            <div className="mt-2 flex items-end gap-1">
              <span className="text-4xl font-bold text-slate-900">$29.99</span>
              <span className="mb-1 text-slate-500">/month after trial</span>
            </div>

            <ul className="mt-6 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                70 analyses per month
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                5 analyses during your trial
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                Risk scoring with severity levels
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                Clause-level recommendations
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                PDF export
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                Priority support
              </li>
            </ul>

            <button
              onClick={() => handleSelect("PRO")}
              disabled={loading !== null}
              className="mt-8 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading === "PRO" ? "Redirecting to checkout..." : "Start free trial — Pro"}
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          Your card will not be charged until day 30. Cancel before then and you won&apos;t pay anything.
          Secure checkout powered by Stripe.
        </p>
      </div>
    </main>
  );
}
