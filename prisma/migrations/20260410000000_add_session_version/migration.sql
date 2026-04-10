-- Add sessionVersion to User table.
-- Incrementing this value on password change invalidates all existing JWTs
-- whose stamped version no longer matches the DB value.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "sessionVersion" INTEGER NOT NULL DEFAULT 0;
