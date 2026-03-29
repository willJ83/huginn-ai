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

type UsageInfo = {
  inTrial: boolean;
  remaining: number;
  planRemaining: number;
  addonRemaining: number;
  periodUsed: number;
  periodLimit: number;
  paymentFailed: boolean;
  needsPlan: boolean;
};

type DashboardAnalyzerProps = {
  usageInfo: UsageInfo;
};

const REQUEST_TIMEOUT_MS = 120000;

const SAMPLE_CONTRACTS = [
  {
    id: "marketing",
    label: "Marketing Services Agreement",
    fileName: "marketing-services-agreement.txt",
    text: `MARKETING SERVICES AGREEMENT

This Marketing Services Agreement ("Agreement") is entered into between Alpha Solutions LLC ("Provider") and BrightPath Marketing ("Client") as of January 1, 2026.

1. Services
Provider agrees to deliver digital marketing services including SEO, content creation, and ad management. The specific deliverables, timelines, and performance metrics for these services are to be determined at a later date.

2. Payment Terms
Client agrees to pay $5,000 per month. Payment is due within a reasonable time after invoicing. No late fees or interest shall apply to overdue invoices.

3. Term
This agreement begins on January 1, 2026 and continues for 12 months unless terminated earlier.

4. Termination
Either party may terminate this agreement at any time with written notice. No notice period is specified.

5. Liability
Provider is not liable for any damages arising from the use of services, including any direct, indirect, incidental, or consequential damages of any kind.

6. Confidentiality
Both parties agree to keep sensitive information confidential.

[INTENTIONALLY OMITTED]

7. Governing Law
[left blank]

8. Dispute Resolution
Any disputes will be handled in a mutually agreed manner.
`,
  },
  {
    id: "nda",
    label: "Non-Disclosure Agreement",
    fileName: "non-disclosure-agreement.txt",
    text: `MUTUAL NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into between Vertex Innovations Inc. ("Disclosing Party") and the undersigned recipient ("Receiving Party") effective upon signature.

1. Definition of Confidential Information
"Confidential Information" means any and all information disclosed by either party to the other, in any form whatsoever, including but not limited to business plans, financial data, customer lists, trade secrets, technical specifications, software, product concepts, marketing strategies, employee information, and any other information of any kind. There are no exceptions or carve-outs to this definition. Information that is already publicly known, independently developed, or disclosed by a third party shall nonetheless be considered Confidential Information under this Agreement.

2. Obligations of Receiving Party
The Receiving Party agrees to hold all Confidential Information in strict confidence and shall not disclose any Confidential Information to any third party under any circumstances. The Receiving Party shall use the Confidential Information solely for internal evaluation purposes. These obligations apply only to the Receiving Party and not to the Disclosing Party.

3. No Permitted Disclosures
There are no permitted disclosures under this Agreement. The Receiving Party may not disclose Confidential Information even if required by law, court order, or government authority.

4. Duration
The confidentiality obligations of the Receiving Party shall continue in perpetuity and shall survive the termination or expiration of this Agreement without limit.

5. Non-Compete
In consideration of receiving Confidential Information, the Receiving Party agrees not to directly or indirectly engage in, consult for, or have any business relationship with any company that competes with the Disclosing Party for a period of two (2) years following the termination of this Agreement. This restriction applies globally.

6. Intellectual Property
All information shared under this Agreement and any work product derived therefrom shall remain the exclusive property of the Disclosing Party.

7. Governing Law
[left blank — to be determined]

8. Remedies
The Receiving Party acknowledges that any breach of this Agreement would cause irreparable harm to the Disclosing Party. The Disclosing Party shall be entitled to seek injunctive relief without posting a bond.

9. Entire Agreement
This Agreement constitutes the entire agreement between the parties with respect to confidentiality and supersedes all prior discussions.
`,
  },
  {
    id: "vendor",
    label: "Vendor Supply Agreement",
    fileName: "vendor-supply-agreement.txt",
    text: `VENDOR SUPPLY AGREEMENT

This Vendor Supply Agreement ("Agreement") is entered into between SteelCore Manufacturing Ltd. ("Vendor") and Pinnacle Retail Group ("Buyer") effective as of February 1, 2026.

1. Supply of Goods
Vendor agrees to supply goods as ordered by Buyer from time to time. No delivery timelines, lead times, or performance standards are defined in this Agreement. Vendor shall determine delivery schedules at its sole discretion.

2. Payment Terms
Buyer shall pay 100% of the invoice amount upfront prior to any shipment or delivery. No credit terms are available. Vendor reserves the right to withhold delivery until full payment is confirmed.

3. Pricing and Price Adjustments
The initial price schedule is set forth in Exhibit A. Vendor reserves the right to increase prices by up to twenty percent (20%) annually upon thirty (30) days written notice to Buyer. Buyer has no right to reject or opt out of price increases. Continued ordering after the notice period constitutes acceptance of the new pricing.

4. Term and Renewal
This Agreement shall commence on February 1, 2026 and shall automatically renew for successive one-year terms unless either party provides written notice of cancellation no later than fifteen (15) days prior to the end of the then-current term. Failure to provide timely notice shall result in automatic renewal for an additional year.

5. Intellectual Property
Any custom products, tooling, molds, designs, or specifications developed by Vendor for Buyer under this Agreement shall remain the exclusive intellectual property of Vendor. Buyer shall have no ownership rights in any custom work product, even if Buyer funded the development of such work.

6. Limitation of Liability
Vendor's total liability under this Agreement, for any cause whatsoever and regardless of the form of action, shall not exceed five hundred dollars ($500.00). This limitation applies to all claims including those for breach of contract, negligence, and product defects.

7. Termination Penalty
If Buyer terminates this Agreement prior to the end of the then-current term for any reason other than Vendor's uncured material breach, Buyer shall pay Vendor a termination penalty equal to twenty-five percent (25%) of the total value of all remaining purchase obligations for the balance of the term.

8. Dispute Resolution
[No dispute resolution process defined. All disputes shall be handled as agreed upon by the parties at the time of the dispute.]

9. Governing Law
This Agreement shall be governed by the laws of the State of Delaware.
`,
  },
  {
    id: "freelance",
    label: "Freelance Contract",
    fileName: "freelance-contract.txt",
    text: `FREELANCE SERVICES AGREEMENT

This Freelance Services Agreement ("Agreement") is entered into between Nova Digital LLC ("Client") and the undersigned independent contractor ("Freelancer") effective as of March 1, 2026.

1. Services
Freelancer agrees to provide web development and design services as directed by Client. The scope of work, deliverables, and deadlines shall be communicated by Client via email or verbal instruction and may be modified by Client at any time.

2. Revisions and Scope
Client may request unlimited revisions to any deliverable at any time, including after final delivery. Freelancer agrees to complete all requested revisions at no additional charge regardless of the nature or volume of changes requested.

3. Intellectual Property — Work for Hire
All work product created by Freelancer under this Agreement, including all deliverables, code, designs, concepts, and documentation, shall be considered works made for hire and shall be the exclusive property of Client. This assignment includes all pre-existing tools, frameworks, libraries, and methodologies used by Freelancer in the performance of services, including any open-source or proprietary tools developed prior to this engagement. Freelancer waives all moral rights in the work product.

4. Payment
Client shall pay Freelancer within ninety (90) days of invoice submission. No interest or late fees shall accrue on overdue payments. Client reserves the right to dispute any invoice within the 90-day period, which shall restart the payment clock upon resolution.

5. Kill Fee
If Client cancels the project after work has commenced, no cancellation fee or kill fee shall be payable to Freelancer. Freelancer shall be compensated only for hours worked and accepted by Client prior to cancellation.

6. Non-Solicitation
Freelancer agrees that during the term of this Agreement and for a period of three (3) years following termination, Freelancer shall not provide services to, consult for, or be employed by any person or entity that competes with Client's business in any market in which Client operates, directly or indirectly.

7. Legal Compliance Costs
Freelancer shall be solely responsible for ensuring that all deliverables comply with applicable laws, regulations, and third-party intellectual property rights. In the event that Client incurs any legal costs, penalties, or settlements arising from Freelancer's failure to ensure compliance, Freelancer shall indemnify and reimburse Client for all such costs without limitation.

8. Jurisdiction and Governing Law
This Agreement shall be governed by the laws of the State of Alaska, and any disputes shall be resolved exclusively in the state or federal courts located in Fairbanks, Alaska. Freelancer waives any objection to personal jurisdiction or venue in such courts.

9. Entire Agreement
This Agreement constitutes the entire agreement between the parties and supersedes all prior discussions or agreements.
`,
  },
] as const;

type SampleId = (typeof SAMPLE_CONTRACTS)[number]["id"];

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function createSampleFile(id: SampleId) {
  const sample = SAMPLE_CONTRACTS.find((s) => s.id === id)!;
  return new File([sample.text], sample.fileName, { type: "text/plain" });
}

function toUserFacingError(err: unknown) {
  const message = err instanceof Error ? err.message : "";
  if (message.includes("Please upload a PDF, DOCX, or TXT file.")) {
    return "Unsupported file. Please upload a PDF, DOCX, or TXT file.";
  }
  if (
    message.includes("Failed to parse") ||
    message.includes("Network") ||
    message.includes("abort")
  ) {
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
      interpretation: "This contract has serious issues that need attention before signing.",
    };
  }
  if (score <= 70) {
    return {
      label: "MODERATE RISK",
      badgeClass: "bg-amber-100 text-amber-700",
      barClass: "bg-amber-500",
      interpretation: "This contract has some areas that need attention before signing.",
    };
  }
  return {
    label: "LOW RISK",
    badgeClass: "bg-green-100 text-green-700",
    barClass: "bg-green-500",
    interpretation: "This contract looks generally sound, but review the flagged items below.",
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

export default function DashboardAnalyzer({ usageInfo }: DashboardAnalyzerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSample, setSelectedSample] = useState<SampleId>("marketing");
  const [isDragActive, setIsDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [processedFileType, setProcessedFileType] = useState("");
  const [extractionStatus, setExtractionStatus] = useState<"Full" | "Partial" | "">("");
  const [resultTimestamp, setResultTimestamp] = useState("");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [remainingAnalyses, setRemainingAnalyses] = useState(usageInfo.remaining);
  const [expandedIssues, setExpandedIssues] = useState<Set<number>>(new Set());

  const canAnalyze =
    !usageInfo.paymentFailed && !usageInfo.needsPlan && remainingAnalyses > 0;

  function toggleIssue(index: number) {
    setExpandedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function extractTextFromFile(file: File) {
    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith(".txt")) return file.text();

    const formData = new FormData();
    formData.append("file", file);

    if (lowerName.endsWith(".pdf")) {
      const response = await fetchWithTimeout("/api/extract-pdf", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to parse PDF.");
      return String(data.text || "");
    }

    if (lowerName.endsWith(".docx")) {
      const response = await fetchWithTimeout("/api/extract-docx", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to parse DOCX.");
      return String(data.text || "");
    }

    throw new Error("Please upload a PDF, DOCX, or TXT file.");
  }

  async function runAnalysis(file: File) {
    if (!canAnalyze) return;

    setError("");
    setWarning("");
    setIsAnalyzing(true);
    setExpandedIssues(new Set());

    try {
      const text = await extractTextFromFile(file);
      const lowerName = file.name.toLowerCase();

      if (lowerName.endsWith(".pdf")) setProcessedFileType("PDF");
      else if (lowerName.endsWith(".docx")) setProcessedFileType("DOCX");
      else setProcessedFileType("TXT");

      if (!text.trim()) throw new Error("Failed to parse uploaded file.");

      if (text.length < 500) {
        setWarning("Warning:\nWe could not fully extract text from this file.\nResults may be incomplete.");
        setExtractionStatus("Partial");
      } else {
        setExtractionStatus("Full");
      }

      const response = await fetchWithTimeout("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          text,
          template: "compliance_checker",
          config: {},
          fileName: file.name,
        }),
      });

      if (response.status === 401) {
        setError("Please log in to analyze a contract.");
        return;
      }

      if (!response.ok) {
        let message = "Analysis failed. Please try again.";
        try {
          const txt = await response.text();
          if (txt) message = txt;
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
      setRemainingAnalyses((prev) => Math.max(0, prev - 1));
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

  async function loadDemoContract(id: SampleId) {
    setError("");
    setWarning("");
    await runAnalysis(createSampleFile(id));
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

  const blockedMessage = usageInfo.paymentFailed
    ? "Your payment failed. Update your billing information to continue."
    : usageInfo.needsPlan
    ? "Please select a plan to run analyses."
    : remainingAnalyses === 0
    ? "Monthly limit reached. Buy more analyses or upgrade your plan."
    : null;

  return (
    <section className="mt-8 grid gap-5 lg:mt-10 lg:grid-cols-2 lg:gap-6">
      {/* Upload panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-slate-900">Upload Document</h2>
        <p className="mt-2 text-sm text-slate-600">
          Drop a PDF, DOCX, or TXT file to run a contract analysis.
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Your documents are not stored permanently beyond operational retention needs.
        </p>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Try a Sample Contract
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            {SAMPLE_CONTRACTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSample(s.id)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  selectedSample === s.id
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-100"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => loadDemoContract(selectedSample)}
            disabled={isAnalyzing || !canAnalyze}
            className="inline-flex items-center rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {isAnalyzing ? "Analyzing..." : "Run Sample Analysis"}
          </button>
        </div>

        {/* Usage counter */}
        {!usageInfo.paymentFailed && !usageInfo.needsPlan && (
          <p className="mt-3 text-sm text-slate-600">
            {usageInfo.inTrial
              ? `Trial: ${usageInfo.periodUsed} / ${usageInfo.periodLimit} analyses used`
              : `${usageInfo.periodUsed} / ${usageInfo.periodLimit} analyses used this month`}
            {usageInfo.addonRemaining > 0 ? ` + ${usageInfo.addonRemaining} add-on` : ""}
          </p>
        )}

        {blockedMessage && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {blockedMessage}
          </p>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDragActive(false);
            await handleFile(e.dataTransfer.files?.[0] ?? null);
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
              ? "Upload disabled"
              : "Analyze Contract"}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {isAnalyzing
              ? "Please wait while we process your file."
              : !canAnalyze
              ? "Resolve the issue above to continue analyzing."
              : "Drag & drop your document here, or tap to upload"}
          </p>
        </button>

        <label htmlFor="dashboardFileUpload" className="sr-only">Upload contract document</label>
        <input
          id="dashboardFileUpload"
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          title="Upload contract document"
          onChange={async (e) => {
            const input = e.currentTarget;
            const file = input.files?.[0] ?? null;
            if (!file) return;
            try { await handleFile(file); }
            finally { input.value = ""; }
          }}
        />

        {uploadedFileName && (
          <p className="mt-4 text-sm text-slate-600">Last file: {uploadedFileName}</p>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        {/* Buy more / upgrade prompt when at limit */}
        {!canAnalyze && !usageInfo.paymentFailed && !usageInfo.needsPlan && (
          <div className="mt-4 flex flex-wrap gap-2" id="buy-more">
            <BuyAnalysesButton pack="5" label="Buy 5 analyses — $4.99" />
            <BuyAnalysesButton pack="10" label="Buy 10 analyses — $7.99" />
            <a
              href="/pricing"
              className="inline-block rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              Upgrade Plan
            </a>
          </div>
        )}
      </div>

      {/* Results panel */}
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
            <p>Supported files:<br />PDF, DOCX, TXT</p>
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {warning && (
              <p className="whitespace-pre-line rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {warning}
              </p>
            )}

            {processedFileType && extractionStatus && (
              <p className="text-sm text-slate-500">
                File: {processedFileType} &middot; Extraction: {extractionStatus}
                {resultTimestamp ? ` · ${resultTimestamp}` : ""}
              </p>
            )}

            {riskInfo && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contract Health Score
                </p>
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <span className="text-4xl font-bold text-slate-900">{result.riskScore ?? 0}</span>
                  <span className="mb-0.5 text-base font-medium text-slate-400">/ 100</span>
                  <span className={`mb-0.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${riskInfo.badgeClass}`}>
                    {riskInfo.label}
                  </span>
                </div>
                <div className="mt-3 h-2.5 w-full rounded-full bg-slate-200">
                  <div
                    className={`h-2.5 rounded-full ${riskInfo.barClass}`}
                    style={{ width: `${result.riskScore ?? 0}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-slate-600">{riskInfo.interpretation}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                    {highCount} High Risk
                  </span>
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                    {mediumCount} Moderate
                  </span>
                  <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    {deadlines.length} {deadlines.length === 1 ? "Deadline" : "Deadlines"}
                  </span>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Before You Sign</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{summaryIntro}</p>
              {result.summary && (
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                  {result.summary}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {issues.length === 0
                  ? "Issues Found"
                  : `${issues.length} ${issues.length === 1 ? "Issue" : "Issues"} Found`}
              </h3>
              <div className="mt-2 space-y-2">
                {issues.length === 0 ? (
                  <p className="text-sm text-slate-600">No issues found in this contract.</p>
                ) : (
                  issues.map((issue, index) => (
                    <div
                      key={`${issue.id || issue.label || "issue"}-${index}`}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-wrap items-start gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${getSeverityBadge(issue.severity)}`}>
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
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">What to do</p>
                          <p className="mt-1 break-words text-sm leading-relaxed text-slate-700">
                            {issue.recommendation}
                          </p>
                        </div>
                      )}

                      {Array.isArray(issue.matches) && issue.matches.length > 0 && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => toggleIssue(index)}
                            className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                          >
                            {expandedIssues.has(index) ? "▼" : "▶"} See the clause that triggered this flag
                          </button>
                          {expandedIssues.has(index) && (
                            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                              {issue.matches.map((match, mi) => (
                                <p key={mi} className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-600">
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

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Time-Sensitive Clauses</h3>
              <div className="mt-2">
                {deadlines.length === 0 ? (
                  <p className="rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-800">
                    No auto-renewals or hard deadlines detected — nothing here requires immediate action on your calendar.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {deadlines.map((deadline, index) => (
                      <div
                        key={`${deadline.id || deadline.label || "deadline"}-${index}`}
                        className="flex flex-col gap-1 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="break-words font-medium text-slate-900">{deadline.label || "Deadline"}</p>
                          {deadline.description && (
                            <p className="mt-0.5 text-xs text-slate-500">{deadline.description}</p>
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

function BuyAnalysesButton({ pack, label }: { pack: "5" | "10"; label: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/buy-analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Something went wrong.");
        return;
      }
      window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-block rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
    >
      {loading ? "Loading..." : label}
    </button>
  );
}
