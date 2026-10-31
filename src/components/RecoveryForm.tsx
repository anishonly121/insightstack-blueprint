"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { PublicFrame } from "./PublicFrame";
import { ProductIcon } from "./ProductIcon";

export function RecoveryForm({
  mode,
  token = "",
  initialEmail = "",
}: {
  mode: "request" | "reset";
  token?: string;
  initialEmail?: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const invalid = mode === "reset" && (!token || !initialEmail);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (mode === "reset" && password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(
        `/api/auth/${mode === "request" ? "forgot-password" : "reset-password"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "request"
              ? { email }
              : { email, token, newPassword: password },
          ),
        },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(
          result?.error?.message ??
            "Unable to process the request. Please try again.",
        );
      setSuccess(true);
      setPassword("");
      setConfirm("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to process the request.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <PublicFrame>
      <section className="auth-card recovery-card">
        <div className="recovery-icon">
          <ProductIcon name="shield" size={26} />
        </div>
        <p className="eyebrow">ACCOUNT ACCESS</p>
        <h1>
          {invalid
            ? "This link is incomplete."
            : success
              ? mode === "request"
                ? "Check your inbox."
                : "Your password is updated."
              : mode === "request"
                ? "Let’s get you back in."
                : "Choose a new password."}
        </h1>
        {invalid ? (
          <>
            <p>
              Request a fresh reset link using the email address for your
              account.
            </p>
            <Link
              className="product-button primary auth-submit"
              href="/forgot-password"
            >
              Request a new link
            </Link>
          </>
        ) : success ? (
          <div role="status">
            <p>
              {mode === "request"
                ? "If the address matches an account, you should receive a reset link. Check your spam folder too. If it does not arrive, try again later."
                : "Sign in with your new password to return to your workspace."}
            </p>
            <Link className="product-button primary auth-submit" href="/login">
              Back to sign in <ProductIcon name="arrow" size={16} />
            </Link>
          </div>
        ) : (
          <>
            <p>
              {mode === "request"
                ? "Enter your account email to request a password reset link."
                : `Updating access for ${email}. Use at least 8 characters.`}
            </p>
            <form onSubmit={submit}>
              {mode === "request" ? (
                <div className="auth-field">
                  <label htmlFor="recovery-email">Email address</label>
                  <input
                    id="recovery-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <>
                  <div className="auth-field">
                    <label htmlFor="new-password">New password</label>
                    <input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="auth-field">
                    <label htmlFor="confirm-password">
                      Confirm new password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}
              {error && (
                <p role="alert" className="auth-error">
                  {error}
                </p>
              )}
              <button
                className="product-button primary auth-submit"
                disabled={busy}
              >
                {busy
                  ? "Please wait…"
                  : mode === "request"
                    ? "Send reset link"
                    : "Update password"}
                <ProductIcon name="arrow" size={16} />
              </button>
            </form>
            <Link href="/login" className="recovery-back">
              Back to sign in
            </Link>
          </>
        )}
      </section>
    </PublicFrame>
  );
}
