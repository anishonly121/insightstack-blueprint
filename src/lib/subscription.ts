import "server-only";
import { prisma } from "@/lib/prisma";

export const FREE_DATASET_LIMIT = 3;
export const FREE_MONTHLY_INSIGHTS = 5;
export const PRO_DAILY_INSIGHTS = 30;

export type UserTier = "free" | "pro";

export type SubscriptionInfo = {
  tier: UserTier;
  isPro: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeSubscriptionStatus: string | null;
  stripeCurrentPeriodEnd: Date | null;
};

function isActiveSubscription(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

export async function getUserSubscription(userId: string): Promise<SubscriptionInfo> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      stripePriceId: true,
      stripeSubscriptionStatus: true,
      stripeCurrentPeriodEnd: true,
    },
  });

  const now = new Date();
  const withinPeriod =
    !user?.stripeCurrentPeriodEnd || user.stripeCurrentPeriodEnd > now;

  const isPro =
    isActiveSubscription(user?.stripeSubscriptionStatus) && withinPeriod;

  return {
    tier: isPro ? "pro" : "free",
    isPro,
    stripeCustomerId: user?.stripeCustomerId ?? null,
    stripeSubscriptionId: user?.stripeSubscriptionId ?? null,
    stripeSubscriptionStatus: user?.stripeSubscriptionStatus ?? null,
    stripeCurrentPeriodEnd: user?.stripeCurrentPeriodEnd ?? null,
  };
}

export async function getInsightsQuota(userId: string): Promise<{
  isPro: boolean;
  used: number;
  limit: number;
  remaining: number;
  periodLabel: string;
}> {
  const { isPro } = await getUserSubscription(userId);
  const now = new Date();

  if (isPro) {
    const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const dayEnd = new Date(dayStart.getTime() + 86_400_000);
    const used = await prisma.auditLog.count({
      where: { userId, action: "INSIGHTS_GENERATE", createdAt: { gte: dayStart, lt: dayEnd } },
    });
    return { isPro, used, limit: PRO_DAILY_INSIGHTS, remaining: Math.max(0, PRO_DAILY_INSIGHTS - used), periodLabel: "today" };
  } else {
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const used = await prisma.auditLog.count({
      where: { userId, action: "INSIGHTS_GENERATE", createdAt: { gte: monthStart, lt: monthEnd } },
    });
    return { isPro, used, limit: FREE_MONTHLY_INSIGHTS, remaining: Math.max(0, FREE_MONTHLY_INSIGHTS - used), periodLabel: "this month" };
  }
}

export async function syncStripeSubscription(
  customerId: string,
  subscription: {
    id: string;
    status: string;
    items: { data: Array<{ price: { id: string }; current_period_end?: number }> };
  },
): Promise<void> {
  const item = subscription.items.data[0];
  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: item?.price.id ?? null,
      stripeSubscriptionStatus: subscription.status,
      stripeCurrentPeriodEnd: item?.current_period_end
        ? new Date(item.current_period_end * 1000)
        : null,
    },
  });
}

export async function cancelStripeSubscription(customerId: string): Promise<void> {
  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionStatus: "canceled",
    },
  });
}
