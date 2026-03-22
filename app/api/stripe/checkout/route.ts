import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await req.json();

    const priceId = plan === "PRO" ? process.env.STRIPE_PRO_PRICE_ID : null;

    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
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

    // Block duplicate checkout if user is still effectively subscribed
    const alreadySubscribed =
      user.plan === "PRO" &&
      (user.subscriptionStatus === "ACTIVE" || user.subscriptionStatus === "CANCELED");

    if (alreadySubscribed) {
      let portalUrl: string | null = null;

      if (user.stripeCustomerId) {
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: user.stripeCustomerId,
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        });

        portalUrl = portalSession.url;
      }

      return NextResponse.json(
        {
          error: "You already have an active Pro subscription.",
          redirectTo: portalUrl ?? "/dashboard",
        },
        { status: 409 }
      );
    }

    let customerId = user.stripeCustomerId;

    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch (err) {
        console.warn("Invalid Stripe customer, creating new one...");

        const newCustomer = await stripe.customers.create({
          email: user.email || undefined,
        });

        customerId = newCustomer.id;

        await prisma.user.update({
          where: { id: user.id },
          data: { stripeCustomerId: customerId },
        });
      }
    } else {
      const newCustomer = await stripe.customers.create({
        email: user.email || undefined,
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
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
        plan,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          plan,
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("🔥 STRIPE ERROR FULL:");
    console.error(error);
    console.error("message:", error?.message);
    console.error("type:", error?.type);
    console.error("code:", error?.code);
    console.error("param:", error?.param);
    console.error("raw:", error?.raw);

    return Response.json(
      { error: error?.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
