import "server-only";
import sgMail from "@sendgrid/mail";
import { env } from "@/lib/env";

export type DigestData = {
  to: string;
  name: string;
  month: string;
  datasetName: string;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  transactionCount: number;
  topCategories: Array<{ category: string; total: number; count: number }>;
  overBudget: Array<{ category: string; spent: number; limit: number }>;
  topRecommendation: string | null;
  dashboardUrl: string;
};

const $ = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Math.abs(n));

function buildHtml(d: DigestData): string {
  const savingsColor = d.netSavings >= 0 ? "#10B981" : "#EF4444";
  const savingsSign = d.netSavings >= 0 ? "↑" : "↓";

  const categoryRows = d.topCategories
    .slice(0, 5)
    .map((c, i) => {
      const pct = d.totalExpenses > 0 ? ((Math.abs(c.total) / d.totalExpenses) * 100).toFixed(0) : "0";
      const dot = ["#3B82F6", "#06B6D4", "#10B981", "#8B5CF6", "#F97316"][i] ?? "#3B82F6";
      return `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #F1F5F9;">
          <table role="presentation" width="100%"><tr>
            <td width="10">
              <div style="width:8px;height:8px;border-radius:50%;background:${dot};margin-top:2px;"></div>
            </td>
            <td style="padding-left:10px;font-size:13px;color:#1E293B;font-weight:600;">${c.category}</td>
            <td align="right" style="font-size:13px;color:#475569;white-space:nowrap;">
              ${$(c.total)} <span style="color:#94A3B8;font-size:11px;">(${pct}%)</span>
            </td>
          </tr></table>
        </td>
      </tr>`;
    })
    .join("");

  const budgetSection =
    d.overBudget.length > 0
      ? `
      <div style="background:#FEF2F2;border-radius:12px;border:1px solid #FECACA;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#DC2626;">
          ⚠ Budget Alerts
        </p>
        ${d.overBudget
          .map(
            (b) => `
          <p style="margin:0 0 6px;font-size:13px;color:#7F1D1D;">
            <strong>${b.category}</strong> — ${$(b.spent)} spent of ${$(b.limit)} budget
            (${((b.spent / b.limit) * 100).toFixed(0)}%)
          </p>`,
          )
          .join("")}
      </div>`
      : "";

  const recommendationSection = d.topRecommendation
    ? `
    <div style="background:#EFF6FF;border-radius:12px;border:1px solid #BFDBFE;padding:16px 20px;margin-bottom:28px;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#1D4ED8;">
        💡 AI Recommendation
      </p>
      <p style="margin:0;font-size:13px;color:#1E3A8A;line-height:1.6;">${d.topRecommendation}</p>
    </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Your InsightStack Weekly Digest</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:32px 16px;">
  <tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

    <!-- HEADER -->
    <tr><td style="background:#050B18;border-radius:16px 16px 0 0;padding:28px 36px;">
      <table role="presentation" width="100%"><tr>
        <td>
          <span style="font-size:18px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
            Insight<span style="color:#60A5FA;">Stack</span>
          </span>
        </td>
        <td align="right">
          <span style="font-size:11px;color:#475569;">${d.month} · Weekly Digest</span>
        </td>
      </tr></table>
      <div style="margin-top:20px;">
        <h1 style="margin:0;font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.3px;">
          Your spending summary 📊
        </h1>
        <p style="margin:6px 0 0;font-size:13px;color:#64748B;">
          Hi ${d.name}, here's what happened in <strong style="color:#94A3B8;">${d.datasetName}</strong>.
        </p>
      </div>
    </td></tr>

    <!-- BODY -->
    <tr><td style="background:#ffffff;padding:36px;">

      <!-- Metrics row -->
      <table role="presentation" width="100%" style="margin-bottom:28px;">
        <tr>
          <td width="50%" style="padding-right:6px;">
            <div style="background:#FFF1F2;border-radius:12px;border:1px solid #FECDD3;padding:16px 20px;">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94A3B8;margin-bottom:4px;">Total Expenses</div>
              <div style="font-size:26px;font-weight:900;color:#DC2626;">${$(d.totalExpenses)}</div>
              <div style="font-size:11px;color:#94A3B8;">${d.transactionCount} transactions</div>
            </div>
          </td>
          <td width="50%" style="padding-left:6px;">
            <div style="background:${d.netSavings >= 0 ? "#F0FDF4" : "#FFF1F2"};border-radius:12px;border:1px solid ${d.netSavings >= 0 ? "#BBF7D0" : "#FECDD3"};padding:16px 20px;">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94A3B8;margin-bottom:4px;">Net Savings</div>
              <div style="font-size:26px;font-weight:900;color:${savingsColor};">${savingsSign} ${$(d.netSavings)}</div>
              <div style="font-size:11px;color:#94A3B8;">Savings rate: ${d.savingsRate.toFixed(1)}%</div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Top categories -->
      <h2 style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94A3B8;">
        Top Spending Categories
      </h2>
      <table role="presentation" width="100%" style="margin-bottom:24px;">
        ${categoryRows}
      </table>

      ${budgetSection}
      ${recommendationSection}

      <!-- CTA -->
      <div style="text-align:center;margin-top:8px;">
        <a href="${d.dashboardUrl}/dashboard" style="display:inline-block;background:#3B82F6;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 36px;border-radius:12px;letter-spacing:-0.2px;box-shadow:0 4px 15px rgba(59,130,246,0.35);">
          Open Dashboard →
        </a>
      </div>

    </td></tr>

    <!-- FOOTER -->
    <tr><td style="background:#F8FAFC;border-radius:0 0 16px 16px;padding:20px 36px;border-top:1px solid #E2E8F0;">
      <p style="margin:0;font-size:11px;color:#94A3B8;text-align:center;line-height:1.8;">
        Sent weekly by <strong>InsightStack</strong> · AI-powered finance analytics<br>
        <a href="${d.dashboardUrl}/dashboard/settings" style="color:#60A5FA;text-decoration:none;">Manage notifications</a>
        &nbsp;·&nbsp;
        <a href="${d.dashboardUrl}/dashboard" style="color:#60A5FA;text-decoration:none;">View dashboard</a>
      </p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`;
}

export async function sendWeeklyDigest(data: DigestData): Promise<void> {
  const apiKey = env.SENDGRID_API_KEY;
  const fromEmail = env.SENDGRID_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    throw new Error("SendGrid not configured");
  }

  sgMail.setApiKey(apiKey);

  const subject = `Your InsightStack weekly digest — ${data.month}`;

  await sgMail.send({
    to: data.to,
    from: { email: fromEmail, name: "InsightStack" },
    subject,
    html: buildHtml(data),
    text: [
      `InsightStack Weekly Digest — ${data.month}`,
      `Hi ${data.name},`,
      ``,
      `Dataset: ${data.datasetName}`,
      `Total Expenses: ${$(data.totalExpenses)}`,
      `Net Savings: ${$(data.netSavings)} (${data.savingsRate.toFixed(1)}%)`,
      `Transactions: ${data.transactionCount}`,
      ``,
      data.topCategories
        .slice(0, 5)
        .map((c) => `• ${c.category}: ${$(c.total)}`)
        .join("\n"),
      ``,
      data.overBudget.length > 0
        ? `BUDGET ALERTS:\n${data.overBudget.map((b) => `• ${b.category}: ${$(b.spent)} of ${$(b.limit)} budget`).join("\n")}`
        : "",
      ``,
      data.topRecommendation ? `Recommendation: ${data.topRecommendation}` : "",
      ``,
      `View your dashboard: ${data.dashboardUrl}/dashboard`,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}
