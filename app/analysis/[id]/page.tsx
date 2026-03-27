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
      badgeClass: "bg-red-100 text-red-700",
      barClass: "bg-red-500",
      interpretation:
        "This contract has serious issues that need attention before signing.",
    };
  }
  if (score <= 70) {
    return {
      label: "MODERATE RISK",
      badgeClass: "bg-amber-100 text-amber-700",
      barClass: "bg-amber-500",
      interpretation:
        "This contract has some areas that need attention before signing.",
    };
  }
  return {
    label: "LOW RISK",
    badgeClass: "bg-green-100 text-green-700",
    barClass: "bg-green-500",
    interpretation:
      "This contract looks generally sound, but review the flagged items below.",
  };
}

function getSeverityBadge(severity: string) {
  if (severity === "critical") return "bg-purple-100 text-purple-700";
  if (severity === "high") return "bg-red-100 text-red-700";
  if (severity === "medium") return "bg-amber-100 text-amber-700";
  if (severity === "missing") return "bg-slate-100 text-slate-600";
  return "bg-green-100 text-green-700";
}

function getSeverityLabel(severity: string) {
  if (severity === "critical") return "CRITICAL";
  if (severity === "high") return "HIGH";
  if (severity === "medium") return "MEDIUM";
  if (severity === "missing") return "MISSING";
  return "LOW";
}

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const report = await prisma.analysis.findUnique({ where: { id } });
  if (!report) notFound();

  const issues = Array.isArray(report.issues) ? report.issues : [];
  const deadlines = Array.isArray(report.deadlines) ? report.deadlines : [];
  const riskInfo = getRiskInfo(report.riskScore);

  const issuesTyped = issues as any[];
  const highCount = issuesTyped.filter((i) => i.severity === "high").length;
  const mediumCount = issuesTyped.filter((i) => i.severity === "medium").length;
  const topIssue: any = issuesTyped.find((i) => i.severity === "high") || issuesTyped[0];

  const summaryIntro =
    issues.length === 0
      ? "We reviewed this contract and found no significant issues. It looks clean — review the full details before signing."
      : `We found ${issues.length} ${issues.length === 1 ? "issue" : "issues"} in this contract.${
          topIssue?.label ? ` ${topIssue.label} is your biggest concern.` : ""
        } Here's what you need to know before signing.`;

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-10">

          {/* Page header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-slate-900">
              Contract Analysis Report
            </h1>
            <p className="mt-1 text-slate-500">{report.fileName || "Untitled Document"}</p>
          </div>

          {/* Health summary card */}
          <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Contract Health Score
            </p>

            <div className="mt-4 flex flex-wrap items-end gap-3">
              <span className="text-5xl font-bold text-slate-900">
                {report.riskScore}
              </span>
              <span className="mb-1 text-xl font-medium text-slate-400">/ 100</span>
              <span
                className={`mb-1 rounded-full px-3 py-1 text-sm font-bold ${riskInfo.badgeClass}`}
              >
                {riskInfo.label}
              </span>
            </div>

            <div className="mt-4 h-3 w-full rounded-full bg-slate-100">
              <div
                className={`h-3 rounded-full ${riskInfo.barClass}`}
                style={{ width: `${report.riskScore}%` }}
              />
            </div>

            <p className="mt-3 text-slate-700">{riskInfo.interpretation}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
                {highCount} High Risk {highCount === 1 ? "Issue" : "Issues"}
              </span>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                {mediumCount} Moderate {mediumCount === 1 ? "Issue" : "Issues"}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                {deadlines.length} {deadlines.length === 1 ? "Deadline" : "Deadlines"}
              </span>
            </div>
          </section>

          {/* Before you sign */}
          <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Before You Sign</h2>
            <p className="mt-3 leading-relaxed text-slate-700">{summaryIntro}</p>
            {report.summary && (
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {report.summary}
              </p>
            )}
          </section>

          {/* Issues */}
          <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              {issues.length === 0
                ? "Issues Found"
                : `${issues.length} ${issues.length === 1 ? "Issue" : "Issues"} Found`}
            </h2>

            <div className="mt-4 space-y-4">
              {issues.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No issues found in this contract.
                </p>
              ) : (
                issues.map((issue: any, i: number) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex flex-wrap items-start gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${getSeverityBadge(
                          issue.severity
                        )}`}
                      >
                        {getSeverityLabel(issue.severity)}
                      </span>
                      <h3 className="font-semibold text-slate-900">
                        {issue.label}
                      </h3>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        What this means for your business
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-700">
                        {issue.explanation || issue.message}
                      </p>
                    </div>

                    {issue.recommendation && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          What to do
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-700">
                          {issue.recommendation}
                        </p>
                      </div>
                    )}

                    {Array.isArray(issue.matches) && issue.matches.length > 0 && (
                      <details className="mt-4">
                        <summary className="cursor-pointer select-none text-xs font-semibold text-slate-400 hover:text-slate-600">
                          ▶ See the clause that triggered this flag
                        </summary>
                        <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                          {issue.matches.map((match: string, mi: number) => (
                            <p
                              key={mi}
                              className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-600"
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
          <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Time-Sensitive Clauses
            </h2>

            <div className="mt-4">
              {deadlines.length === 0 ? (
                <p className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
                  No auto-renewals or hard deadlines detected — nothing here
                  requires immediate action on your calendar.
                </p>
              ) : (
                <div className="space-y-3">
                  {deadlines.map((d: any, i: number) => (
                    <div
                      key={i}
                      className="flex flex-col gap-1 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {d.label || "Deadline"}
                        </p>
                        {d.description && (
                          <p className="mt-1 text-sm text-slate-600">
                            {d.description}
                          </p>
                        )}
                      </div>
                      <span className="whitespace-nowrap rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                        {d.value || "See contract"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* CTA bar */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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
                  className="inline-flex items-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Analyze Another Contract
                </Link>
              </div>
              <p className="text-xs text-slate-400">
                Your contract was not stored. All analysis is private.
              </p>
            </div>
          </section>

        </div>
      </main>
    </>
  );
}
