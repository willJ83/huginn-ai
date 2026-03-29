-- Add STARTER to UserPlan enum
ALTER TYPE "UserPlan" ADD VALUE IF NOT EXISTS 'STARTER';

-- Add new fields to User table
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "addonAnalysesRemaining" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "billingCycleStart" TIMESTAMP(3);

-- Update default plan for new users to STARTER
ALTER TABLE "User" ALTER COLUMN "plan" SET DEFAULT 'STARTER';

-- Migrate existing FREE users: they remain FREE but will be redirected to select a plan
-- (billing logic treats FREE as requiring plan selection)
