/**
 * One-off script to generate pre-baked demo fixtures for /demo page.
 * Run with: node scripts/generateDemoFixtures.mjs
 * Requires ANTHROPIC_API_KEY in environment (or .env.local).
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// Load .env.local manually (no dotenv dep needed)
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
try {
  const envFile = readFileSync(envPath, "utf8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env.local not found — rely on shell environment
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ---------------------------------------------------------------------------
// HUGINN_V2_PROMPT (copied from app/lib/huginnPrompt.ts)
// ---------------------------------------------------------------------------
const HUGINN_V2_PROMPT = `
You are Huginn — a world-class contract intelligence system built to protect businesses from legal and financial risk.

You operate as the final analytical stage in a three-part pipeline:
- Stage 1 identified the contract type and confidence level.
- Stage 2 extracted every clause present and flagged missing ones.

Your input contains:
- Contract Type (with confidence and rationale from Stage 1)
- Extracted Clauses (structured JSON from Stage 2)
- Deterministic Findings (rule-based risk flags, keywords, risk score, deadlines)
- Full Contract Text

Your job is to synthesize all context into a complete, structured JSON analysis a business owner can act on immediately.

---

ANALYSIS FRAMEWORK

RISK SCORE (0–100):
Score represents contract health — higher is safer.
- 80–100: Low risk, reasonable contract
- 50–79: Moderate risk, some terms need attention
- 20–49: High risk, significant issues present
- 0–19: Critical risk, do not sign without legal review
Weight the score based on severity of issues found and missing protections.

ISSUES — problematic clauses that exist in the contract:
- Unlimited or uncapped liability
- One-sided termination with no cure period
- Automatic renewal with no opt-out window
- IP ownership transferred to the other party
- Non-compete or non-solicit that materially restricts future business
- Personal guarantee or joint-and-several liability
- Unilateral amendment rights by the other party
- Binding arbitration in an inconvenient jurisdiction
- Vague payment terms or undefined deliverables
- Overly broad indemnification lacking carve-outs
- Asymmetric obligations

MISSING PROTECTIONS — important clauses absent from the contract:
Only include high and medium severity gaps. Omit minor/low-impact omissions.
- HIGH: No limitation of liability, no termination rights, no IP ownership clause, no data protection terms when personal data is involved
- MEDIUM: No dispute resolution, no audit rights, no warranty disclaimers, no governing law clause

DEADLINES — time-sensitive obligations:
- Auto-renewal notice windows
- Payment due dates
- Term start/end dates
- Notice periods for termination

---

OUTPUT RULES

You MUST respond with ONLY a single valid JSON object. No markdown, no code fences, no prose before or after.
The JSON must exactly match this structure:

{
  "riskScore": <integer 0-100>,
  "summary": "<2-3 sentence plain English summary: contract type, biggest risk, whether they should be concerned. No jargon.>",
  "issues": [
    {
      "id": "<unique-kebab-case-string>",
      "label": "<Plain English issue title>",
      "severity": "<critical|high|medium|low>",
      "clauseReference": "<Clause number or section name, e.g. Section 4.2 or Termination>",
      "message": "<One sentence: what is wrong with this clause>",
      "explanation": "<2-3 sentences: real-world consequence for this business owner, no jargon>",
      "recommendation": "<One action sentence starting with a verb>",
      "matches": ["<exact text excerpt from the contract that triggered this flag>"]
    }
  ],
  "missingProtections": [
    {
      "label": "<What is missing>",
      "severity": "<high|medium>",
      "explanation": "<Why this absence creates risk>",
      "recommendation": "<What to ask for>"
    }
  ],
  "deadlines": [
    {
      "label": "<What the deadline or time-sensitive obligation is>",
      "value": "<Specific date or timeframe, e.g. 30 days, January 1 2026>",
      "description": "<Why this matters and what happens if missed>"
    }
  ]
}

RULES:
- Never invent facts, clauses, or risks not grounded in the provided inputs.
- Never use legal jargon without plain-English translation.
- Do not be alarmist beyond what findings warrant. Do not be dismissive when real risk exists.
- If the contract is genuinely low risk, say so and return few or no issues.
- issues array may be empty if no problematic clauses found.
- missingProtections array may be empty if all key protections are present.
- deadlines array may be empty if no time-sensitive obligations found.
- matches should contain the shortest excerpt that proves the issue — do not quote the entire clause.
- Always write for a smart, busy business owner who needs to make a decision today.
`.trim();

// ---------------------------------------------------------------------------
// Sample contracts — marketing and vendor only (updated fair versions)
// ---------------------------------------------------------------------------
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
];

// ---------------------------------------------------------------------------
// 3-stage Claude pipeline (mirrors app/api/analyze/route.ts)
// ---------------------------------------------------------------------------
function deriveRiskLevel(score) {
  if (score >= 80) return "low";
  if (score >= 50) return "medium";
  return "high";
}

async function runPipeline(contractText, label) {
  console.error(`\n[${label}] Stage 1: Classifying...`);

  // Stage 1 — Classify
  const classifyMsg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Identify the contract type from this list: Master Service Agreement, Statement of Work, NDA, SLA, Independent Contractor Agreement, Licensing Agreement, SaaS Subscription Agreement, Terms of Service, Data Processing Agreement, Vendor Agreement, Purchase Agreement, Partnership Agreement, Employment Agreement, Consulting Agreement, Marketing Services Agreement, Software Development Agreement, Maintenance & Support Agreement, Reseller Agreement, Franchise Agreement, Amendment/Addendum. Return JSON only: { "type": string, "confidence": string, "rationale": string }\n\nContract text:\n${contractText}`,
      },
    ],
  });

  let contractType = { type: "Unknown", confidence: "low", rationale: "" };
  const classifyText = classifyMsg.content[0]?.type === "text" ? classifyMsg.content[0].text : "";
  const classifyJson = classifyText.match(/\{[\s\S]*\}/);
  if (classifyJson) {
    try { contractType = JSON.parse(classifyJson[0]); } catch {}
  }
  console.error(`[${label}] Stage 1 done: ${contractType.type} (${contractType.confidence})`);

  // Stage 2 — Extract
  console.error(`[${label}] Stage 2: Extracting clauses...`);
  const extractMsg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `This is a ${contractType.type}. Extract all clauses present and flag any missing. Categories: confidentiality, indemnification, limitation_of_liability, ip_ownership, payment_terms, termination, renewal, governing_law, warranties, data_protection, service_levels, deliverables, non_compete, non_solicit, insurance, dispute_resolution, audit_rights, royalties, support. For each: status (found/missing), exact text, location in document. Return JSON only.\n\nContract text:\n${contractText}`,
      },
    ],
  });

  let extractedClauses = {};
  const extractText = extractMsg.content[0]?.type === "text" ? extractMsg.content[0].text : "";
  const extractJson = extractText.match(/\{[\s\S]*\}/);
  if (extractJson) {
    try { extractedClauses = JSON.parse(extractJson[0]); } catch {}
  }
  console.error(`[${label}] Stage 2 done: ${Object.keys(extractedClauses).length} clauses`);

  // Stage 3 — Analyze
  console.error(`[${label}] Stage 3: Analyzing...`);
  const analyzeMsg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: HUGINN_V2_PROMPT,
    messages: [
      {
        role: "user",
        content: `Contract Type: ${contractType.type} (Confidence: ${contractType.confidence})\nRationale: ${contractType.rationale}\n\nExtracted Clauses:\n${JSON.stringify(extractedClauses, null, 2)}\n\nFull contract text:\n${contractText}`,
      },
    ],
  });

  const analyzeText = analyzeMsg.content[0]?.type === "text" ? analyzeMsg.content[0].text : "";
  const stripped = analyzeText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const jsonMatch = stripped.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`[${label}] Stage 3: no JSON in response`);

  const parsed = JSON.parse(jsonMatch[0]);
  if (typeof parsed.riskScore !== "number" || !parsed.summary) {
    throw new Error(`[${label}] Stage 3: missing required fields`);
  }

  // Merge missingProtections into issues as "missing" severity (mirrors route.ts)
  const missingAsIssues = (parsed.missingProtections ?? []).map((mp, i) => ({
    id: `missing-${i}`,
    label: mp.label,
    severity: "missing",
    explanation: mp.explanation,
    recommendation: mp.recommendation,
    matches: [],
  }));

  const finalIssues = [...(parsed.issues ?? []), ...missingAsIssues];
  const riskLevel = deriveRiskLevel(parsed.riskScore);

  console.error(`[${label}] Done. Score: ${parsed.riskScore}, Issues: ${finalIssues.length}, Deadlines: ${(parsed.deadlines ?? []).length}`);

  return {
    riskScore: parsed.riskScore,
    riskLevel,
    summary: parsed.summary,
    issues: finalIssues,
    deadlines: parsed.deadlines ?? [],
    documentType: contractType.type,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ERROR: ANTHROPIC_API_KEY not set");
    process.exit(1);
  }

  const results = {};

  for (const contract of SAMPLE_CONTRACTS) {
    try {
      results[contract.id] = await runPipeline(contract.text, contract.label);
    } catch (err) {
      console.error(`FAILED [${contract.label}]:`, err.message);
      process.exit(1);
    }
  }

  // Output final JSON to stdout — pipe to a file or review in terminal
  console.log(JSON.stringify(results, null, 2));
}

main();
