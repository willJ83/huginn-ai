import { NextResponse } from "next/server";
import { runDeterministicExtraction } from "../../lib/riskEngine";
import type { ProductTemplate } from "../../lib/productConfigs";
import { auth } from "@/lib/auth";
import { canUseFeature, recordUsage } from "@/lib/billing";
import { prisma } from "@/lib/prisma";

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

    const result = runDeterministicExtraction({
      text,
      template: (template as ProductTemplate) ?? "compliance_checker",
      config: config ?? {},
    });

    if ("error" in result) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    // Record usage only after successful analysis generation.
    await recordUsage(session.user.id, "huginn_analysis");

    const saved = await prisma.analysis.create({
      data: {
        userId: session.user.id,
        fileName: fileName ?? null,
        template: (template as ProductTemplate) ?? "compliance_checker",
        product: result.product,
        label: result.label,
        description: result.description,
        documentType: result.documentType,
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        summary: result.summary ?? "",
        matchedKeywords: result.matchedKeywords,
        missingRequiredKeywords: result.missingRequiredKeywords,
        forbiddenKeywordHits: result.forbiddenKeywordHits,
        issues: result.issues,
        deadlines: result.deadlines,
        metadata: result.metadata,
      },
    });

    return NextResponse.json({
      id: saved.id,
      riskScore: result.riskScore ?? 0,
      summary: result.summary ?? "No summary available.",
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
