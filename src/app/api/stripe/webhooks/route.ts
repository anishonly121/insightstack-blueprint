import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { syncStripeSubscription, cancelStripeSubscription } from "@/lib/subscription";
import { logger } from "@/lib/logger";

// Stripe sends raw body — Next.js must NOT parse it
export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  if (!webhookSecret) {
    logger.warn("STRIPE_WEBHOOK_SECRET_MISSING");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    logger.warn("STRIPE_WEBHOOK_INVALID_SIG", { error: err instanceof Error ? err.message : String(err) });
    return new Response("Invalid signature", { status: 400 });
  }

  logger.info("STRIPE_WEBHOOK_RECEIVED", { type: event.type, id: event.id });

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await syncStripeSubscription(sub.customer as string, {
          id: sub.id,
          status: sub.status,
          items: {
            data: sub.items.data.map((item) => ({
              price: { id: item.price.id },
              current_period_end: (item as { current_period_end?: number }).current_period_end,
            })),
          },
        });
        logger.info("STRIPE_SUBSCRIPTION_SYNCED", { subscriptionId: sub.id, status: sub.status });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await cancelStripeSubscription(sub.customer as string);
        logger.info("STRIPE_SUBSCRIPTION_CANCELLED", { subscriptionId: sub.id });
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const sub = await getStripe().subscriptions.retrieve(session.subscription as string);
          await syncStripeSubscription(session.customer as string, {
            id: sub.id,
            status: sub.status,
            items: {
              data: sub.items.data.map((item) => ({
                price: { id: item.price.id },
                current_period_end: (item as { current_period_end?: number }).current_period_end,
              })),
            },
          });
          logger.info("STRIPE_CHECKOUT_COMPLETED", { sessionId: session.id });
        }
        break;
      }
      default:
        // Unhandled event type — not an error
        break;
    }
  } catch (err) {
    logger.error("STRIPE_WEBHOOK_HANDLER_ERROR", { type: event.type, error: err instanceof Error ? err.message : String(err) });
    return new Response("Handler error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
