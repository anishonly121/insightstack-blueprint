import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponseWithRequestId, getRequestId, jsonWithRequestId } from "@/lib/http";
import { getInsightsQuota, FREE_DATASET_LIMIT, getUserSubscription } from "@/lib/subscription";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request): Promise<NextResponse> {
  const requestId = getRequestId(req);
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return errorResponseWithRequestId(requestId, 401, "UNAUTHORIZED", "Not authenticated");
    }

    const [quota, sub, datasetCount] = await Promise.all([
      getInsightsQuota(user.id),
      getUserSubscription(user.id),
      prisma.dataset.count({ where: { userId: user.id } }),
    ]);

    return jsonWithRequestId(requestId, {
      data: {
        isPro: sub.isPro,
        tier: sub.isPro ? "pro" : "free",
        insightsUsed: quota.used,
        insightsLimit: quota.limit,
        insightsPeriod: quota.periodLabel,
        remaining: quota.remaining,
        // Legacy field — kept so existing UI doesn't break
        insightsToday: quota.used,
        quota: quota.limit,
        datasetCount,
        datasetLimit: sub.isPro ? null : FREE_DATASET_LIMIT,
        stripeSubscriptionStatus: sub.stripeSubscriptionStatus,
        stripeCurrentPeriodEnd: sub.stripeCurrentPeriodEnd?.toISOString() ?? null,
      },
    });
  } catch {
    return errorResponseWithRequestId(requestId, 500, "INTERNAL_SERVER_ERROR", "Something went wrong");
  }
}
