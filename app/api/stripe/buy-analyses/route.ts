import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const ADDON_PACKS = {
  "5": { analyses: 5, priceId: process.env.STRIPE_ADDON_5_PRICE_ID },
  "10": { analyses: 10, priceId: process.env.STRIPE_ADDON_10_PRICE_ID },
} as const;

type PackKey = keyof typeof ADDON_PACKS;

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pack } = await req.json();

    if (!pack || !(pack in ADDON_PACKS)) {
      return NextResponse.json(
        { error: "Invalid pack. Choose '5' or '10'." },
        { status: 400 }
      );
    }

    const packConfig = ADDON_PACKS[pack as PackKey];

    if (!packConfig.priceId) {
      return NextResponse.json(
        { error: `Price not configured for pack: ${pack}. Set STRIPE_ADDON_${pack}_PRICE_ID in environment variables.` },
        { status: 500 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.subscriptionStatus !== "ACTIVE") {
      return NextResponse.json(
        { error: "An active subscription is required to purchase add-on analyses." },
        { status: 403 }
      );
    }

    // Ensure Stripe customer exists
    let customerId = user.stripeCustomerId;

    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch {
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
      mode: "payment",
      customer: customerId,
      line_items: [{ price: packConfig.priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?added_analyses=${packConfig.analyses}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      metadata: {
        userId: user.id,
        pack: String(packConfig.analyses),
        type: "addon_analyses",
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("BUY ANALYSES ERROR:", error?.message ?? error);
    return NextResponse.json(
      { error: error?.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
