import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Your workspace | InsightStack" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string | string[] }>;
}) {
  const params = await searchParams;
  return (
    <LoginForm
      initialMode={params.mode === "register" ? "register" : "login"}
    />
  );
}
