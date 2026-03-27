import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { runDeterministicExtraction } from "../../lib/riskEngine";
import { HUGINN_V2_PROMPT } from "../../lib/huginnPrompt";
import type { ProductTemplate } from "../../lib/productConfigs";
import { auth } from "@/lib/auth";
import { canUseFeature, recordUsage } from "@/lib/billing";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface ClauseEntry {
  status: "found" | "missing";
  text?: string;
  location?: string;
}

async function runClaudePipeline(
  contractText: string,
  template: ProductTemplate,
  deterministicResult: any
): Promise<string | null> {
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

    // STAGE 3 — ANALYZE
    console.log("[Pipeline] Stage 3: Running final analysis...");
    const analyzeMsg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
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
    const match = analyzeText.match(
      /Summary:\s*([\s\S]*?)(?:Explanation:|Recommended Action:|$)/i
    );
    const summary = match?.[1]?.trim() || analyzeText.trim() || null;
    console.log(`[Pipeline] Stage 3 complete. Summary length: ${summary?.length ?? 0} chars`);
    return summary;
  } catch (err) {
    console.error("[Pipeline] ERROR — pipeline failed, falling back to deterministic:", err);
    return null;
  }
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
      return NextResponse.json(
        {
          ok: false,
          error: "Free scan limit reached.",
          remaining: 0,
        },
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

    const result = runDeterministicExtraction({
      text,
      template: activeTemplate,
      config: config ?? {},
    });

    if ("error" in result) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    const aiSummary = await runClaudePipeline(text, activeTemplate, result);
    const summary = aiSummary ?? result.summary ?? "";

    // Record usage only after successful analysis generation.
    await recordUsage(session.user.id, "huginn_analysis");

    const saved = await prisma.analysis.create({
      data: {
        userId: session.user.id,
        fileName: fileName ?? null,
        template: activeTemplate,
        product: result.product,
        label: result.label,
        description: result.description,
        documentType: result.documentType,
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        summary,
        matchedKeywords: result.matchedKeywords as any,
        missingRequiredKeywords: result.missingRequiredKeywords as any,
        forbiddenKeywordHits: result.forbiddenKeywordHits as any,
        issues: result.issues as any,
        deadlines: result.deadlines as any,
        metadata: result.metadata as any,
      },
    });

    return NextResponse.json({
      id: saved.id,
      riskScore: result.riskScore ?? 0,
      summary,
      issues: result.issues ?? [],
      deadlines: result.deadlines ?? [],
      riskLevel: result.riskLevel,
      label: result.label,
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
