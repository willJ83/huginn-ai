import { NextResponse } from "next/server";
import { CanvasFactory, getData } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import { auth } from "@/lib/auth";
import { checkRateLimit, getClientIp, rateLimitExceeded, RATE_LIMITS } from "@/lib/rate-limit";
import { validatePDF } from "@/lib/file-validation";

PDFParse.setWorker(getData());

export async function POST(req: Request) {
  // ── Auth gate ───────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // ── Rate limit: per-user (authenticated), 20 extractions / hour ────────────
  const { allowed, remaining, resetAt } = await checkRateLimit(
    `extract:${session.user.id}`,
    RATE_LIMITS.extract
  );
  if (!allowed) return rateLimitExceeded(resetAt);

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    // ── Size + magic-byte validation ────────────────────────────────────────
    const validation = await validatePDF(file);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const parser = new PDFParse({
      data: validation.buffer,
      CanvasFactory,
    });

    const result = await parser.getText();

    return NextResponse.json(
      { text: result.text },
      { headers: { "X-RateLimit-Remaining": String(remaining) } }
    );
  } catch (error) {
    // Log internally but never expose file paths, stack traces, or buffer details.
    console.error("[extract-pdf] Parse error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "Failed to read the PDF. Make sure it is not password-protected." },
      { status: 500 }
    );
  }
}
