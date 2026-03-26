"use client";

type UpgradeButtonProps = {
  plan: string;
  subscriptionStatus: string;
  currentPeriodEnd?: Date;
};

export default function UpgradeButton({
  plan,
  subscriptionStatus,
  currentPeriodEnd,
}: UpgradeButtonProps) {
  const isPro = plan === "PRO";

  return isPro ? (
    <div>
      <a
        href="/api/stripe/portal"
        className="inline-block rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
      >
        Manage Subscription
      </a>
    </div>
  ) : (
    <a
      href="/pricing"
      className="inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      Upgrade to Pro
    </a>
  );
}
