import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, rateLimitExceeded, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // ── Rate limit: 3 requests per hour per IP ──────────────────────────────────
  // Placed before the email lookup deliberately — we want to gate the
  // endpoint before any DB work, and before anything that could reveal
  // whether an email address is registered.
  const ip = getClientIp(req);
  const { allowed, resetAt } = await checkRateLimit(
    `forgot:${ip}`,
    RATE_LIMITS.forgotPassword
  );
  if (!allowed) return rateLimitExceeded(resetAt);

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Please enter your email address." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return the same response to prevent email enumeration.
    const successMsg = {
      message: "If an account exists for that email, we'll send a reset link shortly.",
    };

    if (!user) return NextResponse.json(successMsg);

    // Delete old tokens for this email before creating a new one.
    await prisma.passwordResetToken.deleteMany({
      where: { email: normalizedEmail },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.passwordResetToken.create({
      data: { email: normalizedEmail, token, expiresAt },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    // TODO: send email via your transactional email provider.
    // Until email is wired, log for local testing only.
    if (process.env.NODE_ENV !== "production") {
      console.log("[forgot-password] Reset URL:", resetUrl);
    }

    return NextResponse.json(successMsg);
  } catch (error) {
    console.error("[forgot-password] Error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "We couldn't process that request right now. Please try again." },
      { status: 500 }
    );
  }
}
