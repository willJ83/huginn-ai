import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { runDeterministicExtraction } from "../../lib/riskEngine";
import { HUGINN_V2_PROMPT } from "../../lib/huginnPrompt";
import type { ProductTemplate } from "../../lib/productConfigs";
import { auth } from "@/lib/auth";
import { canUseFeature, consumeAddonAnalysis, recordUsage } from "@/lib/billing";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface ClauseEntry {
  status: "found" | "missing";
  text?: string;
  location?: string;
}

interface ClaudeIssue {
  id: string;
  label: string;
  severity: string;
  clauseReference?: string;
  message?: string;
  explanation?: string;
  recommendation?: string;
  matches?: string[];
}

interface ClaudeMissingProtection {
  label: string;
  severity: string;
  explanation?: string;
  recommendation?: string;
}

interface ClaudeDeadline {
  label: string;
  value?: string;
  description?: string;
}

interface ClaudeResult {
  riskScore: number;
  summary: string;
  issues: ClaudeIssue[];
  missingProtections: ClaudeMissingProtection[];
  deadlines: ClaudeDeadline[];
}

async function runClaudePipeline(
  contractText: string,
  template: ProductTemplate,
  deterministicResult: any
): Promise<ClaudeResult | null> {
  console.log("[Pipeline] Starting 3-stage Claude pipeline...");
  try {
    // STAGE 1 — CLASSIFY
    console.log("[Pipeline] Stage 1: Classifying contract type...");
    const classifyMsg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content:
            `Identify the contract type from this list: Master Service Agreement, Statement of Work, NDA, SLA, Independent Contractor Agreement, Licensing Agreement, SaaS Subscription Agreement, Terms of Service, Data Processing Agreement, Vendor Agreement, Purchase Agreement, Partnership Agreement, Employment Agreement, Consulting Agreement, Marketing Services Agreement, Software Development Agreement, Maintenance & Support Agreement, Reseller Agreement, Franchise Agreement, Amendment/Addendum. Return JSON only: { "type": string, "confidence": string, "rationale": string }\n\nContract text:\n${contractText}`,
        },
      ],
    });

    let contractType: { type: string; confidence: string; rationale: string } =
      { type: "Unknown", confidence: "low", rationale: "" };
    const classifyText =
      classifyMsg.content[0]?.type === "text" ? classifyMsg.content[0].text : "";
    const classifyJson = classifyText.match(/\{[\s\S]*\}/);
    if (classifyJson) {
      try {
        contractType = JSON.parse(classifyJson[0]);
      } catch {
        // keep default
      }
    }
    console.log(`[Pipeline] Stage 1 complete: ${contractType.type} (${contractType.confidence})`);

    // STAGE 2 — EXTRACT
    console.log("[Pipeline] Stage 2: Extracting clauses...");
    const extractMsg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content:
            `This is a ${contractType.type}. Extract all clauses present and flag any missing. Categories: confidentiality, indemnification, limitation_of_liability, ip_ownership, payment_terms, termination, renewal, governing_law, warranties, data_protection, service_levels, deliverables, non_compete, non_solicit, insurance, dispute_resolution, audit_rights, royalties, support. For each: status (found/missing), exact text, location in document. Return JSON only.\n\nContract text:\n${contractText}`,
        },
      ],
    });

    let extractedClauses: Record<string, ClauseEntry> = {};
    const extractText =
      extractMsg.content[0]?.type === "text" ? extractMsg.content[0].text : "";
    const extractJson = extractText.match(/\{[\s\S]*\}/);
    if (extractJson) {
      try {
        extractedClauses = JSON.parse(extractJson[0]);
      } catch {
        // keep default
      }
    }
    console.log(`[Pipeline] Stage 2 complete: ${Object.keys(extractedClauses).length} clauses extracted`);

    // STAGE 3 — ANALYZE (returns full structured JSON)
    console.log("[Pipeline] Stage 3: Running final analysis...");
    const analyzeMsg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: HUGINN_V2_PROMPT,
      messages: [
        {
          role: "user",
          content:
            `Contract Type: ${contractType.type} (Confidence: ${contractType.confidence})\nRationale: ${contractType.rationale}\n\nExtracted Clauses:\n${JSON.stringify(extractedClauses, null, 2)}\n\nDeterministic Findings:\n${JSON.stringify(deterministicResult, null, 2)}\n\nFull contract text:\n${contractText}`,
        },
      ],
    });

    const analyzeText =
      analyzeMsg.content[0]?.type === "text" ? analyzeMsg.content[0].text : "";

    // Strip markdown fences if Claude wrapped the JSON
    const stripped = analyzeText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[Pipeline] Stage 3: no JSON object found in response");
      return null;
    }

    const parsed: ClaudeResult = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (typeof parsed.riskScore !== "number" || !parsed.summary) {
      console.error("[Pipeline] Stage 3: parsed JSON missing required fields");
      return null;
    }

    console.log(
      `[Pipeline] Stage 3 complete. Score: ${parsed.riskScore}, Issues: ${parsed.issues?.length ?? 0}, Missing: ${parsed.missingProtections?.length ?? 0}, Deadlines: ${parsed.deadlines?.length ?? 0}`
    );
    return parsed;
  } catch (err) {
    console.error("[Pipeline] ERROR — pipeline failed, falling back to deterministic:", err);
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
        : usage.needsPlan
        ? "Please select a plan to run analyses."
        : "You've used all your analyses this month. Buy more or upgrade your plan.";

      return NextResponse.json(
        { ok: false, error: errorMessage, remaining: 0 },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { text, template, config, fileName } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { ok: false, error: "Missing contract text." },
        { status: 400 }
      );
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

    const claudeResult = await runClaudePipeline(text, activeTemplate, deterministicResult);

    // Merge missingProtections into issues as "missing" severity cards
    const missingAsIssues = (claudeResult?.missingProtections ?? []).map(
      (mp, i): ClaudeIssue => ({
        id: `missing-${i}`,
        label: mp.label,
        severity: "missing",
        explanation: mp.explanation,
        recommendation: mp.recommendation,
        matches: [],
      })
    );

    const finalIssues = claudeResult
      ? [...(claudeResult.issues ?? []), ...missingAsIssues]
      : deterministicResult.issues ?? [];

    const finalRiskScore = claudeResult?.riskScore ?? deterministicResult.riskScore ?? 0;
    const finalSummary = claudeResult?.summary ?? deterministicResult.summary ?? "";
    const finalDeadlines = claudeResult ? (claudeResult.deadlines ?? []) : (deterministicResult.deadlines ?? []);
    const finalRiskLevel = claudeResult ? deriveRiskLevel(claudeResult.riskScore) : deterministicResult.riskLevel;

    await recordUsage(session.user.id, "huginn_analysis");

    // If this analysis came from the add-on quota, decrement it
    if (usage.planRemaining === 0 && usage.addonRemaining > 0) {
      await consumeAddonAnalysis(session.user.id);
    }

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
        metadata: deterministicResult.metadata as any,
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
    });
  } catch (error) {
    console.error("ANALYZE ROUTE ERROR:", error);

    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
