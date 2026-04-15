import { NextResponse } from "next/server";
import { getProModel, parseGeminiJSON } from "@/lib/gemini";
import { runDeterministicExtraction } from "../../lib/riskEngine";
import { HUGINN_V2_PROMPT, SHIELD_JURISDICTION_STAGE_PROMPT } from "../../lib/huginnPrompt";
import type { ProductTemplate } from "../../lib/productConfigs";
import { auth } from "@/lib/auth";
import { canUseFeature, consumeAddonAnalysis, recordUsage, getUsageCountSince } from "@/lib/billing";
import { prisma } from "@/lib/prisma";

interface ClauseEntry {
  status: "found" | "missing";
  text?: string;
  location?: string;
}

interface AnalysisIssue {
  id: string;
  label: string;
  severity: string;
  clauseReference?: string;
  message?: string;
  explanation?: string;
  recommendation?: string;
  matches?: string[];
}

interface AnalysisMissingProtection {
  label: string;
  severity: string;
  explanation?: string;
  recommendation?: string;
}

interface AnalysisDeadline {
  label: string;
  value?: string;
  description?: string;
}

interface AnalysisResult {
  riskScore: number;
  summary: string;
  issues: AnalysisIssue[];
  missingProtections: AnalysisMissingProtection[];
  deadlines: AnalysisDeadline[];
}

async function runGeminiPipeline(
  contractText: string,
  template: ProductTemplate,
  deterministicResult: any
): Promise<{ result: AnalysisResult; contractType: string } | null> {
  console.log("[Pipeline] Starting 3-stage Gemini pipeline...");
  try {
    // STAGE 1 — CLASSIFY
    console.log("[Pipeline] Stage 1: Classifying contract type...");
    const classifyModel = getProModel(undefined, 512);
    const classifyResult = await classifyModel.generateContent(
      `Identify the contract type from this list: Master Service Agreement, Statement of Work, NDA, SLA, Independent Contractor Agreement, Licensing Agreement, SaaS Subscription Agreement, Terms of Service, Data Processing Agreement, Vendor Agreement, Purchase Agreement, Partnership Agreement, Employment Agreement, Consulting Agreement, Marketing Services Agreement, Software Development Agreement, Maintenance & Support Agreement, Reseller Agreement, Franchise Agreement, Amendment/Addendum. Return JSON only: { "type": string, "confidence": string, "rationale": string }\n\nContract text:\n${contractText}`
    );

    let contractType: { type: string; confidence: string; rationale: string } =
      { type: "Unknown", confidence: "low", rationale: "" };
    const parsedClassify = parseGeminiJSON<typeof contractType>(classifyResult.response.text());
    if (parsedClassify) contractType = parsedClassify;
    console.log(`[Pipeline] Stage 1 complete: ${contractType.type} (${contractType.confidence})`);

    // STAGE 2 — EXTRACT
    console.log("[Pipeline] Stage 2: Extracting clauses...");
    const extractModel = getProModel(undefined, 4096);
    const extractResult = await extractModel.generateContent(
      `This is a ${contractType.type}. Extract all clauses present and flag any missing. Categories: confidentiality, indemnification, limitation_of_liability, ip_ownership, payment_terms, termination, renewal, governing_law, warranties, data_protection, service_levels, deliverables, non_compete, non_solicit, insurance, dispute_resolution, audit_rights, royalties, support. For each: status (found/missing), exact text, location in document. Return JSON only.\n\nContract text:\n${contractText}`
    );

    let extractedClauses: Record<string, ClauseEntry> = {};
    const parsedExtract = parseGeminiJSON<Record<string, ClauseEntry>>(extractResult.response.text());
    if (parsedExtract) extractedClauses = parsedExtract;
    console.log(`[Pipeline] Stage 2 complete: ${Object.keys(extractedClauses).length} clauses extracted`);

    // STAGE 3 — ANALYZE (returns full structured JSON)
    console.log("[Pipeline] Stage 3: Running final analysis...");
    const analyzeModel = getProModel(HUGINN_V2_PROMPT, 8192);
    const analyzeResult = await analyzeModel.generateContent(
      `Contract Type: ${contractType.type} (Confidence: ${contractType.confidence})\nRationale: ${contractType.rationale}\n\nExtracted Clauses:\n${JSON.stringify(extractedClauses, null, 2)}\n\nDeterministic Findings:\n${JSON.stringify(deterministicResult, null, 2)}\n\nFull contract text:\n${contractText}`
    );

    const parsed = parseGeminiJSON<AnalysisResult>(analyzeResult.response.text());
    if (!parsed || typeof parsed.riskScore !== "number" || !parsed.summary) {
      console.error("[Pipeline] Stage 3: parsed JSON missing required fields");
      return null;
    }

    console.log(
      `[Pipeline] Stage 3 complete. Score: ${parsed.riskScore}, Issues: ${parsed.issues?.length ?? 0}, Missing: ${parsed.missingProtections?.length ?? 0}, Deadlines: ${parsed.deadlines?.length ?? 0}`
    );
    return { result: parsed, contractType: contractType.type };
  } catch (err) {
    console.error("[Pipeline] ERROR — pipeline failed, falling back to deterministic:", err instanceof Error ? err.message : "unknown");
    return null;
  }
}

// ─── Stage 4: Jurisdiction Analysis (Shield Deep only) ────────────────────────

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
  idChecklist?: JurisdictionChecklistItem[];
  gaChecklist?: JurisdictionChecklistItem[];
  waChecklist?: JurisdictionChecklistItem[];
  utChecklist?: JurisdictionChecklistItem[];
  azChecklist?: JurisdictionChecklistItem[];
  tnChecklist?: JurisdictionChecklistItem[];
  ilChecklist?: JurisdictionChecklistItem[];
  coChecklist?: JurisdictionChecklistItem[];
  nvChecklist?: JurisdictionChecklistItem[];
  vaChecklist?: JurisdictionChecklistItem[];
  paChecklist?: JurisdictionChecklistItem[];
  orChecklist?: JurisdictionChecklistItem[];
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
    const isID = /\bid\b|idaho/i.test(jurisdiction);
    const isGA = /\bga\b|georgia/i.test(jurisdiction);
    const isWA = /\bwa\b|washington/i.test(jurisdiction);
    const isUT = /\but\b|utah/i.test(jurisdiction);
    const isAZ = /\baz\b|arizona/i.test(jurisdiction);
    const isTN = /\btn\b|tennessee/i.test(jurisdiction);
    const isIL = /\bil\b|illinois/i.test(jurisdiction);
    const isCO = /\bco\b|colorado/i.test(jurisdiction);
    const isNV = /\bnv\b|nevada/i.test(jurisdiction);
    const isVA = /\bva\b|virginia/i.test(jurisdiction);
    const isPA = /\bpa\b|pennsylvania/i.test(jurisdiction);
    const isOR = /\bor\b|oregon/i.test(jurisdiction);
    const isFinancing = /financ|loan|merchant\s*cash|advance|lending|credit\s*agree|borrow|installment/i.test(contractType);

    const ALL_CHECKLISTS = "floridaChecklist, californiaChecklist, texasChecklist, scChecklist, ncChecklist, idChecklist, gaChecklist, waChecklist, utChecklist, azChecklist, tnChecklist, ilChecklist, coChecklist, nvChecklist, vaChecklist, paChecklist, orChecklist";
    const stateInstruction = isFL && isFinancing
      ? `\n\nThe user's jurisdiction IS Florida and this is a financing/lending contract. You MUST include the floridaChecklist array in your JSON. Omit all other state checklists (${ALL_CHECKLISTS.replace("floridaChecklist, ", "")}).`
      : isFL
      ? `\n\nThe user's jurisdiction IS Florida but this contract is NOT a financing instrument. Do NOT include a floridaChecklist — §559.9613 does not apply. Omit all other state checklists (${ALL_CHECKLISTS.replace("floridaChecklist, ", "")}).`
      : isCA
      ? `\n\nThe user's jurisdiction IS California. You MUST include the californiaChecklist array in your JSON. Omit all other state checklists (${ALL_CHECKLISTS.replace("californiaChecklist, ", "")}).`
      : isTX
      ? `\n\nThe user's jurisdiction IS Texas. You MUST include the texasChecklist array in your JSON. Omit all other state checklists (${ALL_CHECKLISTS.replace("texasChecklist, ", "")}).`
      : isSC
      ? `\n\nThe user's jurisdiction IS South Carolina. You MUST include the scChecklist array in your JSON. Omit all other state checklists (${ALL_CHECKLISTS.replace("scChecklist, ", "")}).`
      : isNC
      ? `\n\nThe user's jurisdiction IS North Carolina. You MUST include the ncChecklist array in your JSON. Omit all other state checklists (${ALL_CHECKLISTS.replace("ncChecklist, ", "")}).`
      : isID
      ? `\n\nThe user's jurisdiction IS Idaho. You MUST include the idChecklist array in your JSON. Omit all other state checklists (${ALL_CHECKLISTS.replace("idChecklist, ", "")}).`
      : isGA
      ? `\n\nThe user's jurisdiction IS Georgia. You MUST include the gaChecklist array in your JSON. Omit all other state checklists (${ALL_CHECKLISTS.replace("gaChecklist, ", "")}).`
      : isWA
      ? `\n\nThe user's jurisdiction IS Washington. You MUST include the waChecklist array in your JSON. Omit all other state checklists (${ALL_CHECKLISTS.replace("waChecklist, ", "")}).`
      : isUT
      ? `\n\nThe user's jurisdiction IS Utah. You MUST include the utChecklist array in your JSON. Omit all other state checklists (${ALL_CHECKLISTS.replace("utChecklist, ", "")}).`
      : isAZ
      ? `\n\nThe user's jurisdiction IS Arizona. You MUST include the azChecklist array in your JSON. Omit all other state checklists (${ALL_CHECKLISTS.replace("azChecklist, ", "")}).`
      : isTN
      ? `\n\nThe user's jurisdiction IS Tennessee. You MUST include the tnChecklist array in your JSON. Omit all other state checklists (${ALL_CHECKLISTS.replace("tnChecklist, ", "")}).`
      : isIL
      ? `\n\nThe user's jurisdiction IS Illinois. You MUST include the ilChecklist array in your JSON. Omit all other state checklists (${ALL_CHECKLISTS.replace("ilChecklist, ", "")}).`
      : isCO
      ? `\n\nThe user's jurisdiction IS Colorado. You MUST include the coChecklist array in your JSON. Omit all other state checklists (${ALL_CHECKLISTS.replace("coChecklist, ", "")}).`
      : isNV
      ? `\n\nThe user's jurisdiction IS Nevada. You MUST include the nvChecklist array in your JSON. Omit all other state checklists (${ALL_CHECKLISTS.replace("nvChecklist, ", "")}).`
      : isVA
      ? `\n\nThe user's jurisdiction IS Virginia. You MUST include the vaChecklist array in your JSON. Omit all other state checklists (${ALL_CHECKLISTS.replace("vaChecklist, ", "")}).`
      : isPA
      ? `\n\nThe user's jurisdiction IS Pennsylvania. You MUST include the paChecklist array in your JSON. Omit all other state checklists (${ALL_CHECKLISTS.replace("paChecklist, ", "")}).`
      : isOR
      ? `\n\nThe user's jurisdiction IS Oregon. You MUST include the orChecklist array in your JSON. Omit all other state checklists (${ALL_CHECKLISTS.replace("orChecklist, ", "")}).`
      : `\n\nThe user's jurisdiction does not require a state-specific checklist. Omit all state checklist arrays (${ALL_CHECKLISTS}) entirely.`;

    const model = getProModel(SHIELD_JURISDICTION_STAGE_PROMPT, 1024);
    const result = await model.generateContent(
      `User's selected jurisdiction: ${jurisdiction}${stateInstruction}\n\nFull contract text:\n${contractText}`
    );

    return parseGeminiJSON<JurisdictionAnalysis>(result.response.text());
  } catch (err) {
    console.error("[Jurisdiction Stage] ERROR:", err instanceof Error ? err.message : "unknown");
    return null;
  }
}

function deriveRiskLevel(score: number): string {
  if (score >= 80) return "low";
  if (score >= 50) return "medium";
  return "high";
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

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

    const body = await req.json();
    const { text, template, config, fileName, scanMode, jurisdiction } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { ok: false, error: "Missing contract text." },
        { status: 400 }
      );
    }

    // ── Shield Deep Scan eligibility gate ────────────────────────────────────
    // Checked early — before any Gemini calls — so no quota is consumed if blocked.
    // Allowed: Pro plan, active add-on analyses, or < 2 lifetime deep scans (trial).
    if (scanMode === "shield_deep" && jurisdiction && typeof jurisdiction === "string") {
      const isPro = usage.plan === "PRO" || usage.plan === "UNLIMITED";
      const hasAddon = usage.addonRemaining > 0;

      if (!isPro && !hasAddon) {
        const lifetimeDeepScans = await getUsageCountSince(
          session.user.id,
          new Date(0),
          "shield_deep"
        );
        if (lifetimeDeepScans >= 2) {
          return NextResponse.json(
            {
              ok: false,
              error:
                "Deep Scan requires a Pro plan. You've used both free Deep Scan trials — upgrade to Pro for unlimited jurisdiction analysis.",
              code: "shield_deep_upgrade_required",
            },
            { status: 403 }
          );
        }
      }
    }

    const activeTemplate = (template as ProductTemplate) ?? "compliance_checker";

    const deterministicResult = runDeterministicExtraction({
      text,
      template: activeTemplate,
      config: config ?? {},
    });

    if ("error" in deterministicResult) {
      return NextResponse.json(
        { ok: false, error: deterministicResult.error },
        { status: 400 }
      );
    }

    const pipelineResult = await runGeminiPipeline(text, activeTemplate, deterministicResult);
    const geminiResult = pipelineResult?.result ?? null;
    const geminiContractType = pipelineResult?.contractType ?? "Unknown";

    // Merge missingProtections into issues as "missing" severity cards
    const missingAsIssues = (geminiResult?.missingProtections ?? []).map(
      (mp, i): AnalysisIssue => ({
        id: `missing-${i}`,
        label: mp.label,
        severity: "missing",
        explanation: mp.explanation,
        recommendation: mp.recommendation,
        matches: [],
      })
    );

    const finalIssues = geminiResult
      ? [...(geminiResult.issues ?? []), ...missingAsIssues]
      : deterministicResult.issues ?? [];

    const finalRiskScore = geminiResult?.riskScore ?? deterministicResult.riskScore ?? 0;
    const finalSummary   = geminiResult?.summary ?? deterministicResult.summary ?? "";
    const finalDeadlines = geminiResult ? (geminiResult.deadlines ?? []) : (deterministicResult.deadlines ?? []);
    const finalRiskLevel = geminiResult ? deriveRiskLevel(geminiResult.riskScore) : deterministicResult.riskLevel;

    await recordUsage(session.user.id, "huginn_analysis");

    // If this analysis came from the add-on quota, decrement it
    if (usage.planRemaining === 0 && usage.addonRemaining > 0) {
      await consumeAddonAnalysis(session.user.id);
    }

    // Stage 4 — Jurisdiction Analysis (Shield Deep only, non-blocking)
    // Eligibility already verified above; record shield_deep usage for trial tracking.
    let jurisdictionAnalysis: JurisdictionAnalysis | null = null;
    if (scanMode === "shield_deep" && jurisdiction && typeof jurisdiction === "string") {
      jurisdictionAnalysis = await runJurisdictionStage(text, jurisdiction, geminiContractType);
      await recordUsage(session.user.id, "shield_deep");
    }

    const baseMetadata = (deterministicResult.metadata && typeof deterministicResult.metadata === "object")
      ? deterministicResult.metadata
      : {};
    const finalMetadata = jurisdictionAnalysis
      ? { ...baseMetadata, jurisdictionAnalysis, jurisdiction, contractType: geminiContractType }
      : baseMetadata;

    const saved = await prisma.analysis.create({
      data: {
        userId: session.user.id,
        fileName: fileName ?? null,
        template: activeTemplate,
        product: deterministicResult.product,
        label: deterministicResult.label,
        description: deterministicResult.description,
        documentType: deterministicResult.documentType,
        riskScore: finalRiskScore,
        riskLevel: finalRiskLevel,
        summary: finalSummary,
        matchedKeywords: deterministicResult.matchedKeywords as any,
        missingRequiredKeywords: deterministicResult.missingRequiredKeywords as any,
        forbiddenKeywordHits: deterministicResult.forbiddenKeywordHits as any,
        issues: finalIssues as any,
        deadlines: finalDeadlines as any,
        metadata: finalMetadata as any,
      },
    });

    return NextResponse.json({
      id: saved.id,
      riskScore: finalRiskScore,
      summary: finalSummary,
      issues: finalIssues,
      deadlines: finalDeadlines,
      riskLevel: finalRiskLevel,
      label: deterministicResult.label,
      fileName: fileName ?? null,
      ...(jurisdictionAnalysis ? { jurisdictionAnalysis } : {}),
    });
  } catch (error) {
    console.error("ANALYZE ROUTE ERROR:", error instanceof Error ? error.message : "unknown");

    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
