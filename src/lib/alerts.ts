import "server-only";
import sgMail from "@sendgrid/mail";
import { env } from "@/lib/env";

export type BudgetAlert = {
  category: string;
  spent: number;
  limit: number;
  pct: number;
};

export type BudgetAlertEmailInput = {
  to: string;
  name: string;
  datasetName: string;
  dashboardUrl: string;
  alerts: BudgetAlert[];
};

const $ = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Math.abs(n));

function alertColor(pct: number): string {
  return pct >= 100 ? "#DC2626" : "#D97706";
}

function alertLabel(pct: number): string {
  return pct >= 100 ? "Over limit" : "Approaching limit";
}

function buildAlertHtml(d: BudgetAlertEmailInput): string {
  const rows = d.alerts
    .map(
      (a) => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F1F5F9;font-size:13px;color:#1E293B;font-weight:600;">
          ${a.category}
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #F1F5F9;font-size:13px;color:#475569;text-align:right;">
          ${$(a.spent)}
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #F1F5F9;font-size:13px;color:#94A3B8;text-align:right;">
          ${$(a.limit)}
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #F1F5F9;font-size:13px;font-weight:700;text-align:right;color:${alertColor(a.pct)};">
          ${a.pct.toFixed(0)}% — ${alertLabel(a.pct)}
        </td>
      </tr>`,
    )
    .join("");

  const overCount = d.alerts.filter((a) => a.pct >= 100).length;
  const warnCount = d.alerts.length - overCount;

  const intro =
    overCount > 0
      ? `Your recent upload to <strong>${d.datasetName}</strong> has pushed ${overCount} categor${overCount > 1 ? "ies" : "y"} over budget.`
      : `Your recent upload to <strong>${d.datasetName}</strong> has ${warnCount} categor${warnCount > 1 ? "ies" : "y"} approaching the monthly limit.`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Budget Alert — InsightStack</title></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:32px 16px;">
  <tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

    <!-- HEADER -->
    <tr><td style="background:#050B18;border-radius:16px 16px 0 0;padding:24px 32px;">
      <table role="presentation" width="100%"><tr>
        <td>
          <span style="font-size:16px;font-weight:900;color:#ffffff;">
            Insight<span style="color:#60A5FA;">Stack</span>
          </span>
        </td>
        <td align="right">
          <span style="display:inline-block;background:${overCount > 0 ? "#FEF2F2" : "#FFFBEB"};color:${overCount > 0 ? "#DC2626" : "#D97706"};font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;">
            ${overCount > 0 ? "⚠ Over budget" : "⚡ Budget alert"}
          </span>
        </td>
      </tr></table>
      <p style="margin:16px 0 0;font-size:20px;font-weight:900;color:#ffffff;">Budget Alert</p>
      <p style="margin:4px 0 0;font-size:13px;color:#64748B;">Hi ${d.name}, heads up.</p>
    </td></tr>

    <!-- BODY -->
    <tr><td style="background:#ffffff;padding:32px;">
      <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">${intro}</p>

      <!-- Table -->
      <table role="presentation" width="100%" style="border-collapse:collapse;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;">
        <thead>
          <tr style="background:#F8FAFC;">
            <th style="padding:10px 16px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94A3B8;">Category</th>
            <th style="padding:10px 16px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94A3B8;">Spent</th>
            <th style="padding:10px 16px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94A3B8;">Limit</th>
            <th style="padding:10px 16px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94A3B8;">Usage</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <p style="margin:20px 0 28px;font-size:13px;color:#94A3B8;line-height:1.6;">
        ${overCount > 0
          ? "Consider reviewing recent transactions in the affected categories."
          : "You still have room — but keep an eye on these categories for the rest of the month."}
      </p>

      <div style="text-align:center;">
        <a href="${d.dashboardUrl}/dashboard" style="display:inline-block;background:#3B82F6;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 32px;border-radius:12px;">
          View Budget Tracker →
        </a>
      </div>
    </td></tr>

    <!-- FOOTER -->
    <tr><td style="background:#F8FAFC;border-radius:0 0 16px 16px;padding:20px 32px;border-top:1px solid #E2E8F0;">
      <p style="margin:0;font-size:11px;color:#94A3B8;text-align:center;line-height:1.8;">
        Sent by <strong>InsightStack</strong> · AI-powered finance analytics<br>
        <a href="${d.dashboardUrl}/dashboard/settings" style="color:#60A5FA;text-decoration:none;">Manage notifications</a>
      </p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`;
}

export async function sendBudgetAlertEmail(data: BudgetAlertEmailInput): Promise<void> {
  const apiKey = env.SENDGRID_API_KEY;
  const fromEmail = env.SENDGRID_FROM_EMAIL;
  if (!apiKey || !fromEmail) return;

  sgMail.setApiKey(apiKey);

  const overCount = data.alerts.filter((a) => a.pct >= 100).length;
  const subject =
    overCount > 0
      ? `⚠️ Budget exceeded — ${overCount} categor${overCount > 1 ? "ies" : "y"} over limit`
      : `⚡ Budget alert — ${data.alerts.length} categor${data.alerts.length > 1 ? "ies" : "y"} approaching limit`;

  const text = [
    `Budget Alert — InsightStack`,
    `Hi ${data.name},`,
    ``,
    `Your upload to "${data.datasetName}" has triggered budget alerts:`,
    ``,
    ...data.alerts.map((a) => `• ${a.category}: ${$(a.spent)} of ${$(a.limit)} (${a.pct.toFixed(0)}%)`),
    ``,
    `View your dashboard: ${data.dashboardUrl}/dashboard`,
  ].join("\n");

  await sgMail.send({
    to: data.to,
    from: { email: fromEmail, name: "InsightStack" },
    subject,
    html: buildAlertHtml(data),
    text,
  });
}
