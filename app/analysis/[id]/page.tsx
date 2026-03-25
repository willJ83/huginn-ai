import { notFound } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import { prisma } from "@/lib/prisma";

type RiskLevel = "low" | "medium" | "high";

function riskBadge(level: RiskLevel) {
  switch (level) {
    case "low":
      return "bg-green-50 text-green-600";
    case "medium":
      return "bg-yellow-50 text-yellow-600";
    case "high":
      return "bg-red-50 text-red-600";
  }
}

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const report = await prisma.analysis.findUnique({
    where: { id },
  });

  if (!report) {
    notFound();
  }

  const issues = Array.isArray(report.issues) ? report.issues : [];
  const deadlines = Array.isArray(report.deadlines) ? report.deadlines : [];

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">
              Contract Analysis Report
            </h1>

            <p className="mt-2 text-slate-600">
              {report.fileName || "Untitled Document"}
            </p>

            <div className="mt-4 flex items-center gap-4">
              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${riskBadge(
                  report.riskLevel as RiskLevel
                )}`}
              >
                {report.riskLevel} risk
              </span>

              <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">
                Score {report.riskScore}/100
              </span>
            </div>
          </div>

          <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Summary</h2>
            <p className="mt-3 whitespace-pre-line text-slate-700">{report.summary}</p>
          </section>

          <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Issues Detected</h2>

            <div className="mt-4 space-y-4">
              {issues.length === 0 ? (
                <p className="text-sm text-slate-600">No issues detected.</p>
              ) : (
                issues.map((issue: any, i: number) => (
                  <div key={i} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${riskBadge(
                          issue.severity as RiskLevel
                        )}`}
                      >
                        {issue.severity}
                      </span>

                      <h3 className="font-semibold text-slate-900">{issue.label}</h3>
                    </div>

                    <p className="mt-2 text-sm text-slate-700">{issue.message}</p>

                    <p className="mt-2 text-sm font-medium text-slate-900">
                      What this means:
                    </p>

                    <p className="text-sm text-slate-600">
                      {issue.explanation || issue.message}
                    </p>

                    <p className="mt-2 text-sm font-medium text-slate-900">
                      Recommendation:
                    </p>

                    <p className="text-sm text-slate-600">
                      {issue.recommendation}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Extracted Deadlines</h2>

            <div className="mt-4 space-y-3">
              {deadlines.length === 0 ? (
                <p className="text-sm text-slate-600">No deadlines extracted.</p>
              ) : (
                deadlines.map((d: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
                  >
                    <span className="font-medium text-slate-700">{d.label}</span>
                    <span className="text-slate-600">{d.value}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
