import { auth } from "@/lib/auth";
import { getMonthlyUsageCount, hasUnlimitedAnalysisAccess, PLAN_LIMITS } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import UpgradeButton from "./UpgradeButton";
import DashboardAnalyzer from "./DashboardAnalyzer";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [user, monthlyUsageCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        plan: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
      },
    }),
    getMonthlyUsageCount(session.user.id),
  ]);

  const planLabel =
    user?.plan === "FREE"
      ? "FREE"
      : user?.subscriptionStatus === "CANCELED" && user?.currentPeriodEnd
      ? `PRO (Cancels ${new Date(user.currentPeriodEnd).toLocaleDateString()})`
      : user?.subscriptionStatus === "CANCELED"
      ? "PRO (Cancels at period end)"
      : user?.subscriptionStatus === "PAST_DUE"
      ? "PRO (Payment issue)"
      : "PRO (Active)";

  const hasUnlimitedAccess = user ? hasUnlimitedAnalysisAccess(user) : false;
  const freeUsageCount = Math.min(monthlyUsageCount, PLAN_LIMITS.FREE);
  const remainingFreeAnalyses = Math.max(0, PLAN_LIMITS.FREE - freeUsageCount);
  const hasReachedFreeLimit = !hasUnlimitedAccess && freeUsageCount >= PLAN_LIMITS.FREE;

  const usageLabel = hasUnlimitedAccess
    ? "Pro plan: Unlimited analyses"
    : `${freeUsageCount} / ${PLAN_LIMITS.FREE} free analyses used this month`;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-5 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-lg text-slate-600">
          Welcome, {session?.user?.name || "User"}.
        </p>

        <p className="mt-4 text-sm text-slate-500">
          Current Plan: {planLabel}
        </p>
        <p className="mt-1 text-sm text-slate-500">{usageLabel}</p>

        {hasReachedFreeLimit ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            You've reached your free limit. Upgrade to Pro for unlimited access.
          </p>
        ) : null}

        {user?.plan === "PRO" && user?.subscriptionStatus === "CANCELED" && user?.currentPeriodEnd && (
          <p className="text-sm text-slate-600 mt-2">
            Your Pro access continues until {new Date(user.currentPeriodEnd).toLocaleDateString()}.
          </p>
        )}
        {user?.plan === "PRO" && user?.subscriptionStatus === "CANCELED" && !user?.currentPeriodEnd && (
          <p className="text-sm text-slate-600 mt-2">
            Your Pro access continues until the end of your billing period.
          </p>
        )}

        <div className="mt-6">
          {user?.plan !== "PRO" ? (
            <p className="mb-4 text-lg text-slate-600">
              Upgrade to Pro for unlimited analyses and priority processing.
            </p>
          ) : null}

          <UpgradeButton
            plan={user?.plan ?? "FREE"}
            subscriptionStatus={user?.subscriptionStatus ?? "INACTIVE"}
            currentPeriodEnd={user?.currentPeriodEnd ?? undefined}
          />
        </div>

        <DashboardAnalyzer
          hasUnlimitedAccess={hasUnlimitedAccess}
          initialRemainingAnalyses={remainingFreeAnalyses}
        />
      </div>
    </main>
  );
}
