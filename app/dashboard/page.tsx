import { auth } from "@/lib/auth";
import { canUseFeature, getUsageCountSince, PLAN_LIMITS } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import DashboardAnalyzer from "./DashboardAnalyzer";
import LogoutButton from "./LogoutButton";
import AppHeader from "@/app/components/AppHeader";
import UsageWarningBanner from "./UsageWarningBanner";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string; added_analyses?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const justUpgraded = params.upgraded === "true";
  const addedAnalyses = params.added_analyses ? parseInt(params.added_analyses, 10) : null;

  const [user, usageInfo, recentAnalyses, shieldDeepTrialsUsed] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        plan: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
        trialEndsAt: true,
        addonAnalysesRemaining: true,
      },
    }),
    canUseFeature(session.user.id),
    prisma.analysis.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, fileName: true, createdAt: true, riskScore: true, riskLevel: true },
    }),
    // Lifetime Deep Scan count — used to gate the 2-trial allowance for Free/Starter users
    getUsageCountSince(session.user.id, new Date(0), "shield_deep"),
  ]);

  // Redirect to plan selection if no subscription set up — but not for FREE tier users
  // (FREE users stay on dashboard until they exhaust their free analyses)
  if (usageInfo.needsPlan && usageInfo.plan !== "FREE" && !justUpgraded) {
    redirect("/select-plan");
  }

  // Plan label
  let planLabel: string;
  if (user?.plan === "FREE" && user?.subscriptionStatus === "INACTIVE") {
    const used = usageInfo.periodUsed ?? 0;
    const limit = usageInfo.periodLimit ?? PLAN_LIMITS.FREE;
    planLabel = `Free — ${used} of ${limit} free analyses used`;
  } else if (usageInfo.inTrial) {
    const daysLeft = user?.trialEndsAt
      ? Math.max(0, Math.ceil((user.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;
    planLabel = `${user?.plan === "PRO" ? "Pro" : "Starter"} — Free trial (${daysLeft} day${daysLeft !== 1 ? "s" : ""} left)`;
  } else if (user?.subscriptionStatus === "CANCELED" && user?.currentPeriodEnd) {
    const planName = user.plan === "PRO" ? "Pro" : "Starter";
    planLabel = `${planName} — Cancels ${new Date(user.currentPeriodEnd).toLocaleDateString()}`;
  } else if (user?.subscriptionStatus === "PAST_DUE") {
    const planName = user?.plan === "PRO" ? "Pro" : "Starter";
    planLabel = `${planName} — Payment failed`;
  } else {
    planLabel = user?.plan === "PRO" ? "Pro" : "Starter";
  }

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

        {/* Plan + usage status */}
        <div className="mt-4">
          <p className="text-sm text-slate-500">
            Plan: <span className="font-medium text-slate-700">{planLabel}</span>
          </p>

          {justUpgraded && usageInfo.needsPlan && (
            <p className="mt-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Your subscription is being activated. This page will update shortly — refresh in a moment.
            </p>
          )}

          {/* Paid plan usage */}
          {!usageInfo.inTrial && usageInfo.plan !== "FREE" && !usageInfo.needsPlan && !usageInfo.paymentFailed && (
            <p className="mt-1 text-sm text-slate-500">
              This month: {usageInfo.periodUsed} / {usageInfo.periodLimit} analyses used
              {usageInfo.addonRemaining > 0
                ? ` + ${usageInfo.addonRemaining} add-on remaining`
                : ""}
            </p>
          )}

          {/* Add-on purchase success */}
          {addedAnalyses && addedAnalyses > 0 && (
            <p className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {addedAnalyses} extra {addedAnalyses === 1 ? "analysis" : "analyses"} added to your account.
            </p>
          )}

          {/* Payment failed */}
          {usageInfo.paymentFailed && (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              Your payment failed. Update your billing information to continue.{" "}
              <a href="/api/stripe/portal" className="underline">
                Update billing
              </a>
            </p>
          )}

          {/* Grace period notice */}
          {user?.plan !== "FREE" &&
            user?.subscriptionStatus === "CANCELED" &&
            user?.currentPeriodEnd && (
              <p className="mt-2 text-sm text-slate-600">
                Your access continues until{" "}
                {new Date(user.currentPeriodEnd).toLocaleDateString()}.
              </p>
            )}

          {/* Low usage warning banner */}
          <UsageWarningBanner
            remaining={usageInfo.remaining}
            planRemaining={usageInfo.planRemaining}
            inTrial={usageInfo.inTrial}
            plan={user?.plan ?? "STARTER"}
          />
        </div>

        {/* Subscription management — hidden for FREE plan users */}
        {user?.plan !== "FREE" && (
          <div className="mt-6 flex flex-wrap gap-3">
            {(user?.subscriptionStatus === "ACTIVE" || user?.subscriptionStatus === "CANCELED") ? (
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
            )}

            {/* Buy more analyses button — shown at limit */}
            {usageInfo.remaining === 0 && !usageInfo.paymentFailed && (
              <BuyMoreButton />
            )}
          </div>
        )}

        <DashboardAnalyzer
          usageInfo={{
            plan: usageInfo.plan,
            inTrial: usageInfo.inTrial,
            remaining: usageInfo.remaining,
            planRemaining: usageInfo.planRemaining,
            addonRemaining: usageInfo.addonRemaining,
            periodUsed: usageInfo.periodUsed,
            periodLimit: usageInfo.periodLimit,
            paymentFailed: usageInfo.paymentFailed,
            needsPlan: usageInfo.needsPlan,
          }}
          shieldDeepTrialsUsed={shieldDeepTrialsUsed}
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

function BuyMoreButton() {
  return (
    <a
      href="/dashboard#buy-more"
      className="inline-block rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
    >
      Buy More Analyses
    </a>
  );
}
