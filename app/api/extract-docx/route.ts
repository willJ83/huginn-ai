import mammoth from "mammoth";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit, rateLimitExceeded, RATE_LIMITS } from "@/lib/rate-limit";
import { validateDOCX } from "@/lib/file-validation";

export async function POST(req: Request) {
  // ── Auth gate ───────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // ── Rate limit: shared extract bucket with PDF/image ────────────────────────
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
    const validation = await validateDOCX(file);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const result = await mammoth.extractRawText({ buffer: validation.buffer });

    return NextResponse.json(
      { text: result.value },
      { headers: { "X-RateLimit-Remaining": String(remaining) } }
    );
  } catch (error) {
    console.error("[extract-docx] Parse error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "Failed to read the document. Make sure it is a valid .docx file." },
      { status: 500 }
    );
  }
}
