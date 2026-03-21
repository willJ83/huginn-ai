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
        className="inline-block rounded-2xl bg-black px-8 py-5 text-2xl font-bold text-white hover:opacity-90"
      >
        Manage Subscription
      </a>
    </div>
  ) : (
    <a
      href="/pricing"
      className="inline-block rounded-2xl bg-blue-600 px-8 py-5 text-2xl font-bold text-white hover:bg-blue-700"
    >
      Upgrade to Pro
    </a>
  );
}
