import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/app/components/AppHeader";
import DownloadPdfButton from "@/app/components/DownloadPdfButton";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

function getRiskInfo(score: number) {
  if (score <= 40) {
    return {
      label: "HIGH RISK",
      badgeClass: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
      barClass: "bg-red-500",
      interpretation: "This contract has serious issues that need attention before signing.",
    };
  }
  if (score <= 70) {
    return {
      label: "MODERATE RISK",
      badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
      barClass: "bg-amber-500",
      interpretation: "This contract has some areas that need attention before signing.",
    };
  }
  return {
    label: "LOW RISK",
    badgeClass: "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400",
    barClass: "bg-green-500",
    interpretation: "This contract looks generally sound, but review the flagged items below.",
  };
}

function getSeverityBadge(severity: string) {
  if (severity === "critical") return "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400";
  if (severity === "high")     return "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400";
  if (severity === "medium")   return "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400";
  if (severity === "missing")  return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
  return "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400";
}

function getSeverityLabel(severity: string) {
  if (severity === "critical") return "CRITICAL";
  if (severity === "high")     return "HIGH";
  if (severity === "medium")   return "MEDIUM";
  if (severity === "missing")  return "MISSING";
  return "LOW";
}

const card = "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900";

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const report = await prisma.analysis.findUnique({ where: { id } });
  if (!report) notFound();

  const issues    = Array.isArray(report.issues)    ? report.issues    : [];
  const deadlines = Array.isArray(report.deadlines) ? report.deadlines : [];
  const riskInfo  = getRiskInfo(report.riskScore);
  const metadata  = report.metadata && typeof report.metadata === "object" ? report.metadata as any : {};
  const jurisdictionAnalysis = metadata.jurisdictionAnalysis ?? null;
  const storedContractType: string = metadata.contractType ?? "";
  const isFinancingContract = /financ|loan|merchant\s*cash|advance|lending|credit\s*agree|borrow|installment/i.test(storedContractType);

  const issuesTyped = issues as any[];
  const highCount   = issuesTyped.filter((i) => i.severity === "high").length;
  const mediumCount = issuesTyped.filter((i) => i.severity === "medium").length;
  const topIssue    = issuesTyped.find((i) => i.severity === "high") || issuesTyped[0];

  const summaryIntro =
    issues.length === 0
      ? "We reviewed this contract and found no significant issues. It looks clean — review the full details before signing."
      : `We found ${issues.length} ${issues.length === 1 ? "issue" : "issues"} in this contract.${
          topIssue?.label ? ` ${topIssue.label} is your biggest concern.` : ""
        } Here's what you need to know before signing.`;

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="mx-auto max-w-5xl px-6 py-10">

          {/* Page header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-slate-50">
              Contract Analysis Report
            </h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">{report.fileName || "Untitled Document"}</p>
          </div>

          {/* Health summary card */}
          <section className={`mb-8 ${card}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Contract Health Score
            </p>

            <div className="mt-4 flex flex-wrap items-end gap-3">
              <span className="text-5xl font-bold text-slate-900 dark:text-slate-50">
                {report.riskScore}
              </span>
              <span className="mb-1 text-xl font-medium text-slate-400 dark:text-slate-500">/ 100</span>
              <span className={`mb-1 rounded-full px-3 py-1 text-sm font-bold ${riskInfo.badgeClass}`}>
                {riskInfo.label}
              </span>
            </div>

            <div className="mt-4 h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-3 rounded-full ${riskInfo.barClass}`}
                style={{ width: `${report.riskScore}%` }}
              />
            </div>

            <p className="mt-3 text-slate-700 dark:text-slate-300">{riskInfo.interpretation}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-400">
                {highCount} High Risk {highCount === 1 ? "Issue" : "Issues"}
              </span>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                {mediumCount} Moderate {mediumCount === 1 ? "Issue" : "Issues"}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {deadlines.length} {deadlines.length === 1 ? "Deadline" : "Deadlines"}
              </span>
            </div>
          </section>

          {/* Before you sign */}
          <section className={`mb-8 ${card}`}>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Before You Sign</h2>
            <p className="mt-3 leading-relaxed text-slate-700 dark:text-slate-300">{summaryIntro}</p>
            {report.summary && (
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {report.summary}
              </p>
            )}
          </section>

          {/* Issues */}
          <section className={`mb-8 ${card}`}>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              {issues.length === 0
                ? "Issues Found"
                : `${issues.length} ${issues.length === 1 ? "Issue" : "Issues"} Found`}
            </h2>

            <div className="mt-4 space-y-4">
              {issues.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  No issues found in this contract.
                </p>
              ) : (
                issues.map((issue: any, i: number) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700"
                  >
                    <div className="flex flex-wrap items-start gap-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getSeverityBadge(issue.severity)}`}>
                        {getSeverityLabel(issue.severity)}
                      </span>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-50">
                        {issue.label}
                      </h3>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        What this means for your business
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        {issue.explanation || issue.message}
                      </p>
                    </div>

                    {issue.recommendation && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          What to do
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                          {issue.recommendation}
                        </p>
                      </div>
                    )}

                    {Array.isArray(issue.matches) && issue.matches.length > 0 && (
                      <details className="mt-4">
                        <summary className="cursor-pointer select-none text-xs font-semibold text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                          ▶ See the clause that triggered this flag
                        </summary>
                        <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                          {issue.matches.map((match: string, mi: number) => (
                            <p
                              key={mi}
                              className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-600 dark:text-slate-400"
                            >
                              {match}
                            </p>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Deadlines */}
          <section className={`mb-8 ${card}`}>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Time-Sensitive Clauses
            </h2>

            <div className="mt-4">
              {deadlines.length === 0 ? (
                <p className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400">
                  No auto-renewals or hard deadlines detected — nothing here requires immediate action on your calendar.
                </p>
              ) : (
                <div className="space-y-3">
                  {deadlines.map((d: any, i: number) => (
                    <div
                      key={i}
                      className="flex flex-col gap-1 rounded-xl border border-slate-200 p-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-50">
                          {d.label || "Deadline"}
                        </p>
                        {d.description && (
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                            {d.description}
                          </p>
                        )}
                      </div>
                      <span className="whitespace-nowrap rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                        {d.value || "See contract"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Jurisdiction Analysis */}
          {jurisdictionAnalysis && (
            <section className={`mb-8 rounded-3xl border p-6 shadow-sm ${
              jurisdictionAnalysis.risk === "High"
                ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20"
                : jurisdictionAnalysis.risk === "Medium"
                ? "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20"
                : "border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/20"
            }`}>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span aria-hidden="true" className="text-xl">🛡️</span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Jurisdiction Analysis</h2>
                <span className={`rounded-full px-3 py-1 text-sm font-bold ${
                  jurisdictionAnalysis.risk === "High"
                    ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                    : jurisdictionAnalysis.risk === "Medium"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                    : "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400"
                }`}>
                  {jurisdictionAnalysis.risk} Risk
                </span>
              </div>

              <p className="leading-relaxed text-slate-700 dark:text-slate-300">{jurisdictionAnalysis.explanation}</p>

              {jurisdictionAnalysis.recommendation && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Recommended Action
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {jurisdictionAnalysis.recommendation}
                  </p>
                </div>
              )}

              {(jurisdictionAnalysis.governingLaw || jurisdictionAnalysis.forumClause) && (
                <div className="mt-4 flex flex-wrap gap-4">
                  {jurisdictionAnalysis.governingLaw && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Governing Law</p>
                      <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">{jurisdictionAnalysis.governingLaw}</p>
                    </div>
                  )}
                  {jurisdictionAnalysis.forumClause && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Forum / Venue</p>
                      <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">{jurisdictionAnalysis.forumClause}</p>
                    </div>
                  )}
                </div>
              )}

              {Array.isArray(jurisdictionAnalysis.floridaChecklist) && jurisdictionAnalysis.floridaChecklist.length > 0 && isFinancingContract && (
                <div className="mt-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Florida F.S. §559.9613 — Required Disclosure Checklist
                  </p>
                  <div className="space-y-2">
                    {jurisdictionAnalysis.floridaChecklist.map((item: { item: string; present: boolean }, i: number) => (
                      <div key={i} className={`flex items-start gap-3 rounded-xl border px-4 py-2.5 ${
                        item.present
                          ? "border-green-200 bg-white dark:border-green-900/50 dark:bg-green-950/10"
                          : "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20"
                      }`}>
                        <span className="mt-0.5 text-base">{item.present ? "✅" : "❌"}</span>
                        <span className={`text-sm ${
                          item.present
                            ? "text-slate-600 dark:text-slate-400"
                            : "font-semibold text-red-700 dark:text-red-400"
                        }`}>
                          {item.item}
                          {!item.present && " — Missing"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(jurisdictionAnalysis.californiaChecklist) && jurisdictionAnalysis.californiaChecklist.length > 0 && (
                <div className="mt-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    California Compliance Checklist
                  </p>
                  <div className="space-y-2">
                    {jurisdictionAnalysis.californiaChecklist.map((item: { item: string; present: boolean; risk?: string }, i: number) => (
                      <div key={i} className={`flex items-start gap-3 rounded-xl border px-4 py-2.5 ${
                        item.present
                          ? "border-green-200 bg-white dark:border-green-900/50 dark:bg-green-950/10"
                          : "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20"
                      }`}>
                        <span className="mt-0.5 text-base">{item.present ? "✅" : "❌"}</span>
                        <span className={`text-sm ${
                          item.present
                            ? "text-slate-600 dark:text-slate-400"
                            : "font-semibold text-red-700 dark:text-red-400"
                        }`}>
                          {item.item}
                          {!item.present && item.risk && ` — ${item.risk} Risk`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(jurisdictionAnalysis.texasChecklist) && jurisdictionAnalysis.texasChecklist.length > 0 && (
                <div className="mt-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Texas Compliance Checklist
                  </p>
                  <div className="space-y-2">
                    {jurisdictionAnalysis.texasChecklist.map((item: { item: string; present: boolean; risk?: string }, i: number) => (
                      <div key={i} className={`flex items-start gap-3 rounded-xl border px-4 py-2.5 ${
                        item.present
                          ? "border-green-200 bg-white dark:border-green-900/50 dark:bg-green-950/10"
                          : "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20"
                      }`}>
                        <span className="mt-0.5 text-base">{item.present ? "✅" : "❌"}</span>
                        <span className={`text-sm ${
                          item.present
                            ? "text-slate-600 dark:text-slate-400"
                            : "font-semibold text-red-700 dark:text-red-400"
                        }`}>
                          {item.item}
                          {!item.present && item.risk && ` — ${item.risk} Risk`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* CTA bar */}
          <section className={card}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-3">
                <DownloadPdfButton
                  data={{
                    fileName: report.fileName,
                    analysisDate: report.createdAt.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }),
                    riskScore: report.riskScore,
                    summary: report.summary,
                    issues: issuesTyped,
                    deadlines: deadlines as any[],
                  }}
                />
                <Link
                  href="/dashboard"
                  className="inline-flex items-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Analyze Another Contract
                </Link>
              </div>
              <p className="max-w-md text-xs text-slate-400 dark:text-slate-500">
                <strong>Disclaimer:</strong> This is informational only and not legal advice. Laws change and vary by jurisdiction; always consult a licensed attorney in your jurisdiction for binding decisions.
              </p>
            </div>
          </section>

        </div>
      </main>
    </>
  );
}
