import { NextResponse } from "next/server";
import Stripe from "stripe";
import { UserPlan } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function planFromMetadata(meta?: Stripe.Metadata | null): UserPlan {
  const raw = meta?.plan;
  if (raw === "PRO") return UserPlan.PRO;
  if (raw === "STARTER") return UserPlan.STARTER;
  return UserPlan.STARTER; // default
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!signature) {
    console.error("WEBHOOK ERROR: Missing stripe-signature header");
    return new NextResponse("Missing signature", { status: 400 });
  }

  if (!webhookSecret) {
    console.error("WEBHOOK ERROR: Missing STRIPE_WEBHOOK_SECRET env var");
    return new NextResponse("Missing webhook secret", { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("WEBHOOK SIGNATURE ERROR:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    console.log("WEBHOOK EVENT:", event.type);

    switch (event.type) {
      // ----------------------------------------------------------------
      // Subscription checkout completed (new subscription or trial start)
      // ----------------------------------------------------------------
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Handle add-on pack purchases (one-time payment)
        if (session.mode === "payment") {
          const userId = session.metadata?.userId;
          const pack = session.metadata?.pack; // "5" or "10"

          if (!userId || !pack) {
            console.error("ADDON CHECKOUT: missing userId or pack in metadata");
            break;
          }

          const analyses = parseInt(pack, 10);
          if (isNaN(analyses) || analyses <= 0) {
            console.error("ADDON CHECKOUT: invalid pack value:", pack);
            break;
          }

          await prisma.user.update({
            where: { id: userId },
            data: { addonAnalysesRemaining: { increment: analyses } },
          });

          console.log(`ADDON CHECKOUT: added ${analyses} analyses to user ${userId}`);
          break;
        }

        // Subscription checkout
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;

        if (!userId || !plan || !subscriptionId) {
          console.error("CHECKOUT SESSION MISSING DATA:", { userId, plan, subscriptionId });
          break;
        }

        let currentPeriodEnd: Date | null = null;
        let trialEndsAt: Date | null = null;
        let billingCycleStart: Date | null = null;

        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const periodEnd = (subscription as any).current_period_end;
          const periodStart = (subscription as any).current_period_start;
          const trialEnd = (subscription as any).trial_end;

          if (periodEnd) currentPeriodEnd = new Date(periodEnd * 1000);
          if (periodStart) billingCycleStart = new Date(periodStart * 1000);
          if (trialEnd) trialEndsAt = new Date(trialEnd * 1000);
        } catch (err) {
          console.error("Failed to fetch subscription details:", err);
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: plan as UserPlan,
            subscriptionStatus: "ACTIVE",
            stripeSubId: subscriptionId,
            stripeCustomerId: customerId,
            currentPeriodEnd,
            trialEndsAt,
            billingCycleStart,
          },
        });

        console.log(`CHECKOUT COMPLETE: user ${userId} → plan ${plan}, trial ends ${trialEndsAt}`);
        break;
      }

      // ----------------------------------------------------------------
      // Subscription status changes (renewals, payment failures, etc.)
      // ----------------------------------------------------------------
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;
        const status = subscription.status;
        const periodEnd = (subscription as any).current_period_end;
        const periodStart = (subscription as any).current_period_start;
        const trialEnd = (subscription as any).trial_end;

        const currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000) : null;
        const newBillingCycleStart = periodStart ? new Date(periodStart * 1000) : null;
        const trialEndsAt = trialEnd ? new Date(trialEnd * 1000) : null;

        const plan = planFromMetadata(subscription.metadata);

        const user = await prisma.user.findFirst({
          where: { stripeSubId: subscriptionId },
          select: { id: true, billingCycleStart: true },
        });

        if (!user) {
          console.log("SUBSCRIPTION USER NOT FOUND:", { subscriptionId });
          break;
        }

        // Detect billing cycle renewal — reset add-ons if new period started
        const isNewBillingCycle =
          newBillingCycleStart &&
          user.billingCycleStart &&
          newBillingCycleStart.getTime() !== user.billingCycleStart.getTime();

        if (status === "active") {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              plan,
              subscriptionStatus: "ACTIVE",
              currentPeriodEnd,
              billingCycleStart: newBillingCycleStart,
              trialEndsAt: trialEndsAt ?? undefined,
              // Reset add-ons when a new billing cycle starts
              ...(isNewBillingCycle ? { addonAnalysesRemaining: 0 } : {}),
            },
          });
        } else if (status === "trialing") {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              plan,
              subscriptionStatus: "ACTIVE",
              currentPeriodEnd,
              billingCycleStart: newBillingCycleStart,
              trialEndsAt,
            },
          });
        } else if (status === "canceled") {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              plan,
              subscriptionStatus: "CANCELED",
              currentPeriodEnd,
            },
          });
        } else if (status === "past_due" || status === "unpaid") {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: "PAST_DUE",
              currentPeriodEnd,
            },
          });
        } else {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: "PAST_DUE",
              currentPeriodEnd,
            },
          });
        }

        console.log(`SUBSCRIPTION ${status}: user ${user.id}, plan ${plan}`);
        break;
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("WEBHOOK HANDLER ERROR:", error);
    return new NextResponse("Webhook error", { status: 500 });
  }
}
