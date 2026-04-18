"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

type DemoIssue = {
  id?: string;
  label?: string;
  severity?: string;
  explanation?: string;
  recommendation?: string;
  matches?: string[];
};

type DemoDeadline = {
  label?: string;
  value?: string;
  description?: string;
};

type DemoResult = {
  demoName: string;
  demoId: string;
  riskScore: number;
  riskLevel: string;
  summary: string;
  issues: DemoIssue[];
  deadlines: DemoDeadline[];
  jurisdiction: string | null;
  jurisdictionConfidence: "high" | "medium" | "low";
  jurisdictionAnalysis: string[];
  jurisdictionDeepScan: string[];
  jurisdictionComparisonNote?: string;
};

function getRiskInfo(score: number) {
  if (score <= 40) {
    return {
      label: "HIGH RISK",
      badgeClass: "bg-red-100 text-red-700 border border-red-200",
      barClass: "bg-red-500",
      scoreClass: "text-red-600",
      sectionClass: "border-red-200 bg-red-50",
    };
  }
  if (score <= 70) {
    return {
      label: "MODERATE RISK",
      badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
      barClass: "bg-amber-500",
      scoreClass: "text-amber-600",
      sectionClass: "border-amber-200 bg-amber-50",
    };
  }
  return {
    label: "LOW RISK",
    badgeClass: "bg-green-100 text-green-700 border border-green-200",
    barClass: "bg-green-500",
    scoreClass: "text-green-600",
    sectionClass: "border-green-200 bg-green-50",
  };
}

function getSeverityStyle(severity?: string) {
  if (severity === "critical") return "bg-purple-100 text-purple-700";
  if (severity === "high") return "bg-red-100 text-red-700";
  if (severity === "medium") return "bg-amber-100 text-amber-700";
  if (severity === "missing") return "bg-slate-100 text-slate-600";
  return "bg-green-100 text-green-700";
}

function getSeverityLabel(severity?: string) {
  if (severity === "critical") return "CRITICAL";
  if (severity === "high") return "HIGH";
  if (severity === "medium") return "MEDIUM";
  if (severity === "missing") return "MISSING";
  return "LOW";
}

function ConfidencePill({ confidence }: { confidence: "high" | "medium" | "low" }) {
  const styles = {
    high: "bg-green-100 text-green-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${styles[confidence]}`}>
      {confidence.charAt(0).toUpperCase() + confidence.slice(1)} confidence
    </span>
  );
}

export default function WelcomeDemoSection() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<"demo1" | "demo2" | null>(null);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState("");
  const [expandedIssues, setExpandedIssues] = useState<Set<number>>(new Set());

  const uploadHref = session ? "/dashboard" : "/signup";

  function toggleIssue(index: number) {
    setExpandedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function runDemo(contractId: "demo1" | "demo2") {
    setIsLoading(true);
    setLoadingId(contractId);
    setError("");
    setResult(null);
    setExpandedIssues(new Set());

    try {
      const response = await fetch("/api/demo-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error ?? "Analysis failed. Please try again.");
        return;
      }

      setResult(data as DemoResult);

      // Scroll result into view
      setTimeout(() => {
        document.getElementById("demo-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch {
      setError("Request failed. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
      setLoadingId(null);
    }
  }

  const riskInfo = result ? getRiskInfo(result.riskScore) : null;
  const highCount = result?.issues.filter((i) => i.severity === "high" || i.severity === "critical").length ?? 0;
  const mediumCount = result?.issues.filter((i) => i.severity === "medium").length ?? 0;

  return (
    <>
      {/* ── Demo CTA Section ────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-200 py-14 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">
            Live Demo — No Login Required
          </p>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            See Contract Risk in Seconds
          </h2>
          <p className="text-slate-500 text-base max-w-xl mx-auto mb-8">
            Upload a contract or run a sample — Huginn flags risk, missing protections, deadlines,
            and jurisdiction-specific issues.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {/* Demo 1 */}
            <button
              type="button"
              onClick={() => runDemo("demo1")}
              disabled={isLoading}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-base font-semibold transition
                ${loadingId === "demo1" && isLoading
                  ? "bg-blue-400 text-white cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white"
                } disabled:opacity-70`}
            >
              {loadingId === "demo1" && isLoading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Analyzing...
                </>
              ) : (
                <>Run Demo 1 — California</>
              )}
            </button>

            {/* Demo 2 */}
            <button
              type="button"
              onClick={() => runDemo("demo2")}
              disabled={isLoading}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-base font-semibold transition
                ${loadingId === "demo2" && isLoading
                  ? "bg-slate-400 text-white cursor-not-allowed"
                  : "bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white"
                } disabled:opacity-70`}
            >
              {loadingId === "demo2" && isLoading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Analyzing...
                </>
              ) : (
                <>Run Demo 2 — Texas</>
              )}
            </button>

            {/* Upload */}
            <Link
              href={uploadHref}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 px-7 py-3.5 text-base font-semibold text-slate-700 transition"
            >
              Upload Your Contract
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <p className="mt-5 text-xs text-slate-400">
            Demo 1 uses a California contract · Demo 2 uses a Texas contract · Compare them to see how jurisdiction changes the analysis
          </p>
        </div>
      </section>

      {/* ── Loading State ───────────────────────────────────────────────────── */}
      {isLoading && (
        <section className="bg-slate-50 py-16 px-6">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-4" />
            <p className="text-lg font-semibold text-slate-800">Analyzing contract...</p>
            <p className="mt-1 text-sm text-slate-500">
              Running 4-stage analysis pipeline · Extracting clauses · Applying jurisdiction-specific rules
            </p>
            <p className="mt-1 text-xs text-slate-400">This usually takes 20–40 seconds</p>
          </div>
        </section>
      )}

      {/* ── Error ────────────────────────────────────────────────────────────── */}
      {error && !isLoading && (
        <section className="bg-slate-50 py-8 px-6">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
              {error}
            </div>
          </div>
        </section>
      )}

      {/* ── Demo Result ──────────────────────────────────────────────────────── */}
      {result && !isLoading && riskInfo && (
        <section id="demo-result" className="bg-slate-50 py-12 px-6">
          <div className="mx-auto max-w-4xl space-y-6">

            {/* Result header */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
                    Demo Analysis Complete
                  </p>
                  <h2 className="text-xl font-bold text-slate-900">{result.demoName}</h2>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-bold ${riskInfo.badgeClass}`}>
                  {riskInfo.label}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-end gap-3">
                <span className={`text-5xl font-bold tabular-nums ${riskInfo.scoreClass}`}>
                  {result.riskScore}
                </span>
                <span className="mb-1 text-xl font-medium text-slate-400">/ 100</span>
              </div>
              <div className="mt-3 h-3 w-full rounded-full bg-slate-100">
                <div
                  className={`h-3 rounded-full ${riskInfo.barClass} transition-all duration-700`}
                  style={{ width: `${result.riskScore}%` }}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                  {highCount} High Risk {highCount === 1 ? "Issue" : "Issues"}
                </span>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  {mediumCount} Moderate {mediumCount === 1 ? "Issue" : "Issues"}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {result.deadlines.length} {result.deadlines.length === 1 ? "Deadline" : "Deadlines"}
                </span>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-3">Before You Sign</h3>
              <p className="text-slate-700 leading-relaxed">{result.summary}</p>
            </div>

            {/* ── Jurisdiction Analysis ──────────────────────────────────────── */}
            {result.jurisdictionAnalysis.length > 0 && (
              <div className="rounded-3xl border-2 border-blue-200 bg-blue-50 p-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span aria-hidden="true" className="text-2xl">🛡️</span>
                  <h3 className="text-lg font-bold text-slate-900">Jurisdiction Analysis</h3>
                  {result.jurisdiction && (
                    <span className="rounded-full bg-blue-100 border border-blue-200 px-3 py-0.5 text-sm font-semibold text-blue-800">
                      {result.jurisdiction}
                    </span>
                  )}
                  <ConfidencePill confidence={result.jurisdictionConfidence} />
                </div>
                <ul className="space-y-2">
                  {result.jurisdictionAnalysis.map((finding, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
                      <span className="mt-1 shrink-0 h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden="true" />
                      {finding}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── Jurisdiction Deep Scan ─────────────────────────────────────── */}
            {result.jurisdictionDeepScan.length > 0 && (
              <div className="rounded-3xl border-2 border-indigo-200 bg-indigo-50 p-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span aria-hidden="true" className="text-2xl">🔍</span>
                  <h3 className="text-lg font-bold text-slate-900">Jurisdiction Deep Scan</h3>
                  {result.jurisdiction && (
                    <span className="rounded-full bg-indigo-100 border border-indigo-200 px-3 py-0.5 text-sm font-semibold text-indigo-800">
                      {result.jurisdiction}-Specific Findings
                    </span>
                  )}
                </div>
                <ul className="space-y-3">
                  {result.jurisdictionDeepScan.map((finding, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
                      <span className="mt-1 shrink-0 h-1.5 w-1.5 rounded-full bg-indigo-500" aria-hidden="true" />
                      {finding}
                    </li>
                  ))}
                </ul>
                {result.jurisdictionComparisonNote && (
                  <div className="mt-4 rounded-xl border border-indigo-200 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 mb-1">
                      Jurisdiction Comparison
                    </p>
                    <p className="text-sm text-slate-700">{result.jurisdictionComparisonNote}</p>
                  </div>
                )}
              </div>
            )}

            {/* Issues */}
            {result.issues.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  {result.issues.length} {result.issues.length === 1 ? "Issue" : "Issues"} Found
                </h3>
                <div className="space-y-3">
                  {result.issues.slice(0, 8).map((issue, i) => (
                    <div key={`${issue.id}-${i}`} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-start gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${getSeverityStyle(issue.severity)}`}>
                          {getSeverityLabel(issue.severity)}
                        </span>
                        <p className="font-semibold text-slate-900 text-sm">{issue.label}</p>
                      </div>

                      {issue.explanation && (
                        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                          {issue.explanation}
                        </p>
                      )}

                      {issue.recommendation && (
                        <button
                          type="button"
                          onClick={() => toggleIssue(i)}
                          className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800"
                        >
                          {expandedIssues.has(i) ? "▾ Hide recommendation" : "▸ Show recommendation"}
                        </button>
                      )}

                      {expandedIssues.has(i) && issue.recommendation && (
                        <div className="mt-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                            What to do
                          </p>
                          <p className="text-sm text-slate-700">{issue.recommendation}</p>
                        </div>
                      )}

                      {Array.isArray(issue.matches) && issue.matches.length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs font-medium text-slate-400 hover:text-slate-600 select-none">
                            ▶ See triggering clause
                          </summary>
                          <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200 p-3">
                            {issue.matches.map((m, mi) => (
                              <p key={mi} className="font-mono text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                                {m}
                              </p>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                  {result.issues.length > 8 && (
                    <p className="text-sm text-slate-500 text-center pt-1">
                      + {result.issues.length - 8} more issues in full report
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Deadlines */}
            {result.deadlines.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Time-Sensitive Clauses</h3>
                <div className="space-y-3">
                  {result.deadlines.map((d, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-1 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{d.label}</p>
                        {d.description && (
                          <p className="mt-0.5 text-sm text-slate-600">{d.description}</p>
                        )}
                      </div>
                      {d.value && (
                        <span className="whitespace-nowrap rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                          {d.value}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Run the other demo CTA */}
            <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    {result.demoId === "demo1"
                      ? "Compare with Demo 2 — Texas"
                      : "Compare with Demo 1 — California"}
                  </h3>
                  <p className="text-sm text-slate-400">
                    Run the other demo to see how jurisdiction changes the analysis of the same types of clauses.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => runDemo(result.demoId === "demo1" ? "demo2" : "demo1")}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 transition disabled:opacity-50"
                  >
                    {result.demoId === "demo1" ? "Run Demo 2 — Texas" : "Run Demo 1 — California"}
                  </button>
                  <Link
                    href={uploadHref}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition"
                  >
                    Analyze Your Own Contract
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </section>
      )}
    </>
  );
}
