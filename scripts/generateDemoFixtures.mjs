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
// Sample contracts (copied from app/dashboard/DashboardAnalyzer.tsx)
// ---------------------------------------------------------------------------
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
