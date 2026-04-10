/**
 * lib/rate-limit.ts
 *
 * DB-backed fixed-window rate limiter using the existing Neon/Prisma connection.
 * No external services required.
 *
 * How it works:
 *   - Each limit bucket is keyed by an arbitrary string (e.g. "login:1.2.3.4").
 *   - Time is divided into fixed windows (e.g. 15 minutes).
 *   - A single Postgres row per (key, windowStart) stores the request count.
 *   - An atomic `ON CONFLICT … DO UPDATE` upsert increments the counter with
 *     no race conditions even under concurrent serverless invocations.
 *   - Old windows are deleted lazily after each check to keep the table lean.
 *
 * Upgrade path: swap the Prisma calls here for @upstash/ratelimit when you
 * need sub-millisecond checks or multi-region consistency.
 */

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ── Limit presets ─────────────────────────────────────────────────────────────

export const RATE_LIMITS = {
  /** Credential brute-force protection */
  login:          { limit: 5,  windowMs: 15 * 60 * 1_000 },  // 5  / 15 min
  /** Prevent account-creation spam */
  signup:         { limit: 3,  windowMs: 60 * 60 * 1_000 },  // 3  / hour
  /** Prevent email enumeration + reset-link spam */
  forgotPassword: { limit: 3,  windowMs: 60 * 60 * 1_000 },  // 3  / hour
  /** Prevent token-stuffing attacks on the reset endpoint */
  resetPassword:  { limit: 5,  windowMs: 60 * 60 * 1_000 },  // 5  / hour
  /** File extraction (PDF / DOCX / image) — costs CPU and Anthropic tokens */
  extract:        { limit: 20, windowMs: 60 * 60 * 1_000 },  // 20 / hour
  /** Basic scan — no billing quota, so needs its own guard */
  basicScan:      { limit: 15, windowMs: 60 * 60 * 1_000 },  // 15 / hour
  /** Deep scan — billing quota is the primary limit; this is a safety net */
  deepScan:       { limit: 10, windowMs: 60 * 60 * 1_000 },  // 10 / hour
  /** In-app password change */
  changePassword: { limit: 5,  windowMs: 60 * 60 * 1_000 },  // 5  / hour
} as const;

export type RateLimitKey = keyof typeof RATE_LIMITS;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

// ── Core function ─────────────────────────────────────────────────────────────

/**
 * Check-and-increment a rate limit counter.
 *
 * @param key      Arbitrary bucket identifier, e.g. "login:1.2.3.4"
 * @param config   { limit, windowMs } — use one of the RATE_LIMITS presets
 * @returns        { allowed, remaining, resetAt }
 */
export async function checkRateLimit(
  key: string,
  config: { limit: number; windowMs: number }
): Promise<RateLimitResult> {
  const now = Date.now();

  // Round down to the start of the current fixed window.
  const windowStart = new Date(Math.floor(now / config.windowMs) * config.windowMs);
  const resetAt = new Date(windowStart.getTime() + config.windowMs);

  // Atomic upsert: one DB round-trip, no TOCTOU race.
  // Prisma $queryRaw returns Postgres int4 as BigInt in some environments,
  // so we coerce with Number() to be safe.
  const rows = await prisma.$queryRaw<[{ count: bigint }]>`
    INSERT INTO "RateLimit" (key, "windowStart", count)
    VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT (key, "windowStart")
    DO UPDATE SET count = "RateLimit".count + 1
    RETURNING count
  `;

  const count = Number(rows[0]?.count ?? 1);
  const allowed = count <= config.limit;
  const remaining = Math.max(0, config.limit - count);

  // Lazy cleanup: delete windows older than 2× the current window duration.
  // Fire-and-forget — we don't block the response on this.
  const cleanupBefore = new Date(now - config.windowMs * 2);
  prisma.rateLimit
    .deleteMany({ where: { windowStart: { lt: cleanupBefore } } })
    .catch(() => {});

  return { allowed, remaining, resetAt };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extract the real client IP from request headers.
 * Vercel sets x-real-ip; other proxies use x-forwarded-for.
 * Falls back to "unknown" so rate limit keys are always valid strings.
 */
export function getClientIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}

/**
 * Build a standard 429 Too Many Requests response with Retry-After header.
 */
export function rateLimitExceeded(resetAt: Date): NextResponse {
  const retryAfterSecs = Math.ceil((resetAt.getTime() - Date.now()) / 1000);
  return NextResponse.json(
    { error: "Too many requests. Please wait a moment and try again." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSecs),
        "X-RateLimit-Reset": resetAt.toISOString(),
      },
    }
  );
}
