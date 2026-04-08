import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type AllowedMediaType = (typeof ALLOWED_TYPES)[number];

const MAX_BYTES = 4.5 * 1024 * 1024; // 4.5 MB — stays safely under Anthropic's 5 MB limit

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type as AllowedMediaType)) {
      return NextResponse.json(
        { error: "Please upload a JPG, PNG, or WebP image." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image is too large. Please use an image under 4.5 MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

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
                media_type: file.type as AllowedMediaType,
                data: base64,
              },
            },
            {
              type: "text",
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

    return NextResponse.json({ text });
  } catch (err) {
    console.error("[extract-image] ERROR:", err);
    return NextResponse.json(
      { error: "Image extraction failed. Please try again." },
      { status: 500 }
    );
  }
}
