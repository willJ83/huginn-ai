import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { runDeterministicExtraction } from "../../../lib/riskEngine";
import { HUGINN_V2_PROMPT, SHIELD_BASIC_PROMPT, buildJurisdictionAddendum } from "../../../lib/huginnPrompt";
import { auth } from "@/lib/auth";
import { canUseFeature, consumeAddonAnalysis, recordUsage } from "@/lib/billing";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Basic Scan ───────────────────────────────────────────────────────────────
// Single-stage, no quota consumed. Returns limited results (top 3 issues only).
async function runBasicScan(text: string, jurisdictionCode?: string) {
  const jurisdictionNote =
    jurisdictionCode && jurisdictionCode !== "none"
      ? `\nJurisdiction: ${jurisdictionCode}. Note any state-specific risks.`
      : "";

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: SHIELD_BASIC_PROMPT,
    messages: [
      {
        role: "user",
        content: `${jurisdictionNote}\n\nContract:\n${text.slice(0, 8000)}`,
      },
    ],
  });

  const raw = msg.content[0]?.type === "text" ? msg.content[0].text : "";
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as {
      riskScore: number;
      summary: string;
      topIssues: string[];
    };
  } catch {
    return null;
  }
}

// ─── Deep Scan ────────────────────────────────────────────────────────────────
// Full 3-stage pipeline identical to /api/analyze, with jurisdiction injection.
async function runDeepScan(text: string, jurisdictionCode?: string) {
  // Stage 1 — Classify
  const classifyMsg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Identify the contract type from this list: Master Service Agreement, Statement of Work, NDA, SLA, Independent Contractor Agreement, Licensing Agreement, SaaS Subscription Agreement, Terms of Service, Data Processing Agreement, Vendor Agreement, Purchase Agreement, Partnership Agreement, Employment Agreement, Consulting Agreement, Marketing Services Agreement, Software Development Agreement, Maintenance & Support Agreement, Reseller Agreement, Franchise Agreement, Amendment/Addendum, Consumer Finance Agreement, Home Improvement Contract, Other. Return JSON only: { "type": string, "confidence": string, "rationale": string }\n\nContract text:\n${text}`,
      },
    ],
  });

  let contractType = { type: "Unknown", confidence: "low", rationale: "" };
  const classifyText =
    classifyMsg.content[0]?.type === "text" ? classifyMsg.content[0].text : "";
  const classifyJson = classifyText.match(/\{[\s\S]*\}/);
  if (classifyJson) {
    try {
      contractType = JSON.parse(classifyJson[0]);
    } catch { /* keep default */ }
  }

  // Stage 2 — Extract
  const extractMsg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `This is a ${contractType.type}. Extract all clauses present and flag any missing. Categories: confidentiality, indemnification, limitation_of_liability, ip_ownership, payment_terms, termination, renewal, governing_law, warranties, data_protection, service_levels, deliverables, non_compete, non_solicit, insurance, dispute_resolution, audit_rights, royalties, support. For each: status (found/missing), exact text, location in document. Return JSON only.\n\nContract text:\n${text}`,
      },
    ],
  });

  let extractedClauses: Record<string, unknown> = {};
  const extractText =
    extractMsg.content[0]?.type === "text" ? extractMsg.content[0].text : "";
  const extractJson = extractText.match(/\{[\s\S]*\}/);
  if (extractJson) {
    try {
      extractedClauses = JSON.parse(extractJson[0]);
    } catch { /* keep default */ }
  }

  // Build jurisdiction-aware system prompt for Stage 3
  const jurisdictionAddendum = buildJurisdictionAddendum(jurisdictionCode);
  const systemPrompt = HUGINN_V2_PROMPT + jurisdictionAddendum;

  // Stage 3 — Validate & Score
  const deterministicResult = runDeterministicExtraction({
    text,
    template: "compliance_checker",
    config: {},
  });

  const analyzeMsg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Contract Type: ${contractType.type} (Confidence: ${contractType.confidence})\nRationale: ${contractType.rationale}\n\nExtracted Clauses:\n${JSON.stringify(extractedClauses, null, 2)}\n\nDeterministic Findings:\n${JSON.stringify(deterministicResult, null, 2)}\n\nFull contract text:\n${text}`,
      },
    ],
  });

  const analyzeText =
    analyzeMsg.content[0]?.type === "text" ? analyzeMsg.content[0].text : "";
  const stripped = analyzeText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const jsonMatch = stripped.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (typeof parsed.riskScore !== "number" || !parsed.summary) return null;
    return { parsed, deterministicResult };
  } catch {
    return null;
  }
}

function deriveRiskLevel(score: number): string {
  if (score >= 80) return "low";
  if (score >= 50) return "medium";
  return "high";
}

// ─── Route Handler ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const { text, mode, jurisdiction, fileName } = body as {
      text: string;
      mode: "basic" | "deep";
      jurisdiction?: string;
      fileName?: string;
    };

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ ok: false, error: "Missing contract text." }, { status: 400 });
    }

    const scanMode = mode === "deep" ? "deep" : "basic";

    // ── Basic Scan — no quota consumed ──────────────────────────────────────
    if (scanMode === "basic") {
      const result = await runBasicScan(text, jurisdiction);
      if (!result) {
        return NextResponse.json(
          { ok: false, error: "Analysis failed. Please try again." },
          { status: 500 }
        );
      }
      return NextResponse.json({
        mode: "basic",
        riskScore: result.riskScore ?? 0,
        summary: result.summary ?? "",
        topIssues: Array.isArray(result.topIssues) ? result.topIssues.slice(0, 3) : [],
        jurisdiction: jurisdiction ?? null,
      });
    }

    // ── Deep Scan — consumes one analysis from quota ─────────────────────────
    const usage = await canUseFeature(session.user.id, "huginn_analysis");

    if (!usage.allowed) {
      const errorMessage = usage.paymentFailed
        ? "Your payment failed. Update your billing information to continue."
        : usage.needsPlan && usage.plan === "FREE"
        ? "You've used your 3 free analyses. Subscribe to continue."
        : usage.needsPlan
        ? "Please select a plan to run analyses."
        : "You've used all your analyses this month. Buy more or upgrade your plan.";

      return NextResponse.json(
        { ok: false, error: errorMessage, remaining: 0 },
        { status: 403 }
      );
    }

    const deepResult = await runDeepScan(text, jurisdiction);

    if (!deepResult) {
      return NextResponse.json(
        { ok: false, error: "Deep scan failed. Please try again." },
        { status: 500 }
      );
    }

    const { parsed, deterministicResult } = deepResult;

    // Merge missingProtections into issues as "missing" severity cards
    const missingAsIssues = (parsed.missingProtections ?? []).map(
      (mp: { label: string; severity: string; explanation?: string; recommendation?: string }, i: number) => ({
        id: `missing-${i}`,
        label: mp.label,
        severity: "missing",
        explanation: mp.explanation,
        recommendation: mp.recommendation,
        matches: [] as string[],
      })
    );

    const finalIssues = [...(parsed.issues ?? []), ...missingAsIssues];
    const finalRiskScore = parsed.riskScore ?? 0;
    const finalSummary = parsed.summary ?? "";
    const finalDeadlines = parsed.deadlines ?? [];
    const finalRiskLevel = deriveRiskLevel(finalRiskScore);

    await recordUsage(session.user.id, "huginn_analysis");
    if (usage.planRemaining === 0 && usage.addonRemaining > 0) {
      await consumeAddonAnalysis(session.user.id);
    }

    const saved = await prisma.analysis.create({
      data: {
        userId: session.user.id,
        fileName: fileName ?? null,
        template: "compliance_checker",
        // undefined omits the field (Prisma uses column default); null would fail non-nullable String columns
        product: "error" in deterministicResult ? undefined : deterministicResult.product,
        label: "error" in deterministicResult ? undefined : deterministicResult.label,
        description: "error" in deterministicResult ? undefined : deterministicResult.description,
        documentType: "error" in deterministicResult ? undefined : deterministicResult.documentType,
        riskScore: finalRiskScore,
        riskLevel: finalRiskLevel,
        summary: finalSummary,
        matchedKeywords: "error" in deterministicResult ? [] : (deterministicResult.matchedKeywords as any),
        missingRequiredKeywords: "error" in deterministicResult ? [] : (deterministicResult.missingRequiredKeywords as any),
        forbiddenKeywordHits: "error" in deterministicResult ? [] : (deterministicResult.forbiddenKeywordHits as any),
        issues: finalIssues as any,
        deadlines: finalDeadlines as any,
        metadata: "error" in deterministicResult ? {} : (deterministicResult.metadata as any),
      },
    });

    return NextResponse.json({
      mode: "deep",
      id: saved.id,
      riskScore: finalRiskScore,
      summary: finalSummary,
      issues: finalIssues,
      deadlines: finalDeadlines,
      riskLevel: finalRiskLevel,
      jurisdiction: jurisdiction ?? null,
      remaining: usage.remaining - 1,
    });
  } catch (error) {
    console.error("[shield/scan] ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
