"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { US_STATES } from "@/app/lib/jurisdictions";
import type { UsageInfo } from "@/lib/billing";

type ScanMode = "basic" | "deep";

type BasicResult = {
  mode: "basic";
  riskScore: number;
  summary: string;
  topIssues: string[];
  jurisdiction: string | null;
};

type DeepResult = {
  mode: "deep";
  id: string;
  riskScore: number;
  summary: string;
  issues: DeepIssue[];
  deadlines: DeepDeadline[];
  riskLevel: string;
  jurisdiction: string | null;
  remaining: number;
};

type DeepIssue = {
  id?: string;
  label?: string;
  severity?: string;
  message?: string;
  explanation?: string;
  recommendation?: string;
  matches?: string[];
};

type DeepDeadline = {
  label?: string;
  value?: string;
  description?: string;
};

type ScanResult = BasicResult | DeepResult;

const REQUEST_TIMEOUT_MS = 120000;

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function getRiskColor(score: number) {
  if (score >= 80) return { bg: "bg-green-500", text: "text-green-400", label: "LOW RISK" };
  if (score >= 50) return { bg: "bg-amber-500", text: "text-amber-400", label: "MODERATE RISK" };
  return { bg: "bg-red-500", text: "text-red-400", label: "HIGH RISK" };
}

function getSeverityBadge(severity?: string) {
  if (severity === "critical") return "bg-purple-900/60 text-purple-300 border-purple-700";
  if (severity === "high") return "bg-red-900/60 text-red-300 border-red-700";
  if (severity === "medium") return "bg-amber-900/60 text-amber-300 border-amber-700";
  if (severity === "missing") return "bg-slate-800 text-slate-400 border-slate-600";
  return "bg-green-900/60 text-green-300 border-green-700";
}

function getSeverityLabel(severity?: string) {
  if (severity === "critical") return "CRITICAL";
  if (severity === "high") return "HIGH";
  if (severity === "medium") return "MEDIUM";
  if (severity === "missing") return "MISSING";
  return "LOW";
}

export default function ShieldScanner({ usageInfo }: { usageInfo: UsageInfo }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [scanMode, setScanMode] = useState<ScanMode>("basic");
  const [jurisdiction, setJurisdiction] = useState("none");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [expandedIssues, setExpandedIssues] = useState<Set<number>>(new Set());
  const [remainingAnalyses, setRemainingAnalyses] = useState(usageInfo.remaining);

  const canDeepScan =
    !usageInfo.paymentFailed && !usageInfo.needsPlan && remainingAnalyses > 0;

  function toggleIssue(i: number) {
    setExpandedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function extractText(file: File): Promise<string> {
    const lower = file.name.toLowerCase();

    if (lower.endsWith(".txt")) return file.text();

    const formData = new FormData();
    formData.append("file", file);

    if (lower.endsWith(".pdf")) {
      const res = await fetchWithTimeout("/api/extract-pdf", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to read PDF.");
      return String(data.text ?? "");
    }

    if (lower.endsWith(".docx")) {
      const res = await fetchWithTimeout("/api/extract-docx", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to read DOCX.");
      return String(data.text ?? "");
    }

    // Image (JPG, PNG, WebP) — send to Claude Vision
    if (file.type.startsWith("image/")) {
      if (file.size > 4.5 * 1024 * 1024) {
        throw new Error("Image is too large. Please use an image under 4.5 MB.");
      }
      const res = await fetchWithTimeout("/api/extract-image", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to read image.");
      return String(data.text ?? "");
    }

    throw new Error("Unsupported file type. Upload a PDF, DOCX, TXT, or photo.");
  }

  async function runScan(file: File) {
    setError("");
    setResult(null);
    setExpandedIssues(new Set());
    setIsScanning(true);
    setFileName(file.name);

    try {
      const text = await extractText(file);

      if (!text.trim()) throw new Error("Could not extract text from this file.");
      if (text.length < 200) throw new Error("File is too short to analyze. Make sure the full contract is included.");

      const res = await fetchWithTimeout("/api/shield/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          text,
          mode: scanMode,
          jurisdiction: jurisdiction !== "none" ? jurisdiction : undefined,
          fileName: file.name,
        }),
      });

      if (res.status === 401) {
        setError("Session expired. Please log in again.");
        return;
      }

      if (!res.ok) {
        let msg = "Scan failed. Please try again.";
        try {
          const data = await res.json();
          if (data.error) msg = data.error;
        } catch { /* ignore */ }
        setError(msg);
        return;
      }

      const data = await res.json();
      setResult(data as ScanResult);

      if (data.mode === "deep" && typeof data.remaining === "number") {
        setRemainingAnalyses(data.remaining);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Scan failed. Please try again.";
      setError(msg.includes("abort") ? "Request timed out. Please try again." : msg);
    } finally {
      setIsScanning(false);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (file) runScan(file);
  }

  // ── Deep scan gate check before opening camera/file picker ──────────────────
  function openPicker(type: "file" | "camera") {
    if (scanMode === "deep" && !canDeepScan) {
      setError(
        usageInfo.paymentFailed
          ? "Payment failed — update billing to continue."
          : "No analyses remaining. Upgrade your plan or buy more."
      );
      return;
    }
    if (type === "camera") cameraInputRef.current?.click();
    else fileInputRef.current?.click();
  }

  const riskInfo = result ? getRiskColor(result.riskScore) : null;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* ── Disclaimer ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-amber-600/40 bg-amber-950/30 px-4 py-3">
        <p className="text-xs text-amber-300 leading-relaxed">
          <span className="font-semibold">Important:</span> Huginn Shield provides AI-assisted contract analysis
          for informational purposes only. Results do not constitute legal advice and are not a substitute
          for review by a licensed attorney. Never sign a contract based solely on this tool.
        </p>
      </div>

      {/* ── Jurisdiction selector ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Your State (optional)
        </label>
        <select
          value={jurisdiction}
          onChange={(e) => setJurisdiction(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="none">— No state selected —</option>
          {US_STATES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
        {jurisdiction === "FL" && (
          <p className="text-xs text-blue-300 mt-1">
            Florida selected — F.S. §559.9613 consumer finance disclosures will be checked.
          </p>
        )}
      </div>

      {/* ── Scan mode toggle ──────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Scan Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setScanMode("basic")}
            className={`rounded-lg px-3 py-3 text-sm font-semibold border transition ${
              scanMode === "basic"
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <div>Basic Scan</div>
            <div className="text-xs font-normal opacity-75 mt-0.5">Free · Quick summary</div>
          </button>
          <button
            type="button"
            onClick={() => setScanMode("deep")}
            className={`rounded-lg px-3 py-3 text-sm font-semibold border transition ${
              scanMode === "deep"
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <div>Deep Scan</div>
            <div className="text-xs font-normal opacity-75 mt-0.5">
              Uses 1 analysis · Full report
            </div>
          </button>
        </div>
        {scanMode === "deep" && (
          <p className="text-xs text-slate-400 mt-1">
            {canDeepScan
              ? `${remainingAnalyses} analysis${remainingAnalyses === 1 ? "" : "es"} remaining on your plan.`
              : usageInfo.paymentFailed
              ? "Payment failed — update billing to unlock Deep Scan."
              : "No analyses remaining. "}
            {scanMode === "deep" && !canDeepScan && !usageInfo.paymentFailed && (
              <Link href="/select-plan" className="text-blue-400 underline">
                Upgrade your plan.
              </Link>
            )}
          </p>
        )}
      </div>

      {/* ── Upload area ───────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Upload Contract
        </p>

        {/* Camera button — phone-first */}
        <button
          type="button"
          onClick={() => openPicker("camera")}
          disabled={isScanning}
          className="flex items-center justify-center gap-3 w-full rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-4 text-white font-semibold text-base transition"
        >
          <svg className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Take Photo of Contract
        </button>

        <button
          type="button"
          onClick={() => openPicker("file")}
          disabled={isScanning}
          className="flex items-center justify-center gap-3 w-full rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 text-slate-200 font-medium text-sm transition"
        >
          <svg className="h-5 w-5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload PDF, DOCX, or TXT
        </button>

        <p className="text-center text-xs text-slate-500">
          PDF · DOCX · TXT · JPG · PNG · WebP
        </p>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileInput}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* ── Scanning progress ─────────────────────────────────────────────── */}
      {isScanning && (
        <div className="rounded-xl border border-blue-700/50 bg-blue-950/40 p-5 flex flex-col items-center gap-3">
          <svg className="h-8 w-8 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-sm text-blue-300 font-medium">
            {scanMode === "basic" ? "Running basic scan…" : "Running deep analysis…"}
          </p>
          {fileName && <p className="text-xs text-slate-400 truncate max-w-full">{fileName}</p>}
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && !isScanning && (
        <div className="rounded-xl border border-red-700/50 bg-red-950/40 px-4 py-3">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────────────────── */}
      {result && !isScanning && (
        <div className="flex flex-col gap-4">
          {/* Risk score card */}
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Contract Health
                </p>
                <p className={`text-3xl font-bold ${riskInfo!.text}`}>{result.riskScore}/100</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${riskInfo!.text} bg-slate-800 border border-slate-700`}>
                {riskInfo!.label}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-700">
              <div
                className={`h-2 rounded-full transition-all ${riskInfo!.bg}`}
                style={{ width: `${result.riskScore}%` }}
              />
            </div>
            {result.jurisdiction && (
              <p className="text-xs text-slate-500 mt-2">
                {jurisdiction !== "none" && US_STATES.find((s) => s.code === result.jurisdiction)?.name
                  ? `Analyzed under ${US_STATES.find((s) => s.code === result.jurisdiction)!.name} law`
                  : null}
              </p>
            )}
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Summary</p>
            <p className="text-sm text-slate-200 leading-relaxed">{result.summary}</p>
          </div>

          {/* Basic mode — top 3 issues + upgrade CTA */}
          {result.mode === "basic" && (
            <>
              {result.topIssues.length > 0 && (
                <div className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Key Concerns Found
                  </p>
                  <ul className="flex flex-col gap-2">
                    {result.topIssues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-amber-400 mt-0.5 shrink-0">⚠</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Deep scan upsell */}
              <div className="rounded-xl border border-blue-700/50 bg-blue-950/30 px-4 py-4">
                <p className="text-sm font-semibold text-white mb-1">Want the full picture?</p>
                <p className="text-xs text-slate-400 mb-3">
                  Deep Scan analyzes every clause, flags missing protections, and surfaces deadline risks
                  with specific recommendations.
                </p>
                {canDeepScan ? (
                  <button
                    type="button"
                    onClick={() => {
                      setScanMode("deep");
                      setResult(null);
                      setError("");
                    }}
                    className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white transition"
                  >
                    Run Deep Scan ({remainingAnalyses} remaining)
                  </button>
                ) : (
                  <Link
                    href="/select-plan"
                    className="block w-full rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white text-center transition"
                  >
                    Upgrade to Unlock Deep Scan
                  </Link>
                )}
              </div>
            </>
          )}

          {/* Deep mode — full issue list */}
          {result.mode === "deep" && (
            <>
              {result.issues.length > 0 && (
                <div className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-700">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Issues Found ({result.issues.length})
                    </p>
                  </div>
                  <ul className="divide-y divide-slate-800">
                    {result.issues.map((issue, i) => (
                      <li key={i} className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleIssue(i)}
                          className="w-full text-left flex items-start justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span
                                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold border ${getSeverityBadge(issue.severity)}`}
                              >
                                {getSeverityLabel(issue.severity)}
                              </span>
                              <span className="text-sm font-medium text-white leading-tight">
                                {issue.label ?? "Issue"}
                              </span>
                            </div>
                            {!expandedIssues.has(i) && issue.message && (
                              <p className="text-xs text-slate-400 line-clamp-1">{issue.message}</p>
                            )}
                          </div>
                          <svg
                            className={`h-4 w-4 shrink-0 text-slate-500 mt-0.5 transition-transform ${
                              expandedIssues.has(i) ? "rotate-180" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {expandedIssues.has(i) && (
                          <div className="mt-3 flex flex-col gap-2">
                            {issue.explanation && (
                              <p className="text-xs text-slate-300 leading-relaxed">{issue.explanation}</p>
                            )}
                            {issue.recommendation && (
                              <p className="text-xs text-blue-300 leading-relaxed">
                                <span className="font-semibold">Action: </span>
                                {issue.recommendation}
                              </p>
                            )}
                            {issue.matches && issue.matches.length > 0 && (
                              <blockquote className="border-l-2 border-slate-600 pl-3 text-xs text-slate-500 italic leading-relaxed">
                                &ldquo;{issue.matches[0]}&rdquo;
                              </blockquote>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.deadlines.length > 0 && (
                <div className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-700">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Deadlines & Time-Sensitive Terms
                    </p>
                  </div>
                  <ul className="divide-y divide-slate-800">
                    {result.deadlines.map((d, i) => (
                      <li key={i} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-white">{d.label}</p>
                          {d.value && (
                            <span className="shrink-0 rounded bg-amber-900/40 border border-amber-700/50 px-2 py-0.5 text-xs text-amber-300">
                              {d.value}
                            </span>
                          )}
                        </div>
                        {d.description && (
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{d.description}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Link to full saved analysis */}
              {result.id && (
                <Link
                  href={`/analysis/${result.id}`}
                  className="block w-full rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 px-4 py-3 text-center text-sm font-medium text-slate-200 transition"
                >
                  View Full Analysis Report →
                </Link>
              )}
            </>
          )}

          {/* Disclaimer footer */}
          <p className="text-center text-[11px] text-slate-500 px-2">
            This analysis is for informational purposes only and does not constitute legal advice.
            Always consult a licensed attorney before signing.
          </p>
        </div>
      )}
    </div>
  );
}
