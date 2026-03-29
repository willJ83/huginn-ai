"use client";

type UpgradeButtonProps = {
  plan: string;
  subscriptionStatus: string;
};

export default function UpgradeButton({ plan, subscriptionStatus }: UpgradeButtonProps) {
  const hasActiveSubscription =
    (plan === "STARTER" || plan === "PRO") &&
    (subscriptionStatus === "ACTIVE" || subscriptionStatus === "CANCELED");

  return hasActiveSubscription ? (
    <a
      href="/api/stripe/portal"
      className="inline-block rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
    >
      Manage Subscription
    </a>
  ) : (
    <a
      href="/select-plan"
      className="inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      Choose a Plan
    </a>
  );
}
