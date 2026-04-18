"use client";

import { useRef, useState, useEffect } from "react";
import DownloadPdfButton from "@/app/components/DownloadPdfButton";
import { US_STATES } from "@/app/lib/jurisdictions";

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

type JurisdictionAnalysis = {
  risk: "Low" | "Medium" | "High";
  explanation: string;
  recommendation: string;
  governingLaw?: string | null;
  forumClause?: string | null;
  jurisdictionMatch?: boolean | null;
  floridaChecklist?: { item: string; present: boolean }[];
};

type AnalysisResponse = {
  riskScore?: number;
  summary?: string;
  issues?: AnalysisIssue[];
  deadlines?: AnalysisDeadline[];
  jurisdictionAnalysis?: JurisdictionAnalysis;
  detectedJurisdiction?: string | null;
  jurisdictionConfidence?: "high" | "medium" | "low";
};

type UsageInfo = {
  plan: string;
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
  // Lifetime count of shield_deep scans — used to gate the 2-trial allowance for Free/Starter
  shieldDeepTrialsUsed: number;
};

const REQUEST_TIMEOUT_MS = 120000;

const SAMPLE_CONTRACTS = [
  {
    id: "marketing",
    label: "Marketing Services Agreement",
    fileName: "marketing-services-agreement.txt",
    text: `MARKETING SERVICES AGREEMENT

This Marketing Services Agreement ("Agreement") is entered into between Alpha Solutions LLC ("Provider") and BrightPath Marketing ("Client") as of January 1, 2026.

1. Services and Deliverables
Provider agrees to deliver the following digital marketing services each calendar month:
  (a) Search engine optimization (SEO): minimum 4 optimized blog posts, monthly keyword ranking report, and on-page audit of up to 10 pages;
  (b) Content creation: up to 8 social media assets and 2 email newsletter drafts;
  (c) Ad management: management of Client's paid search and social campaigns with a written performance summary delivered within 5 business days of month-end.
Performance metrics: Provider shall maintain or improve Client's organic search ranking for agreed target keywords and shall provide a monthly dashboard report showing impressions, clicks, conversions, and ad spend efficiency. Parties shall review and update deliverable scope in writing no less than annually.

2. Payment Terms
Client shall pay Provider $5,000 per month, due within thirty (30) days of invoice date ("Net-30"). Invoices shall be issued on the first business day of each month for the prior month's services. Overdue invoices shall accrue interest at 1.5% per month (18% per annum) from the due date until paid. Provider may suspend services after providing 10 days' written notice if any invoice remains unpaid for more than 45 days.

3. Term
This Agreement commences on January 1, 2026 and continues for twelve (12) months ("Initial Term"), unless terminated earlier in accordance with Section 4. After the Initial Term, this Agreement shall renew for successive one-year terms unless either party provides written notice of non-renewal at least thirty (30) days before the end of the then-current term.

4. Termination
Either party may terminate this Agreement for convenience upon thirty (30) days' prior written notice. Either party may terminate for cause if the other party materially breaches this Agreement and fails to cure such breach within fourteen (14) days of receiving written notice describing the breach in reasonable detail. Upon termination, Client shall pay for all services rendered through the effective termination date.

5. Intellectual Property
All work product, content, creative assets, and deliverables created by Provider specifically for Client under this Agreement ("Deliverables") shall become the exclusive property of Client upon receipt of full payment for the applicable invoice. Provider retains ownership of its pre-existing tools, methodologies, templates, and know-how used in performing services, but grants Client a perpetual, royalty-free license to use such elements as incorporated into the Deliverables.

6. Liability
Each party's total cumulative liability to the other under or in connection with this Agreement shall not exceed the total fees paid by Client in the three (3) months immediately preceding the event giving rise to the claim. This limitation applies to all causes of action in aggregate. Neither party shall be liable to the other for indirect, incidental, consequential, or punitive damages. These limitations shall not apply to claims arising from gross negligence, willful misconduct, or a party's indemnification obligations.

7. Confidentiality
Each party ("Receiving Party") agrees to hold in strict confidence all non-public business, technical, or financial information disclosed by the other party ("Disclosing Party") that is designated as confidential or that reasonably should be understood to be confidential ("Confidential Information"). Confidential Information does not include information that: (a) is or becomes publicly known through no fault of the Receiving Party; (b) was rightfully known to the Receiving Party before disclosure; (c) is independently developed by the Receiving Party without use of the Disclosing Party's information; or (d) is required to be disclosed by law or court order, provided the Receiving Party gives prompt prior written notice where permitted. These obligations survive termination of this Agreement for two (2) years.

8. Data Protection
Provider shall process Client's customer or user data solely for the purpose of performing services under this Agreement. Provider shall implement and maintain reasonable technical and organizational security measures to protect such data. Provider shall promptly notify Client of any actual or suspected unauthorized access to Client data. Each party shall comply with applicable data protection and privacy laws, including GDPR and CCPA where applicable.

9. Warranties
Provider warrants that: (a) services will be performed in a professional and workmanlike manner consistent with industry standards; (b) Deliverables will not knowingly infringe any third-party intellectual property rights; and (c) Provider has full authority to enter into and perform this Agreement.

10. Indemnification
Each party ("Indemnifying Party") shall defend, indemnify, and hold harmless the other party from and against third-party claims, losses, and expenses (including reasonable attorneys' fees) arising from the Indemnifying Party's: (a) gross negligence or willful misconduct; or (b) infringement of a third party's intellectual property rights in materials the Indemnifying Party provides. Each party's indemnification obligations are subject to the liable party receiving prompt notice, sole control of the defense, and reasonable cooperation.

11. Governing Law and Dispute Resolution
This Agreement is governed by the laws of the State of Florida, without regard to its conflict-of-law principles. Any dispute arising under this Agreement shall first be submitted to non-binding mediation administered by a mutually agreed mediator. If mediation does not resolve the dispute within 30 days of submission, either party may submit the dispute to binding arbitration under the rules of the American Arbitration Association, with proceedings conducted in Orlando, Florida. Judgment on the arbitration award may be entered in any court of competent jurisdiction.

12. Entire Agreement
This Agreement constitutes the entire agreement between the parties regarding its subject matter and supersedes all prior discussions and agreements. Amendments must be in writing and signed by both parties.
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
Vendor agrees to supply goods as specified in purchase orders submitted by Buyer ("Orders"). Each Order shall specify the product description, quantity, unit price, and required delivery date. Vendor shall confirm or reject each Order in writing within three (3) business days of receipt. Confirmed Orders constitute binding obligations on both parties. Vendor shall use commercially reasonable efforts to meet the delivery date in each confirmed Order and shall notify Buyer at least five (5) business days in advance if any delivery will be delayed. Standard lead times for Vendor's catalog products are fourteen (14) business days from Order confirmation.

2. Payment Terms
Buyer shall pay each invoice within thirty (30) days of the invoice date ("Net-30"). Invoices shall be issued upon shipment of goods. For Orders exceeding $50,000, the parties may agree to a milestone payment structure set forth in the applicable Order. Overdue invoices shall accrue interest at 1.0% per month from the due date until paid. Vendor may withhold future shipments after providing 10 days' written notice if any invoice remains unpaid for more than 60 days.

3. Pricing and Price Adjustments
The initial price schedule for Vendor's catalog products is set forth in Exhibit A. Either party may request a price adjustment by providing sixty (60) days' prior written notice. If Buyer objects to a proposed price increase, Buyer may terminate this Agreement without penalty by providing written notice within thirty (30) days of receiving the price increase notice, with termination effective at the end of the 60-day notice period. Price increases shall not apply to Orders already confirmed before the effective date of the adjustment.

4. Term and Renewal
This Agreement commences on February 1, 2026 and continues for one (1) year ("Initial Term"). After the Initial Term, this Agreement shall automatically renew for successive one-year terms unless either party provides written notice of non-renewal at least ninety (90) days before the end of the then-current term. Either party may terminate this Agreement for convenience upon ninety (90) days' prior written notice.

5. Intellectual Property
Any custom products, tooling, molds, designs, or specifications developed by Vendor exclusively for Buyer and funded by Buyer under this Agreement ("Custom Work") shall be the exclusive property of Buyer upon full payment of the applicable development fees. Vendor retains ownership of all pre-existing intellectual property and general manufacturing know-how. Vendor grants Buyer a non-exclusive license to any of Vendor's background IP incorporated into Custom Work solely to the extent necessary for Buyer to use, sell, and maintain the Custom Work products.

6. Limitation of Liability
Each party's total cumulative liability to the other under or in connection with this Agreement shall not exceed the total amounts paid or payable by Buyer to Vendor in the twelve (12) months immediately preceding the event giving rise to the claim. Neither party shall be liable for indirect, incidental, consequential, or punitive damages. These limitations shall not apply to: (a) claims arising from gross negligence or willful misconduct; (b) a party's indemnification obligations; or (c) Buyer's payment obligations.

7. Product Warranties
Vendor warrants that all goods supplied under this Agreement shall: (a) conform to the specifications set forth in the applicable Order; (b) be merchantable and fit for their ordinary intended purpose; (c) be free from material defects in materials and workmanship for a period of twelve (12) months from the date of delivery ("Warranty Period"). If any goods fail to meet these warranties during the Warranty Period, Vendor shall, at its option, repair or replace the defective goods or issue a credit for the purchase price, as Buyer's sole and exclusive remedy for warranty claims.

8. Termination
There is no termination penalty for terminating this Agreement for convenience in accordance with Section 4. Buyer shall remain liable for payment of all confirmed Orders placed prior to the effective date of termination.

9. Confidentiality
Each party agrees to hold in strict confidence all non-public information disclosed by the other party that is designated as confidential or that reasonably should be understood to be confidential ("Confidential Information"). Confidential Information excludes information that: (a) becomes publicly known through no fault of the Receiving Party; (b) was known to the Receiving Party prior to disclosure; (c) is independently developed without use of the Disclosing Party's information; or (d) is required to be disclosed by law or court order, with prompt prior written notice where permitted. These obligations survive termination for two (2) years.

10. Indemnification
Each party shall defend, indemnify, and hold harmless the other party from third-party claims, losses, and expenses (including reasonable attorneys' fees) arising from the Indemnifying Party's: (a) gross negligence or willful misconduct; (b) infringement of a third party's intellectual property rights in materials the Indemnifying Party provides; or (c) in Vendor's case, personal injury or property damage caused by a defect in goods supplied under this Agreement. Indemnification obligations require prompt notice, tender of defense control to the Indemnifying Party, and reasonable cooperation.

11. Dispute Resolution
This Agreement is governed by the laws of the State of Delaware. Any dispute arising under this Agreement shall first be escalated to senior management of each party for good-faith negotiation for a period of fifteen (15) days. If not resolved, the dispute shall be submitted to non-binding mediation. If mediation does not resolve the dispute within thirty (30) days of submission, either party may pursue binding arbitration under the rules of the American Arbitration Association in Wilmington, Delaware. Judgment on any arbitration award may be entered in any court of competent jurisdiction.

12. Entire Agreement
This Agreement, together with all Exhibits and confirmed Orders, constitutes the entire agreement between the parties and supersedes all prior understandings. Amendments must be in writing and signed by authorized representatives of both parties.
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

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
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

const JURISDICTION_STORAGE_KEY = "huginnPreferredJurisdiction";

export default function DashboardAnalyzer({ usageInfo, shieldDeepTrialsUsed }: DashboardAnalyzerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
  const [periodUsed, setPeriodUsed] = useState(usageInfo.periodUsed);
  const [expandedIssues, setExpandedIssues] = useState<Set<number>>(new Set());

  // ── Huginn Shield state ────────────────────────────────────────────────────
  const [shieldMode, setShieldMode] = useState(false);
  const [scanMode, setScanMode] = useState<"basic" | "shield_deep">("basic");
  const [jurisdiction, setJurisdiction] = useState("none");
  const [customJurisdiction, setCustomJurisdiction] = useState("");
  const [jurisdictionSaved, setJurisdictionSaved] = useState(false);
  const [showJurisdictionEdit, setShowJurisdictionEdit] = useState(false);

  // Deep Scan eligibility — tracked locally so it updates after each scan
  const [localDeepTrialsUsed, setLocalDeepTrialsUsed] = useState(shieldDeepTrialsUsed);
  const isPro = usageInfo.plan === "PRO";
  const hasAddon = usageInfo.addonRemaining > 0;
  const deepTrialsRemaining = Math.max(0, 2 - localDeepTrialsUsed);
  // Allowed: Pro (unlimited), active add-on, or < 2 lifetime free trials
  const canDeepScan = !usageInfo.paymentFailed && (isPro || hasAddon || deepTrialsRemaining > 0);

  // Load saved jurisdiction from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(JURISDICTION_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { code: string; custom: string };
        if (saved.code) {
          setJurisdiction(saved.code);
          setCustomJurisdiction(saved.custom ?? "");
          setJurisdictionSaved(true);
        }
      }
    } catch { /* ignore parse errors */ }
  }, []);

  function saveJurisdiction() {
    try {
      localStorage.setItem(
        JURISDICTION_STORAGE_KEY,
        JSON.stringify({ code: jurisdiction, custom: customJurisdiction })
      );
    } catch { /* ignore storage errors */ }
    setJurisdictionSaved(true);
    setShowJurisdictionEdit(false);
  }

  function getJurisdictionLabel(): string {
    if (jurisdiction === "none") return "None selected";
    if (jurisdiction === "other") return customJurisdiction || "Custom";
    return US_STATES.find((s) => s.code === jurisdiction)?.name ?? jurisdiction;
  }

  // Derive free-tier exhaustion from local state so it updates mid-session
  // (usageInfo.needsPlan is frozen at SSR time and won't reflect in-session usage)
  const isFreeExhausted = usageInfo.plan === "FREE" && remainingAnalyses === 0;

  const canAnalyze =
    !usageInfo.paymentFailed &&
    !usageInfo.needsPlan &&
    !isFreeExhausted &&
    remainingAnalyses > 0;

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

    // Camera photo or image upload — extracted via Claude Vision
    if (file.type.startsWith("image/")) {
      if (file.size > 4.5 * 1024 * 1024) {
        throw new Error("Image is too large. Please use a photo under 4.5 MB.");
      }
      const response = await fetchWithTimeout("/api/extract-image", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to read image.");
      return String(data.text || "");
    }

    throw new Error("Please upload a PDF, DOCX, TXT, or image file.");
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

      // Build jurisdiction value for Shield Deep scans
      const activeJurisdiction =
        shieldMode && scanMode === "shield_deep" && jurisdiction !== "none"
          ? jurisdiction === "other"
            ? customJurisdiction.trim()
            : jurisdiction
          : undefined;

      const response = await fetchWithTimeout("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          text,
          template: "compliance_checker",
          config: {},
          fileName: file.name,
          scanMode: shieldMode ? scanMode : "basic",
          ...(activeJurisdiction ? { jurisdiction: activeJurisdiction } : {}),
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
        jurisdictionAnalysis: data.jurisdictionAnalysis ?? undefined,
        detectedJurisdiction: data.detectedJurisdiction ?? null,
        jurisdictionConfidence: data.jurisdictionConfidence ?? undefined,
      });
      setResultTimestamp(new Date().toLocaleString());
      setRemainingAnalyses((prev) => Math.max(0, prev - 1));
      setPeriodUsed((prev) => prev + 1);
      // Track deep scan trial usage locally so the UI updates without a page reload
      if (shieldMode && scanMode === "shield_deep" && !isPro && !hasAddon) {
        setLocalDeepTrialsUsed((prev) => prev + 1);
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
    : isFreeExhausted || (usageInfo.needsPlan && usageInfo.plan === "FREE")
    ? "You've used your 3 free analyses. Subscribe to continue."
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

        {/* ── Huginn Shield Panel ─────────────────────────────────────────────── */}
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
          {/* Toggle header */}
          <button
            type="button"
            onClick={() => setShieldMode((m) => !m)}
            className="flex w-full items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span aria-hidden="true">🛡️</span>
              <span className="text-sm font-semibold text-blue-900">Huginn Shield</span>
              <span className="hidden sm:block text-xs text-blue-600">
                Jurisdiction-aware deep analysis
              </span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                shieldMode
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {shieldMode ? "ON" : "OFF"}
            </span>
          </button>

          {shieldMode && (
            <div className="mt-3 space-y-3 border-t border-blue-200 pt-3">
              {/* Feature description — shown once when panel opens */}
              <p className="text-xs text-blue-800 leading-relaxed">
                Huginn Shield Deep Scan includes jurisdiction analysis across all 50 states and
                Florida F.S. §559.9613 disclosure checks.{" "}
                <span className="font-semibold">Included with Pro ($29.99/mo).</span>
              </p>

              {/* Jurisdiction selector */}
              <div>
                <label htmlFor="dashboard-jurisdiction-select" className="mb-1 text-xs font-semibold text-slate-600 uppercase tracking-wide block">
                  Your Jurisdiction
                </label>

                {jurisdictionSaved && !showJurisdictionEdit ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-700 font-medium">{getJurisdictionLabel()}</span>
                    <button
                      type="button"
                      onClick={() => setShowJurisdictionEdit(true)}
                      className="text-xs text-blue-600 underline hover:text-blue-800"
                    >
                      Change?
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      id="dashboard-jurisdiction-select"
                      value={jurisdiction}
                      onChange={(e) => setJurisdiction(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="none">— No state selected —</option>
                      {US_STATES.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.name}
                        </option>
                      ))}
                      <option value="other">Other – specify state or county</option>
                    </select>

                    {jurisdiction === "other" && (
                      <input
                        type="text"
                        value={customJurisdiction}
                        onChange={(e) => setCustomJurisdiction(e.target.value)}
                        placeholder="e.g. Brevard County, FL or Miami-Dade County, FL"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    )}

                    {jurisdiction === "FL" && (
                      <p className="text-xs text-blue-600">
                        Florida selected — F.S. §559.9613 disclosure check will run on Deep Scan.
                      </p>
                    )}

                    {/* "other" !== "none" already, so this single check covers all non-empty selections */}
                    {jurisdiction !== "none" && (
                      <button
                        type="button"
                        onClick={saveJurisdiction}
                        className="text-xs text-blue-700 font-semibold underline hover:text-blue-900"
                      >
                        Save jurisdiction preference
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Scan mode toggle */}
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Scan Type
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {/* Basic Scan — neutral styling, always available */}
                  <button
                    type="button"
                    onClick={() => setScanMode("basic")}
                    className={`rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition ${
                      scanMode === "basic"
                        ? "border-blue-500 bg-blue-100 text-blue-800"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="font-semibold">Basic Scan</div>
                    <div className="mt-0.5 text-slate-400">Standard analysis</div>
                  </button>

                  {/* Deep Scan — available to Pro, add-on holders, or users with free trials remaining.
                      Unselected state uses a persistent blue tint so it reads as premium, not just inactive. */}
                  {canDeepScan ? (
                    <button
                      type="button"
                      onClick={() => setScanMode("shield_deep")}
                      className={`rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition ${
                        scanMode === "shield_deep"
                          ? "border-blue-500 bg-blue-600 text-white"
                          : "border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100"
                      }`}
                    >
                      <div className="font-semibold">Deep Scan 🛡️</div>
                      {/* Subtitle at full opacity — this is the key eligibility info */}
                      <div className={`mt-0.5 text-xs ${scanMode === "shield_deep" ? "text-blue-100" : "text-blue-500"}`}>
                        {isPro
                          ? "Unlimited with Pro"
                          : hasAddon
                          ? `${usageInfo.addonRemaining} add-on ${usageInfo.addonRemaining === 1 ? "analysis" : "analyses"} remaining`
                          : `${deepTrialsRemaining} of 2 free ${deepTrialsRemaining === 1 ? "trial" : "trials"} left`}
                      </div>
                    </button>
                  ) : (
                    // Locked state — trials exhausted, not Pro, no add-on.
                    // Spans full width; blue-tinted border signals this is the premium option.
                    <div className="col-span-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <span>🛡️</span>
                        <span>Deep Scan — Pro Feature</span>
                      </div>
                      <p className="mt-1 text-slate-500 leading-snug">
                        Unlock unlimited jurisdiction analysis across all 50 states
                        {" "}and Florida F.S. §559.9613 disclosure checks.
                      </p>
                      <a
                        href="/pricing"
                        className="mt-2 inline-block font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Upgrade to Pro ($29.99/mo) →
                      </a>
                    </div>
                  )}
                </div>

                {/* Usage note shown only when Deep Scan is actively selected */}
                {scanMode === "shield_deep" && canDeepScan && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    Uses 1 analysis from your quota · Includes governing law comparison
                    {jurisdiction === "FL" ? " + F.S. §559.9613 checklist" : ""}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Usage counter */}
        {!usageInfo.paymentFailed && !usageInfo.needsPlan && (
          <p className="mt-3 text-sm text-slate-600">
            {usageInfo.plan === "FREE"
              ? `Free analyses: ${periodUsed} / ${usageInfo.periodLimit} used`
              : `${periodUsed} / ${usageInfo.periodLimit} analyses used this month`}
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

        {/* Camera capture — shown always; useful on mobile */}
        <button
          type="button"
          aria-label="Take photo of contract"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isAnalyzing || !canAnalyze}
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Take Photo of Contract
        </button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          aria-label="Take photo of contract"
          className="hidden"
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

        {/* Subscribe prompt for exhausted free tier */}
        {!canAnalyze && (isFreeExhausted || (usageInfo.needsPlan && usageInfo.plan === "FREE")) && (
          <div className="mt-4 flex flex-wrap gap-2" id="subscribe">
            <a
              href="/select-plan"
              className="inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Subscribe — Starter $9.99/mo
            </a>
            <a
              href="/select-plan"
              className="inline-block rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              Pro $29.99/mo
            </a>
          </div>
        )}

        {/* Buy more / upgrade prompt for paid plan at limit */}
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

            {/* Detected Jurisdiction — shown whenever jurisdiction was auto-extracted */}
            {result.detectedJurisdiction && !result.jurisdictionAnalysis && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span aria-hidden="true">📍</span>
                  <p className="text-sm font-semibold text-slate-800">
                    Governing law detected: <span className="text-blue-700">{result.detectedJurisdiction}</span>
                  </p>
                  {result.jurisdictionConfidence && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      result.jurisdictionConfidence === "high"
                        ? "bg-green-100 text-green-700"
                        : result.jurisdictionConfidence === "medium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {result.jurisdictionConfidence} confidence
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-blue-700">
                  Enable Shield Deep Scan and select {result.detectedJurisdiction} for full jurisdiction analysis.
                </p>
              </div>
            )}

            {/* Jurisdiction Analysis — only shown for Shield Deep scans */}
            {result.jurisdictionAnalysis && (
              <div className={`rounded-xl border p-4 ${
                result.jurisdictionAnalysis.risk === "High"
                  ? "border-red-200 bg-red-50"
                  : result.jurisdictionAnalysis.risk === "Medium"
                  ? "border-amber-200 bg-amber-50"
                  : "border-green-200 bg-green-50"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span aria-hidden="true">🛡️</span>
                  <h3 className="text-sm font-semibold text-slate-800">Jurisdiction Analysis</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    result.jurisdictionAnalysis.risk === "High"
                      ? "bg-red-100 text-red-700"
                      : result.jurisdictionAnalysis.risk === "Medium"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700"
                  }`}>
                    {result.jurisdictionAnalysis.risk} Risk
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {result.jurisdictionAnalysis.explanation}
                </p>
                {result.jurisdictionAnalysis.recommendation && (
                  <p className="mt-2 text-xs font-semibold text-slate-600">
                    Action: {result.jurisdictionAnalysis.recommendation}
                  </p>
                )}
                {result.jurisdictionAnalysis.governingLaw && (
                  <p className="mt-2 text-xs text-slate-500">
                    Governing law: <span className="font-medium text-slate-700">{result.jurisdictionAnalysis.governingLaw}</span>
                    {result.jurisdictionAnalysis.forumClause ? ` · Forum: ${result.jurisdictionAnalysis.forumClause}` : ""}
                  </p>
                )}
                {result.jurisdictionAnalysis.floridaChecklist && result.jurisdictionAnalysis.floridaChecklist.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-600 mb-1">F.S. §559.9613 Disclosure Checklist</p>
                    <ul className="space-y-0.5">
                      {result.jurisdictionAnalysis.floridaChecklist.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs">
                          <span>{item.present ? "✅" : "❌"}</span>
                          <span className={item.present ? "text-slate-600" : "text-red-700 font-medium"}>
                            {item.item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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

            <div className="border-t border-slate-100 pt-4 space-y-3">
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
              <p className="text-xs text-slate-400">
                <strong>Disclaimer:</strong> This is informational only and not legal advice. Laws change and vary by jurisdiction; always consult a licensed attorney in your jurisdiction for binding decisions.
              </p>
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
