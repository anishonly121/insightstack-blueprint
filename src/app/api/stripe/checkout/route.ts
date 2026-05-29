import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { getRequestId, jsonWithRequestId, errorResponseWithRequestId } from "@/lib/http";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { logger } from "@/lib/logger";

export async function POST(req: Request): Promise<NextResponse> {
  const requestId = getRequestId(req);

  const user = await getUserFromRequest(req);
  if (!user) return errorResponseWithRequestId(requestId, 401, "UNAUTHORIZED", "Missing or invalid token");

  if (!stripeConfigured()) {
    return errorResponseWithRequestId(requestId, 503, "STRIPE_NOT_CONFIGURED", "Payments are not yet enabled");
  }

  try {
    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://insightstack-peach.vercel.app";
    const priceId = process.env.STRIPE_PRO_PRICE_ID!;

    // Retrieve or create the Stripe customer for this user
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { stripeCustomerId: true },
    });

    let customerId = dbUser?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: { trial_period_days: 14 },
      success_url: `${appUrl}/dashboard?upgraded=1`,
      cancel_url: `${appUrl}/pricing`,
    });

    logger.info("STRIPE_CHECKOUT_CREATED", { userId: user.id, sessionId: session.id });
    return jsonWithRequestId(requestId, { data: { url: session.url } });
  } catch (err) {
    logger.error("STRIPE_CHECKOUT_ERROR", { userId: user.id, error: err instanceof Error ? err.message : String(err) });
    return errorResponseWithRequestId(requestId, 500, "STRIPE_ERROR", "Failed to create checkout session");
  }
}
