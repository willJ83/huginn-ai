-- Change default plan from STARTER to FREE for new users
ALTER TABLE "User" ALTER COLUMN "plan" SET DEFAULT 'FREE';
