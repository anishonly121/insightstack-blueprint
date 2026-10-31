import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getUserFromServerCookie } from "@/lib/auth";
import { WorkspaceShell } from "@/components/WorkspaceShell";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await getUserFromServerCookie();
  if (!user) {
    redirect("/login");
  }

  return <WorkspaceShell name={user.name} email={user.email}>{children}</WorkspaceShell>;
}
