-- Rate limit counters: one row per (key, window).
-- The composite primary key doubles as the unique constraint needed for
-- the ON CONFLICT … DO UPDATE atomic upsert in lib/rate-limit.ts.
CREATE TABLE "RateLimit" (
  key          TEXT        NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  count        INTEGER     NOT NULL DEFAULT 1,
  PRIMARY KEY (key, "windowStart")
);

CREATE INDEX "RateLimit_key_idx" ON "RateLimit" (key);
