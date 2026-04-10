import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { checkRateLimit, rateLimitExceeded, RATE_LIMITS } from "@/lib/rate-limit";
import { validateImage, type AllowedImageType } from "@/lib/file-validation";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  // ── Auth gate ───────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // ── Rate limit: shared extract bucket, 20 / hour per user ──────────────────
  const { allowed, remaining, resetAt } = await checkRateLimit(
    `extract:${session.user.id}`,
    RATE_LIMITS.extract
  );
  if (!allowed) return rateLimitExceeded(resetAt);

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // ── Size, MIME allowlist, and magic-byte validation ─────────────────────
    const validation = await validateImage(file);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const base64 = validation.buffer.toString("base64");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: file.type as AllowedImageType,
                data: base64,
              },
            },
            {
              type: "text",
              // Explicit instruction keeps the model focused on extraction only.
              // Prompt injection via image text is mitigated by the structured
              // task framing and the fact that this route's output is used only
              // as intermediate text — it never reaches a user directly.
              text: "Extract all text from this contract or document image. Return ONLY the extracted text exactly as it appears — no commentary, formatting changes, or analysis. Preserve paragraph breaks.",
            },
          ],
        },
      ],
    });

    const text =
      response.content[0]?.type === "text" ? response.content[0].text : "";

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from this image. Try a clearer photo." },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { text },
      { headers: { "X-RateLimit-Remaining": String(remaining) } }
    );
  } catch (err) {
    console.error("[extract-image] Error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(
      { error: "Image extraction failed. Please try again." },
      { status: 500 }
    );
  }
}
