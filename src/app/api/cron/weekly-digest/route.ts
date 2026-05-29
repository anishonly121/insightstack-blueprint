import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { sendWeeklyDigest, type DigestData } from "@/lib/digest";
import type { MetricsJson } from "@/lib/metrics";
import type { InsightPayload } from "@/app/api/datasets/[id]/insights/route";

// Vercel Cron: runs every Monday at 08:00 UTC (configured in vercel.json)
// Protected by CRON_SECRET env var — Vercel passes this automatically.

const MAX_USERS_PER_RUN = 100;

function currentMonthLabel(): string {
  return new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
}

export async function GET(req: Request): Promise<NextResponse> {
  // Verify caller is Vercel Cron (or an authorised manual trigger)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("CRON_UNAUTHORIZED", { path: "/api/cron/weekly-digest" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  logger.info("CRON_DIGEST_START", { at: new Date().toISOString() });

  // Find users who have at least one fully parsed dataset
  const users = await prisma.user.findMany({
    where: {
      emailDigestEnabled: true,
      datasets: { some: { status: "PARSED" } },
    },
    select: { id: true, name: true, email: true },
    take: MAX_USERS_PER_RUN,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://insightstack-peach.vercel.app";
  const month = currentMonthLabel();

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of users) {
    try {
      // Most recent metric snapshot across all of this user's datasets
      const snapshot = await prisma.metricSnapshot.findFirst({
        where: { dataset: { userId: user.id } },
        orderBy: { computedAt: "desc" },
        include: { dataset: { select: { name: true } } },
      });

      if (!snapshot?.metricsJson) {
        skipped++;
        continue;
      }

      const metrics = snapshot.metricsJson as unknown as MetricsJson;

      // Budget data for over-budget detection
      const budgets = await prisma.budget.findMany({
        where: { userId: user.id },
        select: { category: true, monthlyLimit: true },
      });

      const overBudget = budgets
        .map((b) => {
          const cat = metrics.topCategories.find((c) => c.category === b.category);
          const spent = cat ? Math.abs(cat.total) : 0;
          const limit = Number(b.monthlyLimit.toString());
          return { category: b.category, spent, limit };
        })
        .filter((b) => b.spent > b.limit);

      // Most recent AI recommendation
      const latestInsight = await prisma.insight.findFirst({
        where: { dataset: { userId: user.id } },
        orderBy: { createdAt: "desc" },
        select: { insightJson: true },
      });

      const insightJson = latestInsight?.insightJson as InsightPayload | null;
      const topRecommendation = insightJson?.recommendations?.[0] ?? null;

      const digestData: DigestData = {
        to: user.email,
        name: user.name.split(" ")[0] ?? user.name,
        month,
        datasetName: snapshot.dataset.name,
        totalIncome: metrics.totalIncome,
        totalExpenses: metrics.totalExpenses,
        netSavings: metrics.netSavings,
        savingsRate: metrics.savingsRate,
        transactionCount: metrics.transactionCount,
        topCategories: metrics.topCategories.slice(0, 5).map((c) => ({
          category: c.category,
          total: c.total,
          count: c.count,
        })),
        overBudget,
        topRecommendation,
        dashboardUrl: appUrl,
      };

      await sendWeeklyDigest(digestData);
      sent++;

      logger.info("CRON_DIGEST_SENT", {
        userId: user.id,
        overBudgetCount: overBudget.length,
        hasRecommendation: !!topRecommendation,
      });
    } catch (err) {
      failed++;
      logger.error("CRON_DIGEST_FAILED", {
        userId: user.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const result = { sent, skipped, failed, total: users.length, month };
  logger.info("CRON_DIGEST_DONE", result);
  return NextResponse.json(result);
}
