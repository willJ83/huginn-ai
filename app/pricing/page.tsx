"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

const plans = [
  {
    key: "PRO" as const,
    name: "Pro",
    price: "$19/mo",
    features: [
      "Unlimited analyses",
      "Full analyzer suite",
      "Priority processing",
    ],
  },
];

function PricingContent() {
  const searchParams = useSearchParams();
  const canceled = searchParams.get("canceled");

  const handleUpgrade = async (plan: "PRO") => {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plan }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Something went wrong");
      return;
    }

    window.location.href = data.url;
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-center text-3xl font-bold text-slate-900 sm:text-4xl">Simple, Transparent Pricing</h1>
        <p className="mt-3 text-center text-slate-600">
          Start free. Upgrade when you need more.
        </p>

        {canceled && (
          <p className="mt-6 text-center text-sm text-red-600">
            Checkout was canceled. No charges were made.
          </p>
        )}

        <div className="mt-10 grid gap-5 sm:mt-12 sm:gap-8 sm:grid-cols-2">
          {/* Free plan */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-slate-900">Free</h2>
            <p className="mt-1 text-3xl font-bold text-slate-900">$0<span className="text-base font-normal text-slate-500">/mo</span></p>
            <ul className="mt-6 space-y-2 text-sm text-slate-600">
              <li>3 analyses/month</li>
              <li>Basic document analysis</li>
              <li>Account required</li>
            </ul>
            <a
              href="/signup"
              className="mt-8 block w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Start Free
            </a>
          </div>

          {plans.map((plan) => (
            <div
              key={plan.key}
              className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <h2 className="text-xl font-semibold text-slate-900">{plan.name}</h2>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                {plan.price.split("/")[0]}
                <span className="text-base font-normal text-slate-500">/{plan.price.split("/")[1]}</span>
              </p>
              <ul className="mt-6 space-y-2 text-sm text-slate-600">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgrade(plan.key)}
                className="mt-8 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Upgrade to {plan.name}
              </button>
            </div>
          ))}
        </div>
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
