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

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { stripeCustomerId: true },
  });

  if (!dbUser?.stripeCustomerId) {
    return errorResponseWithRequestId(requestId, 400, "NO_BILLING_ACCOUNT", "No billing account found");
  }

  try {
    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://insightstack-peach.vercel.app";

    const session = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripeCustomerId,
      return_url: `${appUrl}/dashboard/settings`,
    });

    logger.info("STRIPE_PORTAL_CREATED", { userId: user.id });
    return jsonWithRequestId(requestId, { data: { url: session.url } });
  } catch (err) {
    logger.error("STRIPE_PORTAL_ERROR", { userId: user.id, error: err instanceof Error ? err.message : String(err) });
    return errorResponseWithRequestId(requestId, 500, "STRIPE_ERROR", "Failed to open billing portal");
  }
}
