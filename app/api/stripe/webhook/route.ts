import { NextResponse } from "next/server";
import Stripe from "stripe";
import { UserPlan } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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
    console.error("WEBHOOK DEBUG:", {
      hasSignature: !!signature,
      signaturePrefix: signature.slice(0, 20),
      bodyLength: body.length,
      webhookSecretLoaded: !!webhookSecret,
      webhookSecretPrefix: webhookSecret.slice(0, 8),
      webhookSecretLength: webhookSecret.length,
    });
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    console.log("WEBHOOK EVENT:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

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

        console.log("CHECKOUT SESSION COMPLETED:", {
          sessionId: session.id,
          userId,
          plan,
          subscriptionId,
          customerId,
        });

        if (!userId || !plan || !subscriptionId) {
          console.error("CHECKOUT SESSION MISSING DATA:", {
            userId,
            plan,
            subscriptionId,
            customerId,
            sessionId: session.id,
            metadata: session.metadata,
          });
          break;
        }

        let currentPeriodEnd: Date | null = null;
        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const periodEnd = (subscription as any).current_period_end;
          if (periodEnd) {
            currentPeriodEnd = new Date(periodEnd * 1000);
          }
        } catch (err) {
          console.error("Failed to fetch subscription for period end:", err);
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: plan as UserPlan,
            subscriptionStatus: "ACTIVE",
            stripeSubId: subscriptionId,
            stripeCustomerId: customerId,
            currentPeriodEnd,
          },
        });

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;
        const status = subscription.status;
        const periodEnd = (subscription as any).current_period_end;
        const currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000) : null;

        console.log("SUBSCRIPTION EVENT:", {
          subscriptionId,
          status,
          currentPeriodEnd,
        });

        const user = await prisma.user.findFirst({
          where: {
            stripeSubId: subscriptionId,
          },
          select: {
            id: true,
          },
        });

        if (!user) {
          console.log("SUBSCRIPTION USER NOT FOUND:", { subscriptionId });
          break;
        }

        if (status === "active" || status === "trialing") {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              plan: "PRO",
              subscriptionStatus: "ACTIVE",
              currentPeriodEnd,
            },
          });
        } else if (status === "canceled") {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              plan: "PRO",
              subscriptionStatus: "CANCELED",
              currentPeriodEnd,
            },
          });
        } else if (status === "unpaid") {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              plan: "FREE",
              subscriptionStatus: "CANCELED",
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

        break;
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("WEBHOOK HANDLER ERROR:", error);
    return new NextResponse("Webhook error", { status: 500 });
  }
}