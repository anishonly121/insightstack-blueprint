"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { LogoMark } from "@/components/LogoMark";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toaster";
import {
  api,
  clearToken,
  getToken,
  type AuthUser,
  type Dataset,
  type PaginatedMeta,
} from "@/lib/api";

// ── Demo CSV data ─────────────────────────────────────────────────────────────
const DEMO_CSV = `date,description,category,amount
2026-01-02,Amazon Web Services,Cloud Hosting,-892.00
2026-01-04,Stripe Revenue — Week 1,Income,4200.00
2026-01-05,Netflix Business,Subscriptions,-15.99
2026-01-07,Slack Pro,Software Tools,-87.50
2026-01-08,Figma Professional,Software Tools,-45.00
2026-01-09,Vercel Pro,Cloud Hosting,-20.00
2026-01-10,Google Workspace,Software Tools,-12.00
2026-01-12,Freelance Project — Acme Corp,Income,3500.00
2026-01-14,GitHub Teams,Software Tools,-21.00
2026-01-15,Amazon Web Services — Anomaly Spike,Cloud Hosting,-1247.00
2026-01-16,Zoom Business,Software Tools,-15.99
2026-01-17,DigitalOcean Droplets,Cloud Hosting,-72.00
2026-01-20,Stripe Revenue — Week 3,Income,3800.00
2026-01-22,QuickBooks Online,Accounting,-30.00
2026-01-24,Notion Team Plan,Software Tools,-16.00
2026-01-25,Payroll — Engineering Team,Payroll,-8500.00
2026-01-27,Office Supplies,Office,-234.00
2026-01-28,Stripe Revenue — Week 4,Income,5100.00
2026-01-30,Adobe Creative Cloud,Software Tools,-54.99
2026-02-01,Amazon Web Services,Cloud Hosting,-234.00
2026-02-03,Netflix Business,Subscriptions,-15.99
2026-02-05,Stripe Revenue — Week 1,Income,4600.00
2026-02-06,Slack Pro,Software Tools,-87.50
2026-02-08,Figma Professional,Software Tools,-45.00
2026-02-10,Vercel Pro,Cloud Hosting,-20.00
2026-02-12,Freelance Project — Beta Corp,Income,2800.00
2026-02-14,GitHub Teams,Software Tools,-21.00
2026-02-16,Zoom Business,Software Tools,-15.99
2026-02-18,DigitalOcean Droplets,Cloud Hosting,-72.00
2026-02-20,Stripe Revenue — Week 3,Income,4100.00
2026-02-22,QuickBooks Online,Accounting,-30.00
2026-02-25,Payroll — Engineering Team,Payroll,-8500.00
2026-02-28,Adobe Creative Cloud,Software Tools,-54.99
2026-03-01,Amazon Web Services,Cloud Hosting,-312.00
2026-03-03,Netflix Business,Subscriptions,-15.99
2026-03-05,Stripe Revenue — Week 1,Income,5200.00
2026-03-07,Slack Pro,Software Tools,-87.50
2026-03-10,Figma Professional,Software Tools,-45.00
2026-03-12,Vercel Pro,Cloud Hosting,-20.00
2026-03-14,Freelance Project — Gamma Ltd,Income,4000.00
2026-03-16,GitHub Teams,Software Tools,-21.00
2026-03-18,DigitalOcean Droplets,Cloud Hosting,-72.00
2026-03-20,Stripe Revenue — Week 3,Income,4800.00
2026-03-22,QuickBooks Online,Accounting,-30.00
2026-03-25,Payroll — Engineering Team,Payroll,-8500.00
2026-03-28,Stripe Revenue — Week 4,Income,3200.00
2026-03-30,Adobe Creative Cloud,Software Tools,-54.99`;

type ActionState = {
  uploadLoading: boolean;
  insightLoading: boolean;
  deleteLoading: boolean;
  renaming: boolean;
  renameValue: string;
  error: string;
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PARSED:   { label: "Parsed",   className: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20" },
  UPLOADED: { label: "Uploaded", className: "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20" },
  FAILED:   { label: "Failed",   className: "bg-red-500/10 text-red-400 ring-1 ring-red-500/20" },
};

// ── Onboarding checklist ────────────────────────────────────────────────────
function OnboardingChecklist({ datasets, totalDatasets }: { datasets: Dataset[]; totalDatasets: number }) {
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("insightstack_onboarding_v1") === "done",
  );
  const [budgetsDone, setBudgetsDone] = useState(false);
  const [insightsDone, setInsightsDone] = useState(false);

  const firstParsed = datasets.find((d) => d.status === "PARSED");

  useEffect(() => {
    api.listBudgets().then((r) => setBudgetsDone(r.data.length > 0)).catch(() => {});
    if (firstParsed) {
      api.listInsights(firstParsed.id, { pageSize: 1 }).then((r) => setInsightsDone(r.meta.total > 0)).catch(() => {});
    }
  }, [firstParsed]);

  const hasDataset = totalDatasets > 0;
  const hasUploaded = !!firstParsed;

  const steps = [
    { label: "Create your account",      done: true,          href: null },
    { label: "Create your first dataset", done: hasDataset,    href: null },
    { label: "Upload a CSV file",         done: hasUploaded,   href: firstParsed ? `/dashboard/datasets/${firstParsed.id}` : null },
    { label: "Generate AI insights",      done: insightsDone,  href: firstParsed ? `/dashboard/datasets/${firstParsed.id}` : null },
    { label: "Set a spending budget",     done: budgetsDone,   href: firstParsed ? `/dashboard/datasets/${firstParsed.id}` : null },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  const dismiss = () => {
    localStorage.setItem("insightstack_onboarding_v1", "done");
    setDismissed(true);
  };

  if (dismissed || allDone) return null;

  return (
    <section className="mb-6 rounded-xl border border-blue-500/15 bg-blue-500/5 p-5">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">Get started with InsightStack</h2>
          <p className="mt-0.5 text-xs text-zinc-500">{completedCount} of {steps.length} steps complete</p>
        </div>
        <button type="button" onClick={dismiss} className="text-zinc-700 transition hover:text-zinc-400" aria-label="Dismiss">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-700"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      <div className="space-y-2.5">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            {step.done ? (
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            ) : (
              <div className="h-5 w-5 shrink-0 rounded-full border-2 border-zinc-700" />
            )}
            <span className={`text-sm ${step.done ? "text-zinc-600 line-through" : "text-zinc-200"}`}>
              {step.label}
            </span>
            {!step.done && step.href && (
              <Link href={step.href} className="ml-auto shrink-0 text-xs font-semibold text-blue-400 transition hover:text-blue-300">
                Go →
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Keyboard shortcuts ────────────────────────────────────────────────────────

const SHORTCUT_LIST = [
  { keys: ["N"], desc: "Focus new dataset input" },
  { keys: ["→"], desc: "Next page of datasets" },
  { keys: ["←"], desc: "Previous page of datasets" },
  { keys: ["?"], desc: "Toggle this panel" },
  { keys: ["Esc"], desc: "Close panel / cancel rename" },
];

function ShortcutsPanel({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xs rounded-2xl border border-white/[0.08] bg-[#0A1628] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-sm font-bold text-white">Keyboard shortcuts</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-600 transition hover:text-zinc-300"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-3">
          {SHORTCUT_LIST.map((s) => (
            <div key={s.desc} className="flex items-center justify-between gap-4">
              <span className="text-sm text-zinc-400">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="inline-flex min-w-[28px] items-center justify-center rounded-md border border-white/10 bg-zinc-800 px-1.5 py-1 font-mono text-xs text-zinc-300 shadow-[0_1px_0_rgba(0,0,0,0.4)]"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[10px] text-zinc-700">Shortcuts are disabled while typing in an input.</p>
      </div>
    </div>
  );
}

function DeleteModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0A1628] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-red-500/20">
          <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </div>
        <h2 className="mb-1 text-base font-bold text-white">Delete dataset?</h2>
        <p className="mb-6 text-sm text-zinc-500">
          <span className="font-semibold text-zinc-300">&ldquo;{name}&rdquo;</span> and all its transactions and insights will be permanently deleted. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-semibold text-zinc-400 transition hover:border-white/[0.15] hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] transition hover:bg-red-400"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onLoadDemo, demoLoading }: { onLoadDemo: () => void; demoLoading: boolean }) {
  return (
    <div className="flex flex-col items-center gap-5 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-zinc-800">
        <svg className="h-8 w-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 64 64" strokeWidth={1.2}>
          <rect x="8" y="12" width="48" height="40" rx="4" strokeDasharray="4 3" />
          <path strokeLinecap="round" d="M22 24h20M22 32h12" />
          <circle cx="44" cy="44" r="8" fill="transparent" stroke="currentColor" />
          <path strokeLinecap="round" d="M44 41v6M41 44h6" />
        </svg>
      </div>
      <div>
        <p className="text-base font-bold text-zinc-100">No datasets yet</p>
        <p className="mt-1.5 max-w-xs text-sm text-zinc-600">
          Create a dataset above, upload a CSV, then click{" "}
          <span className="font-semibold text-blue-400">AI Insights</span> to analyse your spending.
        </p>
      </div>
      <div className="mt-1 flex flex-wrap justify-center gap-2 text-xs text-zinc-600">
        <span className="rounded-full border border-white/8 bg-zinc-800 px-3 py-1">
          date · description · category · amount
        </span>
        <span className="rounded-full border border-white/8 bg-zinc-800 px-3 py-1">
          CSV format
        </span>
      </div>
      {/* Demo loader */}
      <div className="mt-2 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onLoadDemo}
          disabled={demoLoading}
          className="group flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/8 px-5 py-2.5 text-sm font-semibold text-blue-400 transition hover:border-blue-500/40 hover:bg-blue-500/15 disabled:opacity-50"
        >
          {demoLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-400" />
              Loading demo data…
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
              </svg>
              Try with demo data — one click
            </>
          )}
        </button>
        <p className="text-xs text-zinc-700">47 real transactions · anomalies included · instant AI-ready</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>({ page: 1, pageSize: 8, total: 0, totalPages: 1 });
  const [name, setName] = useState("");
  const [pageError, setPageError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [fileByDataset, setFileByDataset] = useState<Record<string, File | null>>({});
  const [actions, setActions] = useState<Record<string, ActionState>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [quota, setQuota] = useState<import("@/lib/api").QuotaInfo | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [draggingOver, setDraggingOver] = useState<Record<string, boolean>>({});
  const [demoLoading, setDemoLoading] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const renameInputRef = useRef<HTMLInputElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [showUpgradedBanner, setShowUpgradedBanner] = useState(() => {
    if (typeof window === "undefined") return false;
    const show = new URLSearchParams(window.location.search).get("upgraded") === "1";
    if (show) window.history.replaceState({}, "", window.location.pathname);
    return show;
  });

  const [datasetSearch, setDatasetSearch] = useState("");
  const [datasetSort, setDatasetSort] = useState<"newest" | "oldest" | "a-z" | "z-a">("newest");

  // Use refs so loadDatasets always reads current search/sort without stale closures
  const searchRef = useRef(datasetSearch);
  const sortRef = useRef(datasetSort);
  searchRef.current = datasetSearch;
  sortRef.current = datasetSort;

  const hasDatasets = useMemo(() => datasets.length > 0, [datasets.length]);

  const setAction = (datasetId: string, patch: Partial<ActionState>) => {
    setActions((prev) => {
      const defaults: ActionState = {
        uploadLoading: false, insightLoading: false, deleteLoading: false,
        renaming: false, renameValue: "", error: "",
      };
      return { ...prev, [datasetId]: { ...defaults, ...prev[datasetId], ...patch } };
    });
  };

  const SORT_CONFIG = {
    newest: { sort: "createdAt" as const, order: "desc" as const },
    oldest: { sort: "createdAt" as const, order: "asc" as const },
    "a-z":  { sort: "name" as const,      order: "asc" as const  },
    "z-a":  { sort: "name" as const,      order: "desc" as const },
  };

  const loadDatasets = async (page = 1) => {
    setPageError("");
    const cfg = SORT_CONFIG[sortRef.current] ?? SORT_CONFIG.newest;
    try {
      const res = await api.listDatasets({
        page,
        pageSize: meta.pageSize,
        sort: cfg.sort,
        order: cfg.order,
        name: searchRef.current || undefined,
      });
      setDatasets(res.data);
      setMeta(res.meta);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    void (async () => {
      try { const meRes = await api.me(); setUser(meRes.user); } catch {}
      await loadDatasets(1);
      api.quota().then((r) => setQuota(r.data)).catch(() => {});
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Re-fetch on search or sort change (debounced 300ms for search)
  useEffect(() => {
    const timer = setTimeout(() => void loadDatasets(1), datasetSearch ? 300 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetSearch, datasetSort]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as Element).tagName.toLowerCase();
      const isTyping =
        ["input", "textarea", "select"].includes(tag) ||
        (e.target as HTMLElement).isContentEditable;

      if (e.key === "?" && !isTyping) {
        e.preventDefault();
        setShowShortcuts((s) => !s);
        return;
      }
      if (e.key === "Escape") {
        setShowShortcuts(false);
        return;
      }
      if (isTyping) return;

      if ((e.key === "n" || e.key === "N") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        nameInputRef.current?.focus();
      }
      if (e.key === "ArrowRight" && !e.metaKey && meta.page < meta.totalPages) {
        void loadDatasets(meta.page + 1);
      }
      if (e.key === "ArrowLeft" && !e.metaKey && meta.page > 1) {
        void loadDatasets(meta.page - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.page, meta.totalPages]);

  const onCreateDataset = async (e: FormEvent) => {
    e.preventDefault();
    setPageError("");
    setCreateLoading(true);
    try {
      await api.createDataset({ name });
      setName("");
      await loadDatasets(1);
      toast({ type: "success", title: "Dataset created", message: `"${name}" is ready for a CSV upload.` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create dataset";
      setPageError(msg);
      toast({ type: "error", title: "Failed to create dataset", message: msg });
    } finally {
      setCreateLoading(false);
    }
  };

  const onUpload = async (datasetId: string) => {
    const file = fileByDataset[datasetId];
    if (!file) { setAction(datasetId, { error: "Select a CSV file first" }); return; }
    setAction(datasetId, { uploadLoading: true, error: "" });
    try {
      const res = await api.uploadDatasetCsv(datasetId, file);
      setFileByDataset((prev) => ({ ...prev, [datasetId]: null }));
      await loadDatasets(meta.page);
      toast({
        type: "success",
        title: "CSV uploaded",
        message: `${res.data.rowCount.toLocaleString()} rows parsed — ready for AI insights.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setAction(datasetId, { error: msg });
      toast({ type: "error", title: "Upload failed", message: msg });
    } finally {
      setAction(datasetId, { uploadLoading: false });
    }
  };

  const onGenerateInsights = async (datasetId: string) => {
    setAction(datasetId, { insightLoading: true, error: "" });
    toast({ type: "info", title: "Generating insights…", message: "FinanceAI is analysing your transactions.", duration: 8000 });
    try {
      await api.generateInsights(datasetId);
      await loadDatasets(meta.page);
      toast({ type: "success", title: "Insights ready", message: "Open the dataset to view your AI analysis." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Insights failed";
      setAction(datasetId, { error: msg });
      toast({ type: "error", title: "Insights failed", message: msg });
    } finally {
      setAction(datasetId, { insightLoading: false });
    }
  };

  const onDeleteDataset = (datasetId: string, datasetName: string) => {
    setDeleteConfirm({ id: datasetId, name: datasetName });
  };

  const onDeleteConfirmed = async () => {
    if (!deleteConfirm) return;
    const { id: datasetId, name: datasetName } = deleteConfirm;
    setDeleteConfirm(null);
    setAction(datasetId, { deleteLoading: true, error: "" });
    try {
      await api.deleteDataset(datasetId);
      await loadDatasets(Math.min(meta.page, Math.ceil((meta.total - 1) / meta.pageSize) || 1));
      toast({ type: "success", title: "Dataset deleted", message: `"${datasetName}" has been permanently removed.` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      setAction(datasetId, { error: msg });
      toast({ type: "error", title: "Delete failed", message: msg });
    } finally {
      setAction(datasetId, { deleteLoading: false });
    }
  };

  const onLoadDemo = async () => {
    setDemoLoading(true);
    try {
      const demoDataset = await api.createDataset({ name: "Demo: Q1 2026 Operating Expenses" });
      const blob = new Blob([DEMO_CSV], { type: "text/csv" });
      const file = new File([blob], "insightstack-demo.csv", { type: "text/csv" });
      await api.uploadDatasetCsv(demoDataset.data.id, file);
      await loadDatasets(1);
      toast({
        type: "success",
        title: "Demo data loaded",
        message: "47 transactions ready — click Open → to explore and generate insights.",
        duration: 6000,
      });
    } catch (err) {
      toast({ type: "error", title: "Could not load demo", message: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setDemoLoading(false);
    }
  };

  const onStartRename = (datasetId: string, currentName: string) => {
    setAction(datasetId, { renaming: true, renameValue: currentName });
    setTimeout(() => renameInputRef.current?.select(), 50);
  };

  const onRenameSubmit = async (datasetId: string) => {
    const newName = actions[datasetId]?.renameValue?.trim();
    if (!newName) { setAction(datasetId, { renaming: false }); return; }
    try {
      await api.renameDataset(datasetId, newName);
      setDatasets((prev) => prev.map((d) => (d.id === datasetId ? { ...d, name: newName } : d)));
    } catch (err) {
      setAction(datasetId, { error: err instanceof Error ? err.message : "Rename failed" });
    } finally {
      setAction(datasetId, { renaming: false });
    }
  };

  const onLogout = async () => {
    try { await api.logout(); } catch {}
    finally { clearToken(); router.replace("/login"); }
  };

  const parsedCount = datasets.filter((d) => d.status === "PARSED").length;
  const failedCount = datasets.filter((d) => d.status === "FAILED").length;
  const totalRows = datasets.reduce((s, d) => s + d.rowCount, 0);

  return (
    <main className="min-h-screen bg-[#050B18] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/" className="mb-2 flex items-center gap-1.5 w-fit">
              <LogoMark size={20} />
              <span className="text-xs font-bold tracking-tight text-zinc-400 transition hover:text-white">Insight<span className="text-blue-400">Stack</span></span>
            </Link>
            <h1 className="text-2xl font-black text-white">
              {user ? `Welcome back, ${user.name.split(" ")[0]}` : "Dashboard"}
            </h1>
            {user && <p className="text-sm text-zinc-500">{user.email}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="hidden sm:inline-flex rounded-lg border border-blue-500/20 bg-blue-500/8 px-3 py-2 text-sm font-semibold text-blue-400 transition hover:bg-blue-500/15"
              >
                Admin Panel
              </Link>
            )}
            <Link href="/dashboard/compare" className="hidden sm:inline-flex rounded-lg border border-white/8 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-400 shadow-sm transition hover:border-white/15 hover:text-white">Compare</Link>
            <Link href="/dashboard/activity" className="hidden sm:inline-flex rounded-lg border border-white/8 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-400 shadow-sm transition hover:border-white/15 hover:text-white">Activity</Link>
            <Link href="/dashboard/settings" className="rounded-lg border border-white/8 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-400 shadow-sm transition hover:border-white/15 hover:text-white">Settings</Link>
            {quota && !quota.isPro && (
              <button
                type="button"
                disabled={upgradeLoading}
                onClick={async () => {
                  setUpgradeLoading(true);
                  try { const res = await api.createCheckoutSession(); window.location.href = res.data.url; }
                  catch { setUpgradeLoading(false); }
                }}
                className="rounded-lg bg-blue-500 px-3 py-2 text-sm font-black text-white shadow-[0_0_16px_rgba(59,130,246,0.4)] transition hover:bg-blue-400 hover:shadow-[0_0_24px_rgba(59,130,246,0.55)] disabled:opacity-50"
              >
                {upgradeLoading ? "…" : "✦ Try Pro"}
              </button>
            )}
            {/* Keyboard shortcuts hint */}
            <button
              type="button"
              onClick={() => setShowShortcuts(true)}
              title="Keyboard shortcuts (?)"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/8 bg-zinc-900 text-xs font-black text-zinc-600 shadow-sm transition hover:border-white/15 hover:text-zinc-300"
            >
              ?
            </button>
            <button type="button" onClick={() => void onLogout()} className="rounded-lg border border-white/8 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-400 shadow-sm transition hover:border-white/15 hover:text-white">Logout</button>
          </div>
        </header>

        {/* ── Upgrade success banner ─────────────────────────────────────── */}
        {showUpgradedBanner && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-300">{"You're now on Pro!"}</p>
                <p className="text-xs text-emerald-600">30 AI insights/day, unlimited datasets, and all features unlocked. Enjoy.</p>
              </div>
            </div>
            <button type="button" onClick={() => setShowUpgradedBanner(false)}
              className="shrink-0 text-emerald-700 transition hover:text-emerald-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        {!pageLoading && (
          <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Datasets", value: meta.total, sub: "in your account", color: "text-white" },
              { label: "Parsed",         value: parsedCount, sub: "ready for insights", color: "text-emerald-400" },
              { label: "Total Rows",     value: totalRows.toLocaleString(), sub: "transactions loaded", color: "text-white" },
              { label: "Failed",         value: failedCount, sub: "upload errors", color: failedCount > 0 ? "text-red-400" : "text-zinc-600" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/6 bg-zinc-900 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">{stat.label}</p>
                <p className={`mt-1.5 text-2xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="mt-0.5 text-xs text-zinc-600">{stat.sub}</p>
              </div>
            ))}
          </section>
        )}

        {/* ── Create dataset ─────────────────────────────────────────────── */}
        <section className="mb-5 rounded-xl border border-white/6 bg-zinc-900 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">New Dataset</h2>
            <span className="text-xs text-zinc-700">Give your spending period a name</span>
          </div>
          <form onSubmit={onCreateDataset} className="flex flex-col gap-2 sm:flex-row">
            <input
              ref={nameInputRef}
              className="flex-1 rounded-xl border border-white/8 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 transition focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="e.g. January 2026 Expenses"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={createLoading}
              className="rounded-xl bg-blue-500 px-6 py-3 text-sm font-black text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] transition hover:bg-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.45)] disabled:opacity-50"
            >
              {createLoading ? "Creating..." : "+ Create"}
            </button>
          </form>
        </section>

        {!pageLoading && (
          <OnboardingChecklist datasets={datasets} totalDatasets={meta.total} />
        )}

        {/* Quota / upgrade strip — always visible for free users */}
        {quota && !quota.isPro && (
          <div className="mb-6 rounded-xl border border-white/6 bg-zinc-900 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-zinc-400">
                    AI Insights — {quota.insightsUsed} / {quota.insightsLimit} used {quota.insightsPeriod}
                  </span>
                  <span className="text-xs text-zinc-600">
                    {quota.datasetCount} / {quota.datasetLimit ?? 3} datasets
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${quota.remaining === 0 ? "bg-red-500" : quota.remaining <= 1 ? "bg-amber-500" : "bg-blue-500"}`}
                    style={{ width: `${Math.min(100, (quota.insightsUsed / quota.insightsLimit) * 100)}%` }}
                  />
                </div>
                {quota.remaining === 0 && (
                  <p className="mt-1.5 text-xs text-red-400">You&apos;ve used all free insights this month.</p>
                )}
              </div>
              <button
                type="button"
                disabled={upgradeLoading}
                onClick={async () => {
                  setUpgradeLoading(true);
                  try { const res = await api.createCheckoutSession(); window.location.href = res.data.url; }
                  catch { setUpgradeLoading(false); }
                }}
                className="shrink-0 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-black text-white shadow-[0_0_16px_rgba(59,130,246,0.3)] transition hover:bg-blue-400 hover:shadow-[0_0_24px_rgba(59,130,246,0.5)] disabled:opacity-50"
              >
                {upgradeLoading ? "Opening…" : "Upgrade to Pro — $9/mo →"}
              </button>
            </div>
          </div>
        )}

        {pageError && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">
            {pageError}
          </div>
        )}

        {/* ── Datasets list ──────────────────────────────────────────────── */}
        <section className="rounded-xl border border-white/6 bg-zinc-900 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-white/5 px-5 py-4">
            <h2 className="font-bold text-white">Your Datasets</h2>
            <span className="text-xs text-zinc-600">
              {datasetSearch ? `${meta.total} match${meta.total !== 1 ? "es" : ""}` : `${meta.total} total`}
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <svg className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="search"
                  placeholder="Search datasets…"
                  value={datasetSearch}
                  onChange={(e) => setDatasetSearch(e.target.value)}
                  className="w-44 rounded-lg border border-white/8 bg-zinc-800 py-1.5 pl-8 pr-3 text-xs text-white placeholder-zinc-600 transition focus:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/15"
                />
                {datasetSearch && (
                  <button
                    type="button"
                    onClick={() => setDatasetSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300"
                    aria-label="Clear search"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {/* Sort */}
              <select
                value={datasetSort}
                onChange={(e) => setDatasetSort(e.target.value as typeof datasetSort)}
                className="rounded-lg border border-white/8 bg-zinc-800 py-1.5 pl-3 pr-7 text-xs text-zinc-300 transition focus:border-blue-500/40 focus:outline-none appearance-none"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="a-z">Name A → Z</option>
                <option value="z-a">Name Z → A</option>
              </select>
            </div>
          </div>

          {pageLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 animate-shimmer rounded-xl" />
              ))}
            </div>
          ) : !hasDatasets ? (
            <EmptyState onLoadDemo={() => void onLoadDemo()} demoLoading={demoLoading} />
          ) : (
            <>
              <div className="divide-y divide-white/4">
                {datasets.map((dataset) => {
                  const state: ActionState = actions[dataset.id] ?? {
                    uploadLoading: false, insightLoading: false, deleteLoading: false,
                    renaming: false, renameValue: "", error: "",
                  };
                  const statusCfg = STATUS_CONFIG[dataset.status] ?? {
                    label: dataset.status,
                    className: "bg-zinc-800 text-zinc-400 ring-1 ring-zinc-700",
                  };
                  const selectedFile = fileByDataset[dataset.id];

                  return (
                    <article key={dataset.id} className="group p-5 transition-colors hover:bg-white/2">
                      {/* Top row */}
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {state.renaming ? (
                            <form
                              onSubmit={(e) => { e.preventDefault(); void onRenameSubmit(dataset.id); }}
                              className="flex items-center gap-2"
                            >
                              <input
                                ref={renameInputRef}
                                className="rounded-lg border border-blue-500/30 bg-zinc-800 px-2.5 py-1.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                value={state.renameValue}
                                onChange={(e) => setAction(dataset.id, { renameValue: e.target.value })}
                                autoFocus
                              />
                              <button type="submit" className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-black text-white hover:bg-blue-400">
                                Save
                              </button>
                              <button type="button" onClick={() => setAction(dataset.id, { renaming: false })} className="rounded-lg border border-white/8 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white">
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h3 className="truncate font-bold text-zinc-100">{dataset.name}</h3>
                              <button
                                type="button"
                                onClick={() => onStartRename(dataset.id, dataset.name)}
                                className="shrink-0 rounded p-0.5 text-zinc-700 opacity-0 transition hover:text-blue-400 group-hover:opacity-100"
                                title="Rename"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                </svg>
                              </button>
                            </div>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${statusCfg.className}`}>
                              {statusCfg.label}
                            </span>
                            <span className="text-xs text-zinc-600">{dataset.rowCount.toLocaleString()} rows</span>
                            <span className="text-xs text-zinc-700">·</span>
                            <span className="text-xs text-zinc-700" title={new Date(dataset.createdAt).toLocaleString()}>
                              {(() => {
                                const diff = Date.now() - new Date(dataset.createdAt).getTime();
                                const mins = Math.floor(diff / 60_000);
                                const hrs = Math.floor(diff / 3_600_000);
                                const days = Math.floor(diff / 86_400_000);
                                if (mins < 1) return "just now";
                                if (hrs < 1) return `${mins}m ago`;
                                if (days < 1) return `${hrs}h ago`;
                                if (days < 30) return `${days}d ago`;
                                return new Date(dataset.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                              })()}
                            </span>
                            {dataset.originalFilename && (
                              <span className="max-w-[200px] truncate text-xs text-zinc-600">{dataset.originalFilename}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <Link
                            href={`/dashboard/datasets/${dataset.id}`}
                            className="rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-black text-white shadow-[0_0_15px_rgba(59,130,246,0.25)] transition hover:bg-blue-400 hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]"
                          >
                            Open →
                          </Link>
                          <button
                            type="button"
                            onClick={() => void onDeleteDataset(dataset.id, dataset.name)}
                            disabled={state.deleteLoading}
                            className="rounded-lg border border-white/8 px-3 py-1.5 text-sm font-medium text-zinc-500 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                          >
                            {state.deleteLoading ? "..." : "Delete"}
                          </button>
                        </div>
                      </div>

                      {/* Actions row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <label
                          className={[
                            "flex flex-1 min-w-[200px] cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition",
                            draggingOver[dataset.id]
                              ? "border-blue-500/50 bg-blue-500/10 text-blue-300"
                              : selectedFile
                              ? "border-emerald-500/30 bg-emerald-500/8 text-emerald-300"
                              : "border-white/6 bg-zinc-800 text-zinc-500 hover:border-white/12 hover:text-zinc-300",
                          ].join(" ")}
                          onDragOver={(e) => { e.preventDefault(); setDraggingOver(prev => ({ ...prev, [dataset.id]: true })); }}
                          onDragEnter={(e) => { e.preventDefault(); setDraggingOver(prev => ({ ...prev, [dataset.id]: true })); }}
                          onDragLeave={() => setDraggingOver(prev => ({ ...prev, [dataset.id]: false }))}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDraggingOver(prev => ({ ...prev, [dataset.id]: false }));
                            const file = e.dataTransfer.files[0];
                            if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
                              setFileByDataset(prev => ({ ...prev, [dataset.id]: file }));
                            }
                          }}
                        >
                          <svg className="h-4 w-4 shrink-0 text-current opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            {draggingOver[dataset.id] ? (
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                            )}
                          </svg>
                          <span className="truncate text-xs">
                            {draggingOver[dataset.id]
                              ? "Drop to attach…"
                              : selectedFile
                              ? selectedFile.name
                              : "Choose or drop CSV…"}
                          </span>
                          <input
                            type="file"
                            accept=".csv,text/csv"
                            onChange={(e) =>
                              setFileByDataset((prev) => ({ ...prev, [dataset.id]: e.target.files?.[0] ?? null }))
                            }
                            className="sr-only"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => void onUpload(dataset.id)}
                          disabled={state.uploadLoading || !selectedFile}
                          className="rounded-lg border border-white/8 bg-zinc-800 px-3 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {state.uploadLoading ? "Uploading…" : "Upload CSV"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void onGenerateInsights(dataset.id)}
                          disabled={state.insightLoading || dataset.status !== "PARSED"}
                          className="rounded-lg bg-cyan-500 px-3 py-2.5 text-sm font-black text-white shadow-[0_0_15px_rgba(6,182,212,0.25)] transition hover:bg-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] disabled:cursor-not-allowed disabled:opacity-40"
                          title={dataset.status !== "PARSED" ? "Upload a CSV first" : "Up to 30 AI analyses per day"}
                        >
                          {state.insightLoading ? "Generating…" : "✦ AI Insights"}
                        </button>
                      </div>

                      {state.error && (
                        <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 ring-1 ring-red-500/20">
                          {state.error}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>

              {/* Pagination */}
              {meta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-white/5 px-5 py-3 text-sm text-zinc-600">
                  <p>Page {meta.page} of {meta.totalPages} &middot; {meta.total} total</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={meta.page <= 1}
                      onClick={() => void loadDatasets(meta.page - 1)}
                      className="rounded-lg border border-white/8 px-3 py-1.5 font-medium transition hover:bg-zinc-800 disabled:opacity-40"
                    >
                      ← Prev
                    </button>
                    <button
                      type="button"
                      disabled={meta.page >= meta.totalPages}
                      onClick={() => void loadDatasets(meta.page + 1)}
                      className="rounded-lg border border-white/8 px-3 py-1.5 font-medium transition hover:bg-zinc-800 disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {deleteConfirm && (
        <DeleteModal
          name={deleteConfirm.name}
          onConfirm={() => void onDeleteConfirmed()}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {showShortcuts && (
        <ShortcutsPanel onClose={() => setShowShortcuts(false)} />
      )}
    </main>
  );
}
