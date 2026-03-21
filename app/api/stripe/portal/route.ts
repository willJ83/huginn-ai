import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL!));
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        stripeCustomerId: true,
      },
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.redirect(
        new URL("/dashboard?billingError=no_customer", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return NextResponse.redirect(portalSession.url);
  } catch (error) {
    console.error("STRIPE PORTAL ERROR:", error);
    return NextResponse.redirect(
      new URL("/dashboard?billingError=portal_failed", process.env.NEXT_PUBLIC_APP_URL!)
    );
  }
}
