"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ProductIcon } from "./ProductIcon";
import "@/app/workspace.css";

const links = [
  { href: "/dashboard", label: "Your datasets", icon: "stack" },
  { href: "/dashboard/compare", label: "Compare", icon: "chart" },
  { href: "/dashboard/activity", label: "Activity", icon: "clock" },
  { href: "/dashboard/settings", label: "Settings", icon: "shield" },
] as const;

export function WorkspaceShell({
  children,
  name,
  email,
}: {
  children: ReactNode;
  name: string;
  email: string;
}) {
  const pathname = usePathname();
  if (pathname.endsWith("/print")) return children;
  const current = links.find((link) => link.href === pathname);
  return (
    <div className="workspace-shell">
      <a className="workspace-skip" href="#workspace-content">
        Skip to workspace
      </a>
      <aside className="workspace-sidebar">
        <Link className="workspace-brand" href="/">
          <span>
            <ProductIcon name="chart" />
          </span>
          insightstack.
        </Link>
        <p className="workspace-eyebrow">YOUR WORKSPACE</p>
        <nav aria-label="Workspace navigation">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href === "/dashboard" &&
                pathname.startsWith("/dashboard/datasets/"));
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
              >
                <ProductIcon name={link.icon} size={18} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="workspace-sidebar-bottom">
          <div className="workspace-help">
            <ProductIcon name="shield" />
            <strong>Your data. Your perspective.</strong>
            <p>
              Import a CSV, explore the patterns, and keep your next decision
              grounded in the numbers.
            </p>
            <Link href="/how-it-works">
              How the analysis works <ProductIcon name="arrow" size={14} />
            </Link>
          </div>
          <Link href="/dashboard/settings" className="workspace-profile">
            <span className="workspace-avatar">
              {name.slice(0, 1).toUpperCase()}
            </span>
            <span>
              <strong>{name}</strong>
              <small>{email}</small>
            </span>
          </Link>
        </div>
      </aside>
      <div className="workspace-body">
        <div className="workspace-context">
          <span>
            Workspace <span aria-hidden="true">/</span>{" "}
            <strong>{current?.label ?? "Dataset analysis"}</strong>
          </span>
          <Link href="/demo">
            Explore sample data <ProductIcon name="external" size={14} />
          </Link>
        </div>
        <div id="workspace-content" className="workspace-content" tabIndex={-1}>
          {children}
        </div>
        <footer className="workspace-footer">
          <span>Clear numbers. Considered decisions.</span>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </footer>
      </div>
    </div>
  );
}
