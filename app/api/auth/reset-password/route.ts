import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, rateLimitExceeded, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // ── Rate limit: 5 attempts per hour per IP ──────────────────────────────────
  // Prevents token-stuffing: an attacker who has guessed a reset link still
  // can't brute-force the password field with many rapid requests.
  const ip = getClientIp(req);
  const { allowed, resetAt } = await checkRateLimit(
    `reset:${ip}`,
    RATE_LIMITS.resetPassword
  );
  if (!allowed) return rateLimitExceeded(resetAt);

  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Use at least 8 characters for your new password." },
        { status: 400 }
      );
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { token } });
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
    });

    if (!user) {
      await prisma.passwordResetToken.delete({ where: { token } });
      return NextResponse.json(
        { error: "We couldn't find an active account for this reset link." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password + increment sessionVersion in one atomic operation.
    // This invalidates every active session on every device — the user must
    // log in again with their new credentials.
    await prisma.user.update({
      where: { email: resetToken.email },
      data: {
        password: hashedPassword,
        sessionVersion: { increment: 1 },
      },
    });

    await prisma.passwordResetToken.delete({ where: { token } });

    return NextResponse.json({
      message: "Your password has been reset successfully.",
    });
  } catch (error) {
    console.error("[reset-password] Error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "We couldn't reset your password right now. Please try again." },
      { status: 500 }
    );
  }
}
