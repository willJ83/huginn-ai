import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_IDS: Record<string, string | undefined> = {
  STARTER: process.env.STRIPE_STARTER_PRICE_ID,
  PRO: process.env.STRIPE_PRO_PRICE_ID,
};

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json(
        { error: "Unauthorized", redirectTo: "/signup?next=/select-plan" },
        { status: 401 }
      );
    }

    const { plan } = await req.json();

    if (plan !== "STARTER" && plan !== "PRO") {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    const priceId = PRICE_IDS[plan];

    if (!priceId) {
      return NextResponse.json(
        { error: `Price not configured for plan: ${plan}. Set STRIPE_${plan}_PRICE_ID in environment variables.` },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        plan: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        stripeSubId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Already has an active subscription — redirect to billing portal
    const alreadySubscribed =
      (user.plan === "STARTER" || user.plan === "PRO") &&
      (user.subscriptionStatus === "ACTIVE" || user.subscriptionStatus === "CANCELED");

    if (alreadySubscribed && user.stripeCustomerId) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      });

      return NextResponse.json(
        {
          error: "You already have an active subscription.",
          redirectTo: portalSession.url,
        },
        { status: 409 }
      );
    }

    // Ensure Stripe customer exists
    let customerId = user.stripeCustomerId;

    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch {
        console.warn("Invalid Stripe customer, creating new one...");
        customerId = null;
      }
    }

    if (!customerId) {
      const newCustomer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { userId: user.id },
      });

      customerId = newCustomer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: {
          userId: user.id,
          plan,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/select-plan?canceled=true`,
      metadata: {
        userId: user.id,
        plan,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("STRIPE CHECKOUT ERROR:", error?.message ?? error);
    return NextResponse.json(
      { error: error?.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
