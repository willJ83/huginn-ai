"use client";

import { useRef, useState } from "react";

type AnalysisIssue = {
  id?: string;
  label?: string;
  message?: string;
  explanation?: string;
  recommendation?: string;
  severity?: string;
};

type AnalysisDeadline = {
  id?: string;
  label?: string;
  value?: string;
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

const REQUEST_TIMEOUT_MS = 45000;

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

function toUserFacingError(err: unknown) {
  const message = err instanceof Error ? err.message : "";

  if (message.includes("Please upload a PDF, DOCX, or TXT file.")) {
    return "Unsupported file. Please upload a PDF, DOCX, or TXT file.";
  }

  if (message.includes("Usage limit reached")) {
    return "You've reached your free limit. Upgrade to Pro for unlimited access.";
  }

  if (message.includes("Failed to parse") || message.includes("Network") || message.includes("abort")) {
    return "Upload failed. Try again.";
  }

  if (message.includes("Analysis failed")) {
    return "Upload failed. Try again.";
  }

  return "Upload failed. Try again.";
}

function getSeverityClass(severity?: string) {
  if (severity === "high") return "bg-red-50 text-red-600";
  if (severity === "medium") return "bg-yellow-50 text-yellow-600";
  return "bg-green-50 text-green-600";
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
  const [extractionStatus, setExtractionStatus] = useState<"Full" | "Partial" | "">("");
  const [resultTimestamp, setResultTimestamp] = useState("");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [remainingAnalyses, setRemainingAnalyses] = useState(initialRemainingAnalyses);

  const usedAnalyses = freeLimit - remainingAnalyses;
  const canAnalyze = hasUnlimitedAccess || remainingAnalyses > 0;

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
      setError("You've reached your free limit. Upgrade to Pro for unlimited access.");
      return;
    }

    setError("");
    setWarning("");
    setIsAnalyzing(true);

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
        setWarning("Warning:\nWe could not fully extract text from this file.\nResults may be incomplete.");
        setExtractionStatus("Partial");
      } else {
        setExtractionStatus("Full");
      }

      const fileName = file.name;

      const response = await fetchWithTimeout("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          template: "compliance_checker",
          config: {},
          fileName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed.");
      }

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

  return (
    <section className="mt-8 grid gap-5 lg:mt-10 lg:grid-cols-2 lg:gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-slate-900">Upload Document</h2>
        <p className="mt-2 text-sm text-slate-600">
          Drop a PDF, DOCX, or TXT file to run a contract analysis.
        </p>
        <p className="mt-2 text-sm text-slate-600">Secure file processing.</p>
        <p className="mt-1 text-sm text-slate-600">
          Your documents are not stored permanently beyond operational retention needs.
        </p>

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
            You have {remainingAnalyses} {remainingAnalyses === 1 ? "analysis" : "analyses"} remaining this month.
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
          <p className="mt-4 text-sm text-slate-600">Last file: {uploadedFileName}</p>
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

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-slate-900">Result</h2>

        {isAnalyzing ? (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-6">
            <p className="text-base font-semibold text-blue-900">Analyzing contract...</p>
            <p className="mt-1 text-sm text-blue-800">This usually takes a few seconds.</p>
          </div>
        ) : !result ? (
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <p>Upload a contract to begin analysis.</p>
            <p>
              Supported files:<br />
              PDF, DOCX, TXT
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {warning ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 whitespace-pre-line text-sm text-amber-800">
                {warning}
              </p>
            ) : null}

            {processedFileType && extractionStatus ? (
              <p className="text-sm text-slate-600">
                File processed: {processedFileType}<br />
                Text extraction: {extractionStatus}
              </p>
            ) : null}

            {resultTimestamp ? (
              <p className="text-sm text-slate-600">Analyzed at: {resultTimestamp}</p>
            ) : null}

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Risk Score
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
                {result.riskScore ?? 0}
                <span className="text-lg font-medium text-slate-500"> / 100</span>
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Summary</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {result.summary || "No summary available."}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Issues</h3>
              <div className="mt-2 space-y-2">
                {(result.issues ?? []).length === 0 ? (
                  <p className="text-sm text-slate-600">No issues found.</p>
                ) : (
                  (result.issues ?? []).map((issue, index) => (
                    <div key={`${issue.id || issue.label || "issue"}-${index}`} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 break-words font-medium text-slate-900">{issue.label || "Issue"}</p>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getSeverityClass(issue.severity)}`}>
                          {(issue.severity || "low").toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-2 break-words text-sm text-slate-700">{issue.message || "No details provided."}</p>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">What this means</p>
                      <p className="mt-1 break-words text-sm text-slate-600">
                        {issue.explanation || issue.message || "No explanation provided."}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Deadlines</h3>
              <div className="mt-2 space-y-2">
                {(result.deadlines ?? []).length === 0 ? (
                  <p className="text-sm text-slate-600">No deadlines found.</p>
                ) : (
                  (result.deadlines ?? []).map((deadline, index) => (
                    <div
                      key={`${deadline.id || deadline.label || "deadline"}-${index}`}
                      className="flex flex-col gap-1 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <p className="break-words font-medium text-slate-900">{deadline.label || "Deadline"}</p>
                      <p className="break-words text-sm text-slate-600">{deadline.value || "N/A"}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
