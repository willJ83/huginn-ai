import { NextResponse } from "next/server";
import { getFlashModel, getProModel, parseGeminiJSON } from "@/lib/gemini";
import { runDeterministicExtraction } from "../../../lib/riskEngine";
import { HUGINN_V2_PROMPT, SHIELD_BASIC_PROMPT, buildJurisdictionAddendum, SHIELD_JURISDICTION_STAGE_PROMPT } from "../../../lib/huginnPrompt";
import { auth } from "@/lib/auth";
import { canUseFeature, consumeAddonAnalysis, recordUsage } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  rateLimitExceeded,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import {
  sanitizeContractText,
  sanitizeJurisdiction,
  sanitizeFileName,
  wrapContractText,
  MAX_CONTRACT_CHARS,
} from "@/lib/sanitize";

// ── Vercel function timeout ────────────────────────────────────────────────────
// Raise to 300s (Pro plan max) so large deep scans don't hit the 60s default.
export const maxDuration = 300;

// ─── Basic Scan ───────────────────────────────────────────────────────────────
// Single-stage, no quota consumed. Returns limited results (top 3 issues only).
async function runBasicScan(text: string, jurisdictionCode: string) {
  const jurisdictionNote =
    jurisdictionCode !== "none"
      ? `\nJurisdiction: ${jurisdictionCode}. Note any state-specific risks.`
      : "";

  // Wrap contract text in XML delimiters so the model treats it as data,
  // not as additional instructions. See lib/sanitize.ts for threat model.
  const wrappedText = wrapContractText(text.slice(0, 8_000));

  const model = getFlashModel(SHIELD_BASIC_PROMPT, 512);
  const result = await model.generateContent(
    `${jurisdictionNote}\n\nContract to analyse:\n${wrappedText}`
  );
  const raw = result.response.text();

  return parseGeminiJSON<{
    riskScore: number;
    summary: string;
    topIssues: string[];
  }>(raw);
}

// ─── Deep Scan — Stage 1: Classify ───────────────────────────────────────────
async function classifyContract(text: string) {
  const model = getProModel(undefined, 512);
  const result = await model.generateContent(
    `Identify the contract type from this list: Master Service Agreement, Statement of Work, NDA, SLA, Independent Contractor Agreement, Licensing Agreement, SaaS Subscription Agreement, Terms of Service, Data Processing Agreement, Vendor Agreement, Purchase Agreement, Partnership Agreement, Employment Agreement, Consulting Agreement, Marketing Services Agreement, Software Development Agreement, Maintenance & Support Agreement, Reseller Agreement, Franchise Agreement, Amendment/Addendum, Consumer Finance Agreement, Home Improvement Contract, Other. Return JSON only: { "type": string, "confidence": string, "rationale": string }\n\nContract text (opening excerpt):\n${wrapContractText(text.slice(0, 8_000))}`
  );
  const parsed = parseGeminiJSON<{
    type: string;
    confidence: string;
    rationale: string;
  }>(result.response.text());
  return parsed ?? { type: "Unknown", confidence: "low", rationale: "" };
}

// ─── Deep Scan — Stage 2: Extract ────────────────────────────────────────────
async function extractClauses(
  text: string,
  contractType: { type: string }
): Promise<Record<string, unknown>> {
  const model = getProModel(undefined, 4096);
  const result = await model.generateContent(
    `This is a ${contractType.type}. Extract all clauses present and flag any missing. Categories: confidentiality, indemnification, limitation_of_liability, ip_ownership, payment_terms, termination, renewal, governing_law, warranties, data_protection, service_levels, deliverables, non_compete, non_solicit, insurance, dispute_resolution, audit_rights, royalties, support. For each: status (found/missing), exact text, location in document. Return JSON only.\n\nContract text:\n${wrapContractText(text)}`
  );
  return parseGeminiJSON<Record<string, unknown>>(result.response.text()) ?? {};
}

// ─── Deep Scan — Stage 3: Score & Analyze ────────────────────────────────────
async function scoreAndAnalyze(
  text: string,
  contractType: { type: string; confidence: string; rationale: string },
  extractedClauses: Record<string, unknown>,
  jurisdictionCode: string
) {
  const deterministicResult = runDeterministicExtraction({
    text,
    template: "compliance_checker",
    config: {},
  });

  const jurisdictionAddendum = buildJurisdictionAddendum(jurisdictionCode);
  const systemPrompt = HUGINN_V2_PROMPT + jurisdictionAddendum;

  const model = getProModel(systemPrompt, 8192);
  const result = await model.generateContent(
    `Contract Type: ${contractType.type} (Confidence: ${contractType.confidence})\nRationale: ${contractType.rationale}\n\nExtracted Clauses:\n${JSON.stringify(extractedClauses, null, 2)}\n\nDeterministic Findings:\n${JSON.stringify(deterministicResult, null, 2)}\n\nFull contract text:\n${wrapContractText(text)}`
  );

  const parsed = parseGeminiJSON<{
    riskScore: number;
    summary: string;
    issues: unknown[];
    missingProtections: unknown[];
    deadlines: unknown[];
  }>(result.response.text());

  if (!parsed || typeof parsed.riskScore !== "number" || !parsed.summary) return null;
  return { parsed, deterministicResult };
}

function deriveRiskLevel(score: number): string {
  if (score >= 80) return "low";
  if (score >= 50) return "medium";
  return "high";
}

// ─── Stage 4: Jurisdiction Analysis ──────────────────────────────────────────

interface JurisdictionChecklistItem {
  item: string;
  present: boolean;
  risk?: "Low" | "Medium" | "High";
}

interface JurisdictionAnalysis {
  risk: "Low" | "Medium" | "High";
  explanation: string;
  recommendation: string;
  governingLaw: string | null;
  forumClause: string | null;
  jurisdictionMatch: boolean | null;
  floridaChecklist?: JurisdictionChecklistItem[];
  californiaChecklist?: JurisdictionChecklistItem[];
  texasChecklist?: JurisdictionChecklistItem[];
  scChecklist?: JurisdictionChecklistItem[];
  ncChecklist?: JurisdictionChecklistItem[];
}

async function runJurisdictionStage(
  contractText: string,
  jurisdiction: string,
  contractType: string
): Promise<JurisdictionAnalysis | null> {
  try {
    const isFL = /\bfl\b|florida/i.test(jurisdiction);
    const isCA = /\bca\b|california/i.test(jurisdiction);
    const isTX = /\btx\b|texas/i.test(jurisdiction);
    const isSC = /\bsc\b|south\s*carolina/i.test(jurisdiction);
    const isNC = /\bnc\b|north\s*carolina/i.test(jurisdiction);
    const isFinancing = /financ|loan|merchant\s*cash|advance|lending|credit\s*agree|borrow|installment/i.test(contractType);

    const stateInstruction = isFL && isFinancing
      ? "\n\nThe user's jurisdiction IS Florida and this is a financing/lending contract. You MUST include the floridaChecklist array in your JSON. Omit californiaChecklist, texasChecklist, scChecklist, and ncChecklist."
      : isFL
      ? "\n\nThe user's jurisdiction IS Florida but this contract is NOT a financing instrument. Do NOT include a floridaChecklist — §559.9613 does not apply. Omit californiaChecklist, texasChecklist, scChecklist, and ncChecklist."
      : isCA
      ? "\n\nThe user's jurisdiction IS California. You MUST include the californiaChecklist array in your JSON. Omit floridaChecklist, texasChecklist, scChecklist, and ncChecklist."
      : isTX
      ? "\n\nThe user's jurisdiction IS Texas. You MUST include the texasChecklist array in your JSON. Omit floridaChecklist, californiaChecklist, scChecklist, and ncChecklist."
      : isSC
      ? "\n\nThe user's jurisdiction IS South Carolina. You MUST include the scChecklist array in your JSON. Omit floridaChecklist, californiaChecklist, texasChecklist, and ncChecklist."
      : isNC
      ? "\n\nThe user's jurisdiction IS North Carolina. You MUST include the ncChecklist array in your JSON. Omit floridaChecklist, californiaChecklist, texasChecklist, and scChecklist."
      : "\n\nThe user's jurisdiction does not require a state-specific checklist. Omit floridaChecklist, californiaChecklist, texasChecklist, scChecklist, and ncChecklist entirely.";

    const model = getProModel(SHIELD_JURISDICTION_STAGE_PROMPT, 1024);
    const result = await model.generateContent(
      `User's selected jurisdiction: ${jurisdiction}${stateInstruction}\n\nFull contract text:\n${contractText}`
    );

    return parseGeminiJSON<JurisdictionAnalysis>(result.response.text());
  } catch (err) {
    console.error("[shield/scan] Jurisdiction Stage ERROR:", err instanceof Error ? err.message : "unknown");
    return null;
  }
}

// ─── Route Handler ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const userId = session.user.id;

    // ── Parse & validate body ─────────────────────────────────────────────────
    const body = await req.json();
    const rawText         = body.text;
    const rawMode         = body.mode;
    const rawJurisdiction = body.jurisdiction;
    const rawFileName     = body.fileName;

    if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
      return NextResponse.json({ ok: false, error: "Missing contract text." }, { status: 400 });
    }

    // Server-side enforcement of the text ceiling (client-side alone is not enough).
    if (rawText.length > MAX_CONTRACT_CHARS) {
      return NextResponse.json(
        { ok: false, error: "Contract text exceeds the maximum allowed length." },
        { status: 400 }
      );
    }

    // Sanitise all user-controlled inputs before they touch prompts or DB.
    const text         = sanitizeContractText(rawText);
    const jurisdiction = sanitizeJurisdiction(rawJurisdiction);
    const fileName     = sanitizeFileName(rawFileName);
    const scanMode     = rawMode === "deep" ? "deep" : "basic";

    // ── Rate limit ────────────────────────────────────────────────────────────
    // Keyed by userId so quota is per-account, not per-IP (authenticated route).
    const rateLimitKey = scanMode === "deep"
      ? `scan_deep:${userId}`
      : `scan_basic:${userId}`;
    const rateLimitCfg = scanMode === "deep"
      ? RATE_LIMITS.deepScan
      : RATE_LIMITS.basicScan;

    const { allowed, resetAt } = await checkRateLimit(rateLimitKey, rateLimitCfg);
    if (!allowed) return rateLimitExceeded(resetAt);

    // ── Basic Scan — no quota consumed, plain JSON response ───────────────────
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
        jurisdiction: jurisdiction !== "none" ? jurisdiction : null,
      });
    }

    // ── Deep Scan — SSE streaming response ────────────────────────────────────
    // Each stage emits a `data: {...}\n\n` SSE event so the client can show
    // real-time progress. The final event carries the complete result payload.
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const emit = (event: object) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          } catch { /* client disconnected */ }
        };

        try {
          // ── Quota check (before burning API tokens) ────────────────────────
          const usage = await canUseFeature(userId, "huginn_analysis");

          if (!usage.allowed) {
            const errorMessage = usage.paymentFailed
              ? "Your payment failed. Update your billing information to continue."
              : usage.needsPlan && usage.plan === "FREE"
              ? "You've used your 3 free analyses. Subscribe to continue."
              : usage.needsPlan
              ? "Please select a plan to run analyses."
              : "You've used all your analyses this month. Buy more or upgrade your plan.";

            emit({ type: "error", message: errorMessage, remaining: 0 });
            controller.close();
            return;
          }

          const totalStages = jurisdiction !== "none" ? 4 : 3;

          // ── Stage 1 — Classify ─────────────────────────────────────────────
          emit({ type: "progress", stage: 1, total: totalStages, message: "Classifying contract type…" });
          const contractType = await classifyContract(text);

          // ── Stage 2 — Extract ──────────────────────────────────────────────
          emit({ type: "progress", stage: 2, total: totalStages, message: "Extracting clauses and obligations…" });
          const extractedClauses = await extractClauses(text, contractType);

          // ── Stage 3 — Score & Analyze ──────────────────────────────────────
          emit({ type: "progress", stage: 3, total: totalStages, message: "Scoring risks and building your report…" });
          const deepResult = await scoreAndAnalyze(text, contractType, extractedClauses, jurisdiction);

          if (!deepResult) {
            emit({ type: "error", message: "Deep scan failed. Please try again." });
            controller.close();
            return;
          }

          const { parsed, deterministicResult } = deepResult;

          // ── Stage 4 — Jurisdiction Analysis (non-blocking) ────────────────
          // Failure here does not abort the scan — the main result still saves.
          let jurisdictionAnalysis: JurisdictionAnalysis | null = null;
          if (jurisdiction !== "none") {
            emit({ type: "progress", stage: 4, total: totalStages, message: "Analysing jurisdiction and state-specific compliance…" });
            jurisdictionAnalysis = await runJurisdictionStage(text, jurisdiction, contractType.type);
          }

          type MissingProtection = {
            label: string;
            severity: string;
            explanation?: string;
            recommendation?: string;
          };
          const missingAsIssues = (parsed.missingProtections as MissingProtection[] ?? []).map(
            (mp, i) => ({
              id: `missing-${i}`,
              label: mp.label,
              severity: "missing",
              explanation: mp.explanation,
              recommendation: mp.recommendation,
              matches: [] as string[],
            })
          );

          const finalIssues    = [...(parsed.issues ?? []), ...missingAsIssues];
          const finalRiskScore = parsed.riskScore ?? 0;
          const finalSummary   = parsed.summary ?? "";
          const finalDeadlines = parsed.deadlines ?? [];
          const finalRiskLevel = deriveRiskLevel(finalRiskScore);

          // ── Record usage & save to DB ──────────────────────────────────────
          await recordUsage(userId, "huginn_analysis");
          if (usage.planRemaining === 0 && usage.addonRemaining > 0) {
            await consumeAddonAnalysis(userId);
          }

          const baseMetadata = ("error" in deterministicResult || !deterministicResult.metadata)
            ? {}
            : (deterministicResult.metadata as object);
          const finalMetadata = jurisdictionAnalysis
            ? { ...baseMetadata, jurisdictionAnalysis, jurisdiction, contractType: contractType.type }
            : baseMetadata;

          const saved = await prisma.analysis.create({
            data: {
              userId,
              fileName,
              template: "compliance_checker",
              product:
                "error" in deterministicResult ? "unknown" : deterministicResult.product ?? "",
              label:
                "error" in deterministicResult ? "unknown" : deterministicResult.label ?? "",
              description:
                "error" in deterministicResult ? "unknown" : deterministicResult.description ?? "",
              documentType:
                "error" in deterministicResult ? "unknown" : deterministicResult.documentType ?? "",
              riskScore:    finalRiskScore,
              riskLevel:    finalRiskLevel,
              summary:      finalSummary,
              matchedKeywords:
                "error" in deterministicResult ? [] : (deterministicResult.matchedKeywords as any),
              missingRequiredKeywords:
                "error" in deterministicResult ? [] : (deterministicResult.missingRequiredKeywords as any),
              forbiddenKeywordHits:
                "error" in deterministicResult ? [] : (deterministicResult.forbiddenKeywordHits as any),
              issues:    finalIssues as any,
              deadlines: finalDeadlines as any,
              metadata:  finalMetadata as any,
            },
          });

          emit({
            type: "result",
            payload: {
              mode: "deep",
              id: saved.id,
              riskScore:  finalRiskScore,
              summary:    finalSummary,
              issues:     finalIssues,
              deadlines:  finalDeadlines,
              riskLevel:  finalRiskLevel,
              jurisdiction: jurisdiction !== "none" ? jurisdiction : null,
              remaining:  usage.remaining - 1,
            },
          });
        } catch (error) {
          // Never include error details (stack, query, file path) in SSE output.
          console.error("[shield/scan] Stream error:", error instanceof Error ? error.message : "unknown");
          emit({ type: "error", message: "An unexpected error occurred. Please try again." });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[shield/scan] ERROR:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
