import { auth } from "@/lib/auth";
import { getMonthlyUsageCount, hasUnlimitedAnalysisAccess, PLAN_LIMITS } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import UpgradeButton from "./UpgradeButton";
import DashboardAnalyzer from "./DashboardAnalyzer";
import LogoutButton from "./LogoutButton";
import AppHeader from "@/app/components/AppHeader";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [user, monthlyUsageCount, recentAnalyses] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        plan: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
      },
    }),
    getMonthlyUsageCount(session.user.id),
    prisma.analysis.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, fileName: true, createdAt: true, riskScore: true, riskLevel: true },
    }),
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
      <AppHeader />
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-5 shadow-sm sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Dashboard</h1>
            <p className="mt-1 text-lg text-slate-600">
              Welcome, {session?.user?.name || "User"}.
            </p>
          </div>

          <LogoutButton />
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Current Plan: {planLabel}
        </p>
        {hasUnlimitedAccess ? (
          <p className="mt-1 text-sm text-slate-500">{usageLabel}</p>
        ) : null}

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
              Upgrade to Pro for unlimited analyses, clause-level recommendations, and priority support.
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
          freeLimit={PLAN_LIMITS.FREE}
        />

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">Recent Analyses</h2>

          {recentAnalyses.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No analyses yet. Upload a document to get started.</p>
          ) : (
            <>
              {/* Mobile card layout */}
              <div className="mt-3 flex flex-col gap-3 sm:hidden">
                {recentAnalyses.map((analysis) => (
                  <div key={analysis.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-slate-800 text-sm">{analysis.fileName || "Untitled Document"}</p>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                        analysis.riskLevel === "high"
                          ? "bg-red-50 text-red-600"
                          : analysis.riskLevel === "medium"
                          ? "bg-yellow-50 text-yellow-600"
                          : "bg-green-50 text-green-600"
                      }`}>
                        {analysis.riskLevel}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>{new Date(analysis.createdAt).toLocaleDateString()}</span>
                      <span>Score: {analysis.riskScore} / 100</span>
                      <Link href={`/analysis/${analysis.id}`} className="font-medium text-blue-600 hover:text-blue-700">
                        View →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table layout */}
              <div className="mt-3 hidden overflow-hidden rounded-2xl border border-slate-200 sm:block">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">File</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Risk Score</th>
                      <th className="px-4 py-3">Risk Level</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentAnalyses.map((analysis) => (
                      <tr key={analysis.id} className="bg-white">
                        <td className="px-4 py-3 font-medium text-slate-800">{analysis.fileName || "Untitled Document"}</td>
                        <td className="px-4 py-3 text-slate-500">{new Date(analysis.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-slate-700">{analysis.riskScore} / 100</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            analysis.riskLevel === "high"
                              ? "bg-red-50 text-red-600"
                              : analysis.riskLevel === "medium"
                              ? "bg-yellow-50 text-yellow-600"
                              : "bg-green-50 text-green-600"
                          }`}>
                            {analysis.riskLevel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/analysis/${analysis.id}`} className="font-medium text-blue-600 hover:text-blue-700">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
