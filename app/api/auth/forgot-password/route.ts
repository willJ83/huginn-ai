import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
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

    // Always return success-looking response to avoid email enumeration
    if (!user) {
      return NextResponse.json({
        message: "If an account exists for that email, we'll send a reset link shortly.",
      });
    }

    // Delete old tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: normalizedEmail },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        email: normalizedEmail,
        token,
        expiresAt,
      },
    });

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    // Temporary launch-safe fallback until email sending is wired
    console.log("PASSWORD RESET URL:", resetUrl);

    return NextResponse.json({
      message: "If an account exists for that email, we'll send a reset link shortly.",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return NextResponse.json(
      { error: "We couldn't process that request right now. Please try again." },
      { status: 500 }
    );
  }
}
