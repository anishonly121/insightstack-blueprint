export const escapeEmailHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]!));

export function passwordResetEmail(name: string, resetLink: string) {
  const url = new URL(resetLink);
  if (!["https:", "http:"].includes(url.protocol)) throw new Error("INVALID_RESET_URL");
  const safeLink = escapeEmailHtml(url.href);
  return {
    subject: "Reset your InsightStack password",
    text: `Hi ${name},\n\nReset your InsightStack password using this link:\n${url.href}\n\nThis link expires in 30 minutes and can only be used once. If you did not request this, you can ignore this email.`,
    html: `<!doctype html><html lang="en"><body style="margin:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#172334"><div style="max-width:520px;margin:32px auto;padding:36px;background:white;border:1px solid #e2e8f0;border-radius:16px"><p style="color:#3559ed;font-size:20px;font-weight:bold">insightstack.</p><h1 style="font-size:26px">Reset your password</h1><p>Hi ${escapeEmailHtml(name)},</p><p style="line-height:1.6">Use the button below to choose a new password for your InsightStack account.</p><p style="margin:28px 0"><a href="${safeLink}" style="display:inline-block;padding:14px 22px;background:#3559ed;color:white;text-decoration:none;border-radius:8px;font-weight:bold">Reset password</a></p><p style="line-height:1.6;color:#536275">This link expires in 30 minutes and can only be used once. If you did not request this, you can ignore this email.</p><p style="font-size:12px;word-break:break-all">Button not working? Copy this link:<br><a href="${safeLink}">${safeLink}</a></p></div></body></html>`,
  };
}
