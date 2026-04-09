"use client";

// ── COMPONENT VERSION ────────────────────────────────────────────────────────
// Bump this string on every deploy so you can verify the PWA loaded fresh code:
// open DevTools → Elements → find data-shield-version on the root div.
const SHIELD_VERSION = "2.2.0";

import { useEffect, useRef, useState } from "react";
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

// ── Deep scan progress ─────────────────────────────────────────────────────
// Populated while a deep scan is streaming. Cleared when results arrive.
type DeepScanProgress = {
  stage: number;   // 1 | 2 | 3
  total: number;   // always 3
  message: string; // human-readable label shown in the UI
};

// Max characters sent to the AI (~50 pages of dense legal text).
// Contracts exceeding this are truncated with a user-visible warning.
const MAX_TEXT_CHARS = 150_000;

// REQUEST_TIMEOUT_MS is only used for the basic scan (single fetch + JSON).
// Deep scans use a streaming SSE connection with no hard client-side timeout.
const REQUEST_TIMEOUT_MS = 60_000;

// Image file extensions — used as a fallback when the browser reports an empty
// or unexpected MIME type (common with camera captures on Android & some iOS).
const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|heic|heif|bmp|tiff?)$/i;

// Stage labels shown in the progress indicator dots.
const STAGE_LABELS = ["Classify", "Extract", "Score"] as const;

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
  // ── PWA cache-busting ──────────────────────────────────────────────────────
  // On every Shield page visit, tell the browser to re-check sw.js for updates.
  // If a new SW is found (new cache version string), it installs immediately via
  // skipWaiting() and the controllerchange event reloads the page with fresh JS.
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.update());
      });

      const onControllerChange = () => window.location.reload();
      navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
      return () => {
        navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      };
    }
  }, []);

  // ── Input refs ─────────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  // ── Ref to cancel an in-progress deep scan stream ─────────────────────────
  // Stored in a ref so resetAll() can cancel without a stale closure.
  const scanReaderRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  // ── Ref to auto-scroll to results when they appear ────────────────────────
  const resultsRef = useRef<HTMLDivElement>(null);

  const [scanMode, setScanMode] = useState<ScanMode>("basic");
  const [jurisdiction, setJurisdiction] = useState("none");

  // ── Multi-page accumulation state ─────────────────────────────────────────
  const [pendingPages, setPendingPages] = useState<string[]>([]);
  const [pendingFileNames, setPendingFileNames] = useState<string[]>([]);
  const [awaitingMore, setAwaitingMore] = useState(false);

  // ── Scan lifecycle ────────────────────────────────────────────────────────
  const [extracting, setExtracting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [deepScanProgress, setDeepScanProgress] = useState<DeepScanProgress | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [expandedIssues, setExpandedIssues] = useState<Set<number>>(new Set());
  const [remainingAnalyses, setRemainingAnalyses] = useState(usageInfo.remaining);

  const canDeepScan =
    !usageInfo.paymentFailed && !usageInfo.needsPlan && remainingAnalyses > 0;
  const busy = extracting || isScanning;

  // ── Auto-scroll to results when they appear ───────────────────────────────
  useEffect(() => {
    if (result && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [result]);

  function toggleIssue(i: number) {
    setExpandedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function resetAll() {
    // Cancel any in-progress deep scan stream so we don't update state after reset.
    if (scanReaderRef.current) {
      scanReaderRef.current.cancel();
      scanReaderRef.current = null;
    }
    setDeepScanProgress(null);
    setResult(null);
    setError("");
    setTruncated(false);
    setPendingPages([]);
    setPendingFileNames([]);
    setAwaitingMore(false);
    setExpandedIssues(new Set());
    setFileName("");
    setIsScanning(false);
    setExtracting(false);
  }

  // ── Text extraction ────────────────────────────────────────────────────────
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

    // ── Image detection ──────────────────────────────────────────────────────
    // Some camera implementations (Android, older iOS) return file.type="" or
    // "application/octet-stream" even for JPEG captures. Always fall back to
    // extension check so camera photos are never mis-routed to the error path.
    const isImage =
      file.type.startsWith("image/") ||
      IMAGE_EXTENSIONS.test(lower) ||
      file.type === "" || // camera captures on some Android browsers
      file.type === "application/octet-stream"; // fallback MIME from certain cameras

    if (isImage) {
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

  // ── Basic scan: plain JSON response ───────────────────────────────────────
  async function runBasicScanRequest(text: string, name: string): Promise<boolean> {
    const res = await fetchWithTimeout("/api/shield/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        text,
        mode: "basic",
        jurisdiction: jurisdiction !== "none" ? jurisdiction : undefined,
        fileName: name,
      }),
    });

    if (res.status === 401) {
      setError("Session expired. Please log in again.");
      setIsScanning(false);
      return false;
    }

    if (!res.ok) {
      let msg = "Scan failed. Please try again.";
      try {
        const data = await res.json();
        if (data.error) msg = data.error;
      } catch { /* ignore */ }
      setError(msg);
      setIsScanning(false);
      return false;
    }

    const data = await res.json();
    setResult(data as ScanResult);
    setPendingPages([]);
    setPendingFileNames([]);
    setIsScanning(false);
    return true;
  }

  // ── Deep scan: SSE streaming response ─────────────────────────────────────
  // The API emits progress events between each of the 3 Claude stages, then
  // emits the final result. We read the stream live so:
  //   1. The UI shows real stage-by-stage progress (no blind spinning).
  //   2. Results appear automatically — no manual refresh needed.
  //   3. There is no hard client timeout that could abort a large scan.
  async function runDeepScanStream(text: string, name: string): Promise<boolean> {
    setDeepScanProgress({ stage: 0, total: 3, message: "Connecting…" });

    let response: Response;
    try {
      // No AbortController timeout here — the stream has its own lifecycle.
      response = await fetch("/api/shield/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          text,
          mode: "deep",
          jurisdiction: jurisdiction !== "none" ? jurisdiction : undefined,
          fileName: name,
        }),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg.includes("abort") || msg.includes("cancel")
          ? "Scan was cancelled."
          : "Connection failed. Please check your internet and try again."
      );
      setIsScanning(false);
      setDeepScanProgress(null);
      return false;
    }

    if (response.status === 401) {
      setError("Session expired. Please log in again.");
      setIsScanning(false);
      setDeepScanProgress(null);
      return false;
    }

    if (!response.ok) {
      let msg = "Scan failed. Please try again.";
      try {
        const data = await response.json();
        if (data.error) msg = data.error;
      } catch { /* ignore */ }
      setError(msg);
      setIsScanning(false);
      setDeepScanProgress(null);
      return false;
    }

    if (!response.body) {
      setError("Streaming not supported in this browser. Please try again.");
      setIsScanning(false);
      setDeepScanProgress(null);
      return false;
    }

    const reader = response.body.getReader();
    scanReaderRef.current = reader;
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE events are delimited by double newlines (\n\n).
        const parts = buffer.split("\n\n");
        // Keep any incomplete trailing chunk in the buffer.
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const dataLine = part.split("\n").find((l) => l.startsWith("data: "));
          if (!dataLine) continue;

          let event: { type: string; [key: string]: unknown };
          try {
            event = JSON.parse(dataLine.slice(6));
          } catch {
            continue; // malformed line — skip
          }

          if (event.type === "progress") {
            setDeepScanProgress({
              stage: event.stage as number,
              total: event.total as number,
              message: event.message as string,
            });
          } else if (event.type === "result") {
            const payload = event.payload as ScanResult;
            setResult(payload);
            setPendingPages([]);
            setPendingFileNames([]);
            if (typeof (payload as DeepResult).remaining === "number") {
              setRemainingAnalyses((payload as DeepResult).remaining);
            }
            setDeepScanProgress(null);
            setIsScanning(false);
            scanReaderRef.current = null;
            return true;
          } else if (event.type === "error") {
            setError((event.message as string) ?? "Scan failed. Please try again.");
            setDeepScanProgress(null);
            setIsScanning(false);
            scanReaderRef.current = null;
            return false;
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      // Ignore cancellation errors triggered by resetAll().
      if (!msg.includes("cancel") && !msg.includes("abort")) {
        setError("Stream interrupted. Please try again.");
      }
      setDeepScanProgress(null);
      setIsScanning(false);
      scanReaderRef.current = null;
      return false;
    }

    // Stream ended without a result event (unexpected).
    setError("Scan completed without a result. Please try again.");
    setDeepScanProgress(null);
    setIsScanning(false);
    scanReaderRef.current = null;
    return false;
  }

  // ── Dispatch to the right scan function based on mode ─────────────────────
  async function runScanWithText(text: string, name: string): Promise<boolean> {
    if (scanMode === "deep") {
      return runDeepScanStream(text, name);
    }
    return runBasicScanRequest(text, name);
  }

  // ── Multi-page image handler ───────────────────────────────────────────────
  async function handleImageAdded(file: File) {
    if (busy) return;
    setError("");
    setResult(null);
    setExpandedIssues(new Set());
    setTruncated(false);
    setExtracting(true);

    try {
      const text = await extractText(file);
      if (!text.trim()) throw new Error("Could not read this photo. Try a clearer, well-lit image.");

      const isGenericName =
        !file.name ||
        file.name === "blob" ||
        /^(image|photo|img|capture|scan|camera)\d*\.(jpe?g|png|heic|webp)$/i.test(file.name);

      const displayName = isGenericName
        ? `Photo ${pendingPages.length + 1}`
        : file.name;

      setPendingPages((prev) => [...prev, text]);
      setPendingFileNames((prev) => [...prev, displayName]);
      setAwaitingMore(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file. Please try again.");
    } finally {
      setExtracting(false);
    }
  }

  // ── Direct document upload (PDF / DOCX / TXT) ─────────────────────────────
  async function handleDocumentUpload(file: File) {
    if (busy) return;
    setError("");
    setResult(null);
    setExpandedIssues(new Set());
    setTruncated(false);
    setPendingPages([]);
    setPendingFileNames([]);
    setAwaitingMore(false);
    setIsScanning(true);
    setFileName(file.name);

    try {
      const text = await extractText(file);

      if (!text.trim()) throw new Error("Could not extract text from this file.");
      if (text.length < 200)
        throw new Error("File is too short to analyze. Make sure the full contract is included.");

      let finalText = text;
      if (text.length > MAX_TEXT_CHARS) {
        let trimPoint = MAX_TEXT_CHARS;
        const lastBreak = text.lastIndexOf("\n\n", MAX_TEXT_CHARS);
        if (lastBreak > MAX_TEXT_CHARS * 0.85) trimPoint = lastBreak;
        finalText = text.slice(0, trimPoint);
        setTruncated(true);
      }

      await runScanWithText(finalText, file.name);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Scan failed. Please try again.";
      setError(
        msg.includes("abort")
          ? "Request timed out. This contract may be too large — try splitting it into sections."
          : msg
      );
      setIsScanning(false);
    }
  }

  // ── Scan all accumulated pages ─────────────────────────────────────────────
  async function scanAllPages() {
    if (pendingPages.length === 0) return;
    setAwaitingMore(false);
    setError("");
    setExpandedIssues(new Set());
    setTruncated(false);
    setIsScanning(true);

    const combinedName =
      pendingFileNames.length === 1
        ? pendingFileNames[0]
        : `${pendingFileNames.length} pages`;
    setFileName(combinedName);

    let combinedText = pendingPages.join("\n\n--- Page Break ---\n\n");

    if (combinedText.length > MAX_TEXT_CHARS) {
      let trimPoint = MAX_TEXT_CHARS;
      const lastBreak = combinedText.lastIndexOf("\n\n", MAX_TEXT_CHARS);
      if (lastBreak > MAX_TEXT_CHARS * 0.85) trimPoint = lastBreak;
      combinedText = combinedText.slice(0, trimPoint);
      setTruncated(true);
    }

    if (combinedText.length < 200) {
      setError("Not enough text found. Make sure the contract is fully visible in the photos.");
      setIsScanning(false);
      setAwaitingMore(true);
      return;
    }

    const success = await runScanWithText(combinedText, combinedName);
    if (!success && pendingPages.length > 0) {
      setAwaitingMore(true);
    }
  }

  // ── Deep scan gate ─────────────────────────────────────────────────────────
  function guardedOpen(action: () => void) {
    if (scanMode === "deep" && !canDeepScan) {
      setError(
        usageInfo.paymentFailed
          ? "Payment failed — update billing to continue."
          : "No analyses remaining. Upgrade your plan or buy more."
      );
      return;
    }
    action();
  }

  // ── onChange handlers ──────────────────────────────────────────────────────
  function handleCameraChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (file) handleImageAdded(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;

    const lower = file.name.toLowerCase();
    const isImage =
      file.type.startsWith("image/") ||
      IMAGE_EXTENSIONS.test(lower) ||
      file.type === "" ||
      file.type === "application/octet-stream";

    if (isImage) {
      handleImageAdded(file);
    } else {
      handleDocumentUpload(file);
    }
  }

  const riskInfo = result ? getRiskColor(result.riskScore) : null;

  // Progress bar percentage: stage 0 = 5% (just connected), stage N = N/total * 100
  const progressPct = deepScanProgress
    ? deepScanProgress.stage === 0
      ? 5
      : Math.round((deepScanProgress.stage / deepScanProgress.total) * 100)
    : 0;

  return (
    <div className="w-full flex flex-col gap-4" data-shield-version={SHIELD_VERSION}>

      {/* ── Disclaimer ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-amber-600/40 bg-amber-950/30 px-4 py-3">
        <p className="text-xs text-amber-300 leading-relaxed">
          <span className="font-semibold">Important:</span> Huginn Shield provides AI-assisted contract
          analysis for informational purposes only. Results do not constitute legal advice and are not a
          substitute for review by a licensed attorney. Never sign a contract based solely on this tool.
        </p>
      </div>

      {/* ── Jurisdiction selector ─────────────────────────────────────────── */}
      {/*
        NOTE: text-base (16px) is intentional — iOS Safari will not open the native picker
        for a <select> with font-size below 16px; it zoom-focuses the element instead.
      */}
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 flex flex-col gap-2">
        <label
          htmlFor="jurisdiction-select"
          className="text-xs font-semibold text-slate-400 uppercase tracking-wider"
        >
          Your State (optional)
        </label>
        <select
          id="jurisdiction-select"
          value={jurisdiction}
          onChange={(e) => setJurisdiction(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Scan Type
        </span>
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
            <div className="text-xs font-normal opacity-75 mt-0.5">Uses 1 analysis · Full report</div>
          </button>
        </div>
        {scanMode === "deep" && (
          <p className="text-xs text-slate-400 mt-1">
            {canDeepScan
              ? `${remainingAnalyses} analysis${remainingAnalyses === 1 ? "" : "es"} remaining on your plan.`
              : usageInfo.paymentFailed
              ? "Payment failed — update billing to unlock Deep Scan."
              : (
                <>
                  No analyses remaining.{" "}
                  <Link href="/select-plan" className="text-blue-400 underline">
                    Upgrade your plan.
                  </Link>
                </>
              )}
          </p>
        )}
      </div>

      {/* ── "Reading page…" spinner ───────────────────────────────────────── */}
      {extracting && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 flex items-center gap-3">
          <svg className="h-5 w-5 text-blue-400 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-sm text-slate-300">Reading page…</p>
        </div>
      )}

      {/* ── "Add another page?" prompt ────────────────────────────────────── */}
      {awaitingMore && !extracting && !isScanning && (
        <div className="rounded-xl border border-blue-600/40 bg-blue-950/30 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-base" aria-hidden="true">✓</span>
            <p className="text-sm font-semibold text-white">
              Page {pendingPages.length} added
            </p>
          </div>
          <p className="text-xs text-slate-400">
            {pendingPages.length === 1
              ? "Is this a multi-page contract? Add more pages before scanning."
              : `${pendingPages.length} pages queued. Add more or scan now.`}
          </p>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() =>
                guardedOpen(() => {
                  setAwaitingMore(false);
                  cameraInputRef.current?.click();
                })
              }
              className="flex items-center justify-center gap-2 w-full rounded-lg border border-slate-600 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 px-4 py-3 text-sm font-medium text-slate-200 transition"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Yes — Take another photo
            </button>

            <button
              type="button"
              onClick={() =>
                guardedOpen(() => {
                  setAwaitingMore(false);
                  addMoreInputRef.current?.click();
                })
              }
              className="flex items-center justify-center gap-2 w-full rounded-lg border border-slate-600 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 px-4 py-3 text-sm font-medium text-slate-200 transition"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Yes — Upload another image
            </button>

            <button
              type="button"
              onClick={scanAllPages}
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-green-600 hover:bg-green-700 active:bg-green-800 px-4 py-3 text-sm font-semibold text-white transition"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              No — Scan all {pendingPages.length} page{pendingPages.length === 1 ? "" : "s"} now
            </button>
          </div>

          {pendingFileNames.length > 0 && (
            <p className="text-[11px] text-slate-500 truncate">
              Queued: {pendingFileNames.join(" · ")}
            </p>
          )}
        </div>
      )}

      {/* ── Upload area — shown only in idle state ────────────────────────── */}
      {!awaitingMore && !isScanning && !extracting && !result && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Upload Contract
          </p>

          <button
            type="button"
            aria-label="Take photo of contract"
            onClick={() => guardedOpen(() => cameraInputRef.current?.click())}
            disabled={busy}
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
            aria-label="Upload contract file (PDF, DOCX, TXT, or image)"
            onClick={() => guardedOpen(() => fileInputRef.current?.click())}
            disabled={busy}
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
        </div>
      )}

      {/*
        Hidden file inputs.
        `capture="environment"` is a valid W3C Media Capture attribute
        (https://www.w3.org/TR/html-media-capture/) typed as string in React's InputHTMLAttributes.
      */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="Take photo of contract"
        onChange={handleCameraChange}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,image/*"
        aria-label="Upload contract file"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={addMoreInputRef}
        type="file"
        accept="image/*"
        aria-label="Upload additional contract page"
        onChange={handleCameraChange}
        className="hidden"
      />

      {/* ── Scanning progress ─────────────────────────────────────────────── */}
      {/*
        CHANGED: Replaced the dumb "spinning radar" with a real 3-stage progress
        indicator for deep scans. Each stage emits an SSE event from the API, which
        updates deepScanProgress state here. Basic scan keeps the simple spinner.
      */}
      {isScanning && (
        <div className="rounded-xl border border-blue-700/50 bg-blue-950/40 p-5 flex flex-col items-center gap-4">
          {/* Spinner */}
          <svg className="h-8 w-8 text-blue-400 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>

          {/* Stage message */}
          <p className="text-sm text-blue-300 font-semibold text-center">
            {deepScanProgress?.message ??
              (scanMode === "basic" ? "Running basic scan…" : "Starting deep analysis…")}
          </p>

          {/* Deep scan: animated progress bar + stage dots */}
          {deepScanProgress && scanMode === "deep" && (
            <div className="w-full flex flex-col gap-3">
              {/* Progress bar */}
              <div className="w-full">
                <div className="flex justify-between text-[11px] text-slate-500 mb-1.5">
                  <span>
                    {deepScanProgress.stage > 0
                      ? `Stage ${deepScanProgress.stage} of ${deepScanProgress.total}`
                      : "Connecting…"}
                  </span>
                  <span>{progressPct}%</span>
                </div>
                {/* Dynamic width — Tailwind cannot generate arbitrary runtime percentages */}
                <div className="w-full h-1.5 rounded-full bg-slate-700">
                  <div
                    className="h-1.5 rounded-full bg-blue-500 transition-all duration-700 ease-out"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Stage indicator dots */}
              <div className="flex justify-center gap-6">
                {STAGE_LABELS.map((label, idx) => {
                  const stageNum = idx + 1;
                  const done = stageNum < deepScanProgress.stage;
                  const active = stageNum === deepScanProgress.stage;
                  return (
                    <div key={label} className="flex flex-col items-center gap-1">
                      <div
                        className={`h-2.5 w-2.5 rounded-full transition-all duration-500 ${
                          done
                            ? "bg-green-400"
                            : active
                            ? "bg-blue-400 ring-2 ring-blue-400/40"
                            : "bg-slate-600"
                        }`}
                      />
                      <span
                        className={`text-[10px] transition-colors ${
                          done ? "text-green-400" : active ? "text-blue-300" : "text-slate-600"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* File name */}
          {fileName && (
            <p className="text-xs text-slate-400 truncate max-w-full">{fileName}</p>
          )}

          {/* Time estimate */}
          <p className="text-xs text-slate-500 text-center">
            {scanMode === "deep"
              ? "Deep scan runs 3 AI stages — typically 1–3 minutes for most contracts."
              : "This usually takes under 30 seconds."}
          </p>

          {/* Cancel button — only shown for deep scan (basic is fast enough) */}
          {scanMode === "deep" && (
            <button
              type="button"
              onClick={resetAll}
              className="text-xs text-slate-500 underline hover:text-slate-400 transition"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && !busy && (
        <div className="rounded-xl border border-red-700/50 bg-red-950/40 px-4 py-3">
          <p className="text-sm text-red-300">{error}</p>
          <div className="mt-2 flex gap-3">
            {pendingPages.length > 0 && (
              <button
                type="button"
                onClick={() => { setError(""); setAwaitingMore(true); }}
                className="text-xs text-blue-400 underline"
              >
                Back to page queue
              </button>
            )}
            <button
              type="button"
              onClick={resetAll}
              className="text-xs text-slate-400 underline"
            >
              Start over
            </button>
          </div>
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────────────────── */}
      {/*
        CHANGED: Added ref={resultsRef} so the useEffect above auto-scrolls here
        the moment setResult() fires — no manual refresh or navigation needed.
      */}
      {result && !isScanning && (
        <div ref={resultsRef} className="flex flex-col gap-4">

          {/* Large-contract truncation warning */}
          {truncated && (
            <div className="rounded-xl border border-amber-600/40 bg-amber-950/30 px-4 py-3">
              <p className="text-xs text-amber-300">
                <span className="font-semibold">Large contract detected:</span> This document exceeded
                the ~50-page processing limit. The analysis covers the first portion. For the remaining
                pages, split the contract into sections and scan each separately.
              </p>
            </div>
          )}

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
            {/* Dynamic width — Tailwind cannot generate arbitrary runtime percentage values */}
            <div className="w-full h-2 rounded-full bg-slate-700">
              <div
                className={`h-2 rounded-full transition-all ${riskInfo!.bg}`}
                style={{ width: `${result.riskScore}%` }}
              />
            </div>
            {result.jurisdiction && jurisdiction !== "none" && (
              <p className="text-xs text-slate-500 mt-2">
                {US_STATES.find((s) => s.code === result.jurisdiction)?.name
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

          {/* Basic mode — top issues + upgrade CTA */}
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
                        <span className="text-amber-400 mt-0.5 shrink-0" aria-hidden="true">⚠</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-xl border border-blue-700/50 bg-blue-950/30 px-4 py-4">
                <p className="text-sm font-semibold text-white mb-1">Want the full picture?</p>
                <p className="text-xs text-slate-400 mb-3">
                  Deep Scan analyzes every clause, flags missing protections, and surfaces deadline
                  risks with specific recommendations.
                </p>
                {canDeepScan ? (
                  <button
                    type="button"
                    onClick={() => { setScanMode("deep"); setResult(null); setError(""); }}
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
                      Deadlines &amp; Time-Sensitive Terms
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

          {/* Scan another contract */}
          <button
            type="button"
            onClick={resetAll}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-400 transition"
          >
            Scan Another Contract
          </button>

          <p className="text-center text-[11px] text-slate-500 px-2">
            This analysis is for informational purposes only and does not constitute legal advice.
            Always consult a licensed attorney before signing.
          </p>
        </div>
      )}
    </div>
  );
}
