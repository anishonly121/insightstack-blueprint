/** Only permit navigation to a relative app route after authentication. */
export function safeReturnPath(value: string | null): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020]/.test(value)
  )
    return "/dashboard";
  try {
    const base = "https://insightstack.invalid";
    const url = new URL(value, base);
    return url.origin === base
      ? `${url.pathname}${url.search}${url.hash}`
      : "/dashboard";
  } catch {
    return "/dashboard";
  }
}
