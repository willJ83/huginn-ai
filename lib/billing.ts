import { prisma } from "@/lib/prisma";
import { SubscriptionStatus, UserPlan } from "@prisma/client";

export const PLAN_LIMITS = {
  FREE: 3,
  PRO: Infinity,
  UNLIMITED: Infinity,
} as const;

export async function getUserPlan(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
    },
  });

  if (!user) {
    // User record missing (e.g. DB reset with stale JWT) — treat as free plan
    return {
      plan: "FREE" as UserPlan,
      subscriptionStatus: "INACTIVE" as SubscriptionStatus,
      currentPeriodEnd: null,
    };
  }

  return user;
}

export function hasUnlimitedAnalysisAccess(user: {
  plan: UserPlan;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd?: Date | null;
}) {
  const now = new Date();
  const isWithinCanceledGracePeriod =
    user.subscriptionStatus === SubscriptionStatus.CANCELED &&
    !!user.currentPeriodEnd &&
    user.currentPeriodEnd > now;

  return (
    (user.plan === UserPlan.PRO || user.plan === UserPlan.UNLIMITED) &&
    (user.subscriptionStatus === SubscriptionStatus.ACTIVE ||
      isWithinCanceledGracePeriod)
  );
}

export async function getMonthlyUsageCount(
  userId: string,
  action = "huginn_analysis"
) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return prisma.usageRecord.count({
    where: {
      userId,
      action,
      createdAt: {
        gte: startOfMonth,
      },
    },
  });
}

export async function canUseFeature(
  userId: string,
  action = "huginn_analysis"
) {
  const user = await getUserPlan(userId);

  if (hasUnlimitedAnalysisAccess(user)) {
    return {
      allowed: true,
      plan: user.plan,
      remaining: Infinity,
    };
  }

  const used = await getMonthlyUsageCount(userId, action);
  const limit = PLAN_LIMITS.FREE;

  return {
    allowed: used < limit,
    plan: UserPlan.FREE,
    remaining: Math.max(0, limit - used),
  };
}

export async function recordUsage(
  userId: string,
  action = "huginn_analysis"
) {
  await prisma.usageRecord.create({
    data: {
      userId,
      action,
    },
  });
}
