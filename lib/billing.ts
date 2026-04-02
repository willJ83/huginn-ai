import { prisma } from "@/lib/prisma";
import { SubscriptionStatus, UserPlan } from "@prisma/client";

export const PLAN_LIMITS = {
  FREE: 3,
  STARTER: 15,
  PRO: 70,
  // Legacy values — not used for new users
  TRIAL: 5,
  UNLIMITED: 70,
} as const;

export type UsageInfo = {
  allowed: boolean;
  plan: UserPlan;
  subscriptionStatus: SubscriptionStatus;
  inTrial: boolean;
  /** Analyses used in current period (trial or billing cycle) */
  periodUsed: number;
  /** Plan limit for the current period (not counting add-ons) */
  periodLimit: number;
  /** Remaining from plan quota alone */
  planRemaining: number;
  /** Remaining add-on analyses */
  addonRemaining: number;
  /** Total remaining = planRemaining + addonRemaining */
  remaining: number;
  /** True when subscription is inactive and user needs to select a plan */
  needsPlan: boolean;
  /** True when payment has failed */
  paymentFailed: boolean;
};

export async function getUserPlan(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
      trialEndsAt: true,
      addonAnalysesRemaining: true,
      billingCycleStart: true,
      createdAt: true,
    },
  });

  if (!user) {
    return {
      plan: "FREE" as UserPlan,
      subscriptionStatus: "INACTIVE" as SubscriptionStatus,
      currentPeriodEnd: null,
      trialEndsAt: null,
      addonAnalysesRemaining: 0,
      billingCycleStart: null,
      createdAt: new Date(),
    };
  }

  return user;
}

export function isInTrial(user: {
  trialEndsAt: Date | null;
  subscriptionStatus: SubscriptionStatus;
}): boolean {
  if (!user.trialEndsAt) return false;
  if (
    user.subscriptionStatus !== SubscriptionStatus.ACTIVE &&
    user.subscriptionStatus !== SubscriptionStatus.CANCELED
  ) {
    return false;
  }
  return new Date() < user.trialEndsAt;
}

export function getEffectivePlanLimit(plan: UserPlan): number {
  if (plan === UserPlan.PRO || plan === UserPlan.UNLIMITED) return PLAN_LIMITS.PRO;
  if (plan === UserPlan.STARTER) return PLAN_LIMITS.STARTER;
  return PLAN_LIMITS.FREE;
}

export async function getUsageCountSince(
  userId: string,
  since: Date,
  action = "huginn_analysis"
): Promise<number> {
  return prisma.usageRecord.count({
    where: {
      userId,
      action,
      createdAt: { gte: since },
    },
  });
}

/** @deprecated Use getUsageCountSince instead */
export async function getMonthlyUsageCount(
  userId: string,
  action = "huginn_analysis"
) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return getUsageCountSince(userId, startOfMonth, action);
}

export async function canUseFeature(
  userId: string,
  action = "huginn_analysis"
): Promise<UsageInfo> {
  const user = await getUserPlan(userId);
  const addonRemaining = user.addonAnalysesRemaining ?? 0;

  // Free tier: unsubscribed users on the FREE plan get 3 analyses (counted since account creation)
  if (user.subscriptionStatus === SubscriptionStatus.INACTIVE && user.plan === UserPlan.FREE) {
    const since = user.createdAt ?? new Date(0);
    const periodUsed = await getUsageCountSince(userId, since, action);
    const periodLimit = PLAN_LIMITS.FREE;
    const planRemaining = Math.max(0, periodLimit - periodUsed);
    return {
      allowed: planRemaining > 0,
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      inTrial: false,
      periodUsed,
      periodLimit,
      planRemaining,
      addonRemaining: 0,
      remaining: planRemaining,
      needsPlan: planRemaining === 0,
      paymentFailed: false,
    };
  }

  // No subscription set up yet (non-FREE plan somehow has no subscription)
  if (user.subscriptionStatus === SubscriptionStatus.INACTIVE) {
    return {
      allowed: false,
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      inTrial: false,
      periodUsed: 0,
      periodLimit: 0,
      planRemaining: 0,
      addonRemaining,
      remaining: addonRemaining,
      needsPlan: true,
      paymentFailed: false,
    };
  }

  // Payment failed
  if (user.subscriptionStatus === SubscriptionStatus.PAST_DUE) {
    return {
      allowed: false,
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      inTrial: false,
      periodUsed: 0,
      periodLimit: 0,
      planRemaining: 0,
      addonRemaining,
      remaining: addonRemaining,
      needsPlan: false,
      paymentFailed: true,
    };
  }

  const inTrial = isInTrial(user);

  if (inTrial) {
    // Trial period: limit = 5, count from trial start (30 days before trialEndsAt)
    const trialStart = new Date(user.trialEndsAt!.getTime() - 30 * 24 * 60 * 60 * 1000);
    const periodUsed = await getUsageCountSince(userId, trialStart, action);
    const periodLimit = PLAN_LIMITS.TRIAL;
    const planRemaining = Math.max(0, periodLimit - periodUsed);
    const remaining = planRemaining + addonRemaining;

    return {
      allowed: remaining > 0,
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      inTrial: true,
      periodUsed,
      periodLimit,
      planRemaining,
      addonRemaining,
      remaining,
      needsPlan: false,
      paymentFailed: false,
    };
  }

  // Post-trial or direct subscription
  const cycleStart =
    user.billingCycleStart ??
    new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const periodUsed = await getUsageCountSince(userId, cycleStart, action);
  const periodLimit = getEffectivePlanLimit(user.plan);
  const planRemaining = Math.max(0, periodLimit - periodUsed);
  const remaining = planRemaining + addonRemaining;

  return {
    allowed: remaining > 0,
    plan: user.plan,
    subscriptionStatus: user.subscriptionStatus,
    inTrial: false,
    periodUsed,
    periodLimit,
    planRemaining,
    addonRemaining,
    remaining,
    needsPlan: false,
    paymentFailed: false,
  };
}

export async function recordUsage(
  userId: string,
  action = "huginn_analysis"
) {
  await prisma.usageRecord.create({
    data: { userId, action },
  });

  // If user has addon analyses remaining, decrement them only after plan quota exhausted
  // This is handled at the API level by checking planRemaining before decrementing addons
}

/**
 * Decrement addon analyses by 1, called when user uses an analysis that comes from add-on pack
 */
export async function consumeAddonAnalysis(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      addonAnalysesRemaining: { decrement: 1 },
    },
  });
}
