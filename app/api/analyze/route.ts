import { NextResponse } from "next/server";
import OpenAI from "openai";
import { runDeterministicExtraction } from "../../lib/riskEngine";
import { buildAnalysisPrompt } from "../../lib/promptBuilder";
import type { ProductTemplate } from "../../lib/productConfigs";
import { auth } from "@/lib/auth";
import { canUseFeature, recordUsage } from "@/lib/billing";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateAISummary(
  template: ProductTemplate,
  deterministicResult: any
): Promise<string | null> {
  try {
    const prompt = buildAnalysisPrompt(template, deterministicResult);
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.4,
    });

    const text = response.choices[0]?.message?.content ?? "";
    const match = text.match(
      /Summary:\s*([\s\S]*?)(?:Explanation:|Recommended Action:|$)/i
    );
    return match?.[1]?.trim() || null;
  } catch {
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

    const aiSummary = await generateAISummary(activeTemplate, result);
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
      { ok: false, error: "Invalid request body." },
      { status: 500 }
    );
  }
}
