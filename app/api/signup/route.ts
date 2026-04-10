import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp, rateLimitExceeded, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // ── Rate limit: 3 signups per hour per IP ───────────────────────────────────
  const ip = getClientIp(req);
  const { allowed, resetAt } = await checkRateLimit(`signup:${ip}`, RATE_LIMITS.signup);
  if (!allowed) return rateLimitExceeded(resetAt);

  try {
    const body = await req.json();
    const { name, email, password } = body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Enter an email and password." },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Account already exists. Log in instead." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        password: hashedPassword,
        email: email.toLowerCase().trim(),
        name: typeof name === "string" ? name.trim().slice(0, 100) : undefined,
        plan: "FREE",
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[signup] Error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(
      { error: "Account creation didn't go through. Try again." },
      { status: 500 }
    );
  }
}
