"use client";

import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "warning" | "info";

export type ToastItem = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
};

type ToastContextValue = {
  toast: (opts: Omit<ToastItem, "id" | "duration"> & { duration?: number }) => void;
  dismiss: (id: string) => void;
};

// ── Context ───────────────────────────────────────────────────────────────────

const ToastCtx = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// ── Visual config ─────────────────────────────────────────────────────────────

const TOAST_CONFIG: Record<ToastType, {
  border: string;
  iconColor: string;
  iconPath: string;
}> = {
  success: {
    border: "border-l-emerald-400",
    iconColor: "text-emerald-400",
    iconPath: "M4.5 12.75l6 6 9-13.5",
  },
  error: {
    border: "border-l-red-400",
    iconColor: "text-red-400",
    iconPath: "M6 18L18 6M6 6l12 12",
  },
  warning: {
    border: "border-l-amber-400",
    iconColor: "text-amber-400",
    iconPath: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
  },
  info: {
    border: "border-l-blue-400",
    iconColor: "text-blue-400",
    iconPath: "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z",
  },
};

// ── Single toast ──────────────────────────────────────────────────────────────

function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const enter = requestAnimationFrame(() => setVisible(true));

    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 350);
    }, item.duration);

    return () => {
      cancelAnimationFrame(enter);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [item.duration, onDismiss]);

  const cfg = TOAST_CONFIG[item.type];

  const handleClose = () => {
    setVisible(false);
    setTimeout(onDismiss, 350);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        "flex w-80 items-start gap-3 rounded-xl border-l-[3px] bg-[#0D1B2E]",
        "px-4 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.55)]",
        "ring-1 ring-white/[0.07]",
        "transition-all duration-350 ease-out",
        cfg.border,
        visible
          ? "translate-x-0 opacity-100 scale-100"
          : "translate-x-5 opacity-0 scale-95",
      ].join(" ")}
    >
      {/* Icon */}
      <svg
        className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.iconColor}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={cfg.iconPath} />
      </svg>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{item.title}</p>
        {item.message && (
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{item.message}</p>
        )}
      </div>

      {/* Close */}
      <button
        type="button"
        onClick={handleClose}
        aria-label="Dismiss"
        className="mt-0.5 shrink-0 text-zinc-600 transition hover:text-zinc-300"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((
    opts: Omit<ToastItem, "id" | "duration"> & { duration?: number },
  ) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts(prev => [...prev, { ...opts, id, duration: opts.duration ?? 4000 }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastCtx.Provider value={{ toast, dismiss }}>
      {children}
      {/* Toast stack — bottom-right on desktop, bottom-center on mobile */}
      <div
        className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-2 sm:right-6"
        aria-label="Notifications"
      >
        {toasts.map(item => (
          <div key={item.id} className="pointer-events-auto">
            <Toast item={item} onDismiss={() => dismiss(item.id)} />
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
