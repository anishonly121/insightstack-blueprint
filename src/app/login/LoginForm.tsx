"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";
import { safeReturnPath } from "@/lib/navigation";
import { ProductIcon as Icon } from "@/components/ProductIcon";
import "../product.css";

export function LoginForm({
  initialMode,
}: {
  initialMode: "login" | "register";
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response =
        mode === "login"
          ? await api.login({ email, password })
          : await api.register({ name, email, password });
      setToken(response.token);
      router.push(
        safeReturnPath(new URLSearchParams(window.location.search).get("next")),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }
  const strength =
    password.length < 8
      ? 1
      : password.length >= 12 &&
          /[A-Z]/.test(password) &&
          /[0-9]/.test(password)
        ? 3
        : 2;
  return (
    <div className="insight-public auth-page">
      <aside className="auth-story">
        <Link href="/" className="product-brand">
          <span className="brand-glyph">
            <Icon name="chart" />
          </span>
          insightstack<span className="brand-dot">.</span>
        </Link>
        <div>
          <p className="eyebrow">A LITTLE CLARITY GOES A LONG WAY</p>
          <h2>
            Your next chapter.
            <br />
            In better focus.
          </h2>
          <p>
            Bring your transactions together. Understand the patterns. Make a
            plan that starts with your numbers.
          </p>
          <div className="auth-principles">
            <span>
              <Icon name="shield" size={18} /> No bank credentials required
            </span>
            <span>
              <Icon name="chart" size={18} /> A clear view of your cash flow
            </span>
            <span>
              <Icon name="spark" size={18} /> Insights you can understand
            </span>
          </div>
        </div>
        <p className="auth-signature">Designed and built by Anish Bhole.</p>
      </aside>
      <main className="auth-main">
        <div className="auth-card">
          <Link href="/" className="auth-back">
            ← Back to InsightStack
          </Link>
          <p className="eyebrow">YOUR WORKSPACE AWAITS</p>
          <h1>
            {mode === "login"
              ? "Welcome back."
              : "A fresh perspective starts here."}
          </h1>
          <p>
            {mode === "login"
              ? "Sign in to pick up where you left off."
              : "Create an account to analyse your own transaction data."}
          </p>
          <div className="auth-tabs" aria-label="Account action">
            {(["login", "register"] as const).map((value) => (
              <button
                key={value}
                type="button"
                disabled={loading}
                aria-pressed={mode === value}
                className={mode === value ? "active" : ""}
                onClick={() => {
                  setMode(value);
                  setError("");
                }}
              >
                {value === "login" ? "Log in" : "Create account"}
              </button>
            ))}
          </div>
          <form onSubmit={onSubmit} aria-busy={loading}>
            {mode === "register" && (
              <div className="auth-field">
                <label htmlFor="full-name">Full name</label>
                <input
                  id="full-name"
                  autoComplete="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  maxLength={100}
                />
              </div>
            )}
            <div className="auth-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="password-input">
                <input
                  id="password"
                  type={visible ? "text" : "password"}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={mode === "register" ? 8 : 1}
                  disabled={loading}
                  aria-describedby={
                    mode === "register" ? "password-help" : undefined
                  }
                />
                <button
                  type="button"
                  aria-label={visible ? "Hide password" : "Show password"}
                  aria-pressed={visible}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? "Hide" : "Show"}
                </button>
              </div>
              {mode === "register" && (
                <p className="password-help" id="password-help">
                  Use at least 8 characters.
                  {password &&
                    ` Strength: ${strength === 1 ? "short" : strength === 2 ? "good" : "strong"}.`}
                </p>
              )}
            </div>
            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="product-button primary auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
              <Icon name="arrow" size={17} />
            </button>
            {mode === "login" && (
              <Link href="/forgot-password" className="forgot-link">
                Forgot your password?
              </Link>
            )}
          </form>
          <div className="auth-demo">
            <Icon name="grid" size={21} />
            <div>
              <strong>Just taking a look?</strong>
              <p>Explore a complete sample workspace, no sign-up needed.</p>
              <Link href="/demo">
                Open the interactive demo <Icon name="arrow" size={14} />
              </Link>
            </div>
          </div>
          <p className="auth-legal">
            By using InsightStack, you agree to the{" "}
            <Link href="/terms">Terms</Link> and{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
