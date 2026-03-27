"use client";

import { useRef, useState } from "react";
import DownloadPdfButton from "@/app/components/DownloadPdfButton";

type AnalysisIssue = {
  id?: string;
  label?: string;
  message?: string;
  explanation?: string;
  recommendation?: string;
  severity?: string;
  matches?: string[];
};

type AnalysisDeadline = {
  id?: string;
  label?: string;
  value?: string;
  description?: string;
};

type AnalysisResponse = {
  riskScore?: number;
  summary?: string;
  issues?: AnalysisIssue[];
  deadlines?: AnalysisDeadline[];
};

type DashboardAnalyzerProps = {
  hasUnlimitedAccess: boolean;
  initialRemainingAnalyses: number;
  freeLimit: number;
};

const REQUEST_TIMEOUT_MS = 120000;

const SAMPLE_CONTRACT_TEXT = `SERVICE AGREEMENT

This Service Agreement is entered into between Alpha Solutions LLC ("Provider") and BrightPath Marketing ("Client").

1. Services
Provider agrees to deliver digital marketing services including SEO, content creation, and ad management.

2. Payment Terms
Client agrees to pay $5,000 per month. Payment is due within a reasonable time after invoicing.

3. Term
This agreement begins on January 1, 2026 and continues for 12 months unless terminated earlier.

4. Termination
Either party may terminate this agreement at any time with written notice.

5. Liability
Provider is not liable for any damages arising from the use of services.

6. Confidentiality
Both parties agree to keep sensitive information confidential.

[INTENTIONALLY OMITTED]

7. Governing Law

8. Dispute Resolution
Any disputes will be handled in a mutually agreed manner.
`;

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function createSampleFile() {
  return new File([SAMPLE_CONTRACT_TEXT], "sample-contract.txt", {
    type: "text/plain",
  });
}

function toUserFacingError(err: unknown) {
  const message = err instanceof Error ? err.message : "";

  if (message.includes("Please upload a PDF, DOCX, or TXT file.")) {
    return "Unsupported file. Please upload a PDF, DOCX, or TXT file.";
  }

  if (message.includes("Usage limit reached")) {
    return "You've reached your free limit. Upgrade to Pro for unlimited access.";
  }

  if (
    message.includes("Failed to parse") ||
    message.includes("Network") ||
    message.includes("abort")
  ) {
    return "Upload failed. Try again.";
  }

  if (message.includes("Analysis failed")) {
    return "Upload failed. Try again.";
  }

  return "Upload failed. Try again.";
}

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

function getSeverityBadge(severity?: string) {
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

export default function DashboardAnalyzer({
  hasUnlimitedAccess,
  initialRemainingAnalyses,
  freeLimit,
}: DashboardAnalyzerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [processedFileType, setProcessedFileType] = useState("");
  const [extractionStatus, setExtractionStatus] = useState<
    "Full" | "Partial" | ""
  >("");
  const [resultTimestamp, setResultTimestamp] = useState("");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [remainingAnalyses, setRemainingAnalyses] = useState(
    initialRemainingAnalyses
  );
  const [expandedIssues, setExpandedIssues] = useState<Set<number>>(new Set());

  const usedAnalyses = freeLimit - remainingAnalyses;
  const canAnalyze = hasUnlimitedAccess || remainingAnalyses > 0;

  function toggleIssue(index: number) {
    setExpandedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  async function extractTextFromFile(file: File) {
    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith(".txt")) {
      return file.text();
    }

    const formData = new FormData();
    formData.append("file", file);

    if (lowerName.endsWith(".pdf")) {
      const response = await fetchWithTimeout("/api/extract-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to parse PDF.");
      }

      return String(data.text || "");
    }

    if (lowerName.endsWith(".docx")) {
      const response = await fetchWithTimeout("/api/extract-docx", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to parse DOCX.");
      }

      return String(data.text || "");
    }

    throw new Error("Please upload a PDF, DOCX, or TXT file.");
  }

  async function runAnalysis(file: File) {
    if (!canAnalyze) {
      setError(
        "You've reached your free limit. Upgrade to Pro for unlimited access."
      );
      return;
    }

    setError("");
    setWarning("");
    setIsAnalyzing(true);
    setExpandedIssues(new Set());

    try {
      const text = await extractTextFromFile(file);
      const lowerName = file.name.toLowerCase();

      if (lowerName.endsWith(".pdf")) {
        setProcessedFileType("PDF");
      } else if (lowerName.endsWith(".docx")) {
        setProcessedFileType("DOCX");
      } else {
        setProcessedFileType("TXT");
      }

      if (!text.trim()) {
        throw new Error("Failed to parse uploaded file.");
      }

      if (text.length < 500) {
        setWarning(
          "Warning:\nWe could not fully extract text from this file.\nResults may be incomplete."
        );
        setExtractionStatus("Partial");
      } else {
        setExtractionStatus("Full");
      }

      const fileName = file.name;

      const response = await fetchWithTimeout("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          text,
          template: "compliance_checker",
          config: {},
          fileName,
        }),
      });

      if (response.status === 401) {
        setError("Please log in to analyze a contract.");
        return;
      }

      if (!response.ok) {
        let message = "Analysis failed. Please try again.";

        try {
          const text = await response.text();
          if (text) {
            message = text;
          }
        } catch {}

        setError(message);
        return;
      }

      const data = await response.json();

      setUploadedFileName(file.name);
      setResult({
        riskScore: data.riskScore,
        summary: data.summary,
        issues: Array.isArray(data.issues) ? data.issues : [],
        deadlines: Array.isArray(data.deadlines) ? data.deadlines : [],
      });
      setResultTimestamp(new Date().toLocaleString());

      if (!hasUnlimitedAccess) {
        setRemainingAnalyses((previous) => Math.max(0, previous - 1));
      }
    } catch (err) {
      setError(toUserFacingError(err));
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    await runAnalysis(file);
  }

  async function loadDemoContract() {
    setError("");
    setWarning("");
    await runAnalysis(createSampleFile());
  }

  const issues = result?.issues ?? [];
  const deadlines = result?.deadlines ?? [];
  const riskInfo = result ? getRiskInfo(result.riskScore ?? 0) : null;
  const highCount = issues.filter((i) => i.severity === "high").length;
  const mediumCount = issues.filter((i) => i.severity === "medium").length;
  const topIssue = issues.find((i) => i.severity === "high") || issues[0];
  const summaryIntro =
    result && issues.length === 0
      ? "We reviewed this contract and found no significant issues. It looks clean — review the full details before signing."
      : result
      ? `We found ${issues.length} ${issues.length === 1 ? "issue" : "issues"} in this contract.${
          topIssue?.label ? ` ${topIssue.label} is your biggest concern.` : ""
        } Here's what you need to know before signing.`
      : "";

  return (
    <section className="mt-8 grid gap-5 lg:mt-10 lg:grid-cols-2 lg:gap-6">
      {/* Upload panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-slate-900">
          Upload Document
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Drop a PDF, DOCX, or TXT file to run a contract analysis.
        </p>
        <p className="mt-2 text-sm text-slate-600">Secure file processing.</p>
        <p className="mt-1 text-sm text-slate-600">
          Your documents are not stored permanently beyond operational retention
          needs.
        </p>

        <p className="mb-3 mt-4 text-sm text-slate-600">
          Try a sample contract with built-in issues
        </p>
        <button
          type="button"
          onClick={loadDemoContract}
          className="mb-4 inline-flex items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          disabled={isAnalyzing || !canAnalyze}
        >
          Try Sample Contract
        </button>

        {!hasUnlimitedAccess ? (
          <p className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            Free plan includes 3 analyses per month.
          </p>
        ) : null}

        {!hasUnlimitedAccess ? (
          <p className="mt-3 text-sm text-slate-700">
            {usedAnalyses} / {freeLimit} free analyses used this month
          </p>
        ) : null}

        {!hasUnlimitedAccess ? (
          <p className="mt-1 text-sm text-slate-700">
            You have {remainingAnalyses}{" "}
            {remainingAnalyses === 1 ? "analysis" : "analyses"} remaining this
            month.
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={async (event) => {
            event.preventDefault();
            setIsDragActive(false);
            const file = event.dataTransfer.files?.[0] ?? null;
            await handleFile(file);
          }}
          className={`mt-5 w-full rounded-xl border-2 border-dashed px-4 py-8 text-center transition sm:px-6 sm:py-10 ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50"
          }`}
          disabled={isAnalyzing || !canAnalyze}
        >
          <p className="text-base font-semibold text-slate-900">
            {isAnalyzing
              ? "Analyzing contract..."
              : !canAnalyze
              ? "Upload disabled: monthly limit reached"
              : "Analyze Contract"}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {isAnalyzing
              ? "Please wait while we process your file."
              : !canAnalyze
              ? "Upgrade to Pro to continue analyzing this month."
              : "Drag & drop your document here, or tap to upload"}
          </p>
        </button>

        <label htmlFor="dashboardFileUpload" className="sr-only">
          Upload contract document
        </label>

        <input
          id="dashboardFileUpload"
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          title="Upload contract document"
          onChange={async (event) => {
            const input = event.currentTarget;
            const file = input.files?.[0] ?? null;

            if (!file) return;

            try {
              await handleFile(file);
            } finally {
              input.value = "";
            }
          }}
        />

        {uploadedFileName ? (
          <p className="mt-4 text-sm text-slate-600">
            Last file: {uploadedFileName}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        {!hasUnlimitedAccess && !canAnalyze ? (
          <a
            href="/pricing"
            className="mt-4 inline-flex items-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            Upgrade to Pro
          </a>
        ) : null}
      </div>

      {/* Results panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-slate-900">Result</h2>

        {isAnalyzing ? (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-6">
            <p className="text-base font-semibold text-blue-900">
              Analyzing contract...
            </p>
            <p className="mt-1 text-sm text-blue-800">
              This usually takes a few seconds.
            </p>
          </div>
        ) : !result ? (
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <p>Upload a contract to begin analysis.</p>
            <p>
              Supported files:
              <br />
              PDF, DOCX, TXT
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {warning ? (
              <p className="whitespace-pre-line rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {warning}
              </p>
            ) : null}

            {processedFileType && extractionStatus ? (
              <p className="text-sm text-slate-500">
                File: {processedFileType} &middot; Extraction: {extractionStatus}
                {resultTimestamp ? ` · ${resultTimestamp}` : ""}
              </p>
            ) : null}

            {/* Health score card */}
            {riskInfo && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contract Health Score
                </p>

                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <span className="text-4xl font-bold text-slate-900">
                    {result.riskScore ?? 0}
                  </span>
                  <span className="mb-0.5 text-base font-medium text-slate-400">
                    / 100
                  </span>
                  <span
                    className={`mb-0.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${riskInfo.badgeClass}`}
                  >
                    {riskInfo.label}
                  </span>
                </div>

                <div className="mt-3 h-2.5 w-full rounded-full bg-slate-200">
                  <div
                    className={`h-2.5 rounded-full ${riskInfo.barClass}`}
                    style={{ width: `${result.riskScore ?? 0}%` }}
                  />
                </div>

                <p className="mt-2 text-sm text-slate-600">
                  {riskInfo.interpretation}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                    {highCount} High Risk
                  </span>
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                    {mediumCount} Moderate
                  </span>
                  <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    {deadlines.length}{" "}
                    {deadlines.length === 1 ? "Deadline" : "Deadlines"}
                  </span>
                </div>
              </div>
            )}

            {/* Summary */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Before You Sign
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {summaryIntro}
              </p>
              {result.summary && (
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                  {result.summary}
                </p>
              )}
            </div>

            {/* Issues */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {issues.length === 0
                  ? "Issues Found"
                  : `${issues.length} ${issues.length === 1 ? "Issue" : "Issues"} Found`}
              </h3>
              <div className="mt-2 space-y-2">
                {issues.length === 0 ? (
                  <p className="text-sm text-slate-600">
                    No issues found in this contract.
                  </p>
                ) : (
                  issues.map((issue, index) => (
                    <div
                      key={`${issue.id || issue.label || "issue"}-${index}`}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-wrap items-start gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${getSeverityBadge(
                            issue.severity
                          )}`}
                        >
                          {getSeverityLabel(issue.severity)}
                        </span>
                        <p className="min-w-0 flex-1 break-words font-medium text-slate-900">
                          {issue.label || "Issue"}
                        </p>
                      </div>

                      <div className="mt-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          What this means for your business
                        </p>
                        <p className="mt-1 break-words text-sm leading-relaxed text-slate-700">
                          {issue.explanation || issue.message || "No details provided."}
                        </p>
                      </div>

                      {issue.recommendation && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            What to do
                          </p>
                          <p className="mt-1 break-words text-sm leading-relaxed text-slate-700">
                            {issue.recommendation}
                          </p>
                        </div>
                      )}

                      {Array.isArray(issue.matches) &&
                        issue.matches.length > 0 && (
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => toggleIssue(index)}
                              className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                            >
                              {expandedIssues.has(index) ? "▼" : "▶"} See the
                              clause that triggered this flag
                            </button>
                            {expandedIssues.has(index) && (
                              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                                {issue.matches.map((match, mi) => (
                                  <p
                                    key={mi}
                                    className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-600"
                                  >
                                    {match}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Deadlines */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Time-Sensitive Clauses
              </h3>
              <div className="mt-2">
                {deadlines.length === 0 ? (
                  <p className="rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-800">
                    No auto-renewals or hard deadlines detected — nothing here
                    requires immediate action on your calendar.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {deadlines.map((deadline, index) => (
                      <div
                        key={`${deadline.id || deadline.label || "deadline"}-${index}`}
                        className="flex flex-col gap-1 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="break-words font-medium text-slate-900">
                            {deadline.label || "Deadline"}
                          </p>
                          {deadline.description && (
                            <p className="mt-0.5 text-xs text-slate-500">
                              {deadline.description}
                            </p>
                          )}
                        </div>
                        <span className="whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                          {deadline.value || "See contract"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Download PDF */}
            <div className="border-t border-slate-100 pt-4">
              <DownloadPdfButton
                data={{
                  fileName: uploadedFileName || null,
                  analysisDate: resultTimestamp,
                  riskScore: result.riskScore ?? 0,
                  summary: result.summary,
                  issues: result.issues ?? [],
                  deadlines: result.deadlines ?? [],
                }}
                className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
