"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import { createClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

export type AuthMode = "sign-in" | "sign-up" | "forgot-password" | "reset-password" | "verify-email";

const labels: Record<AuthMode, { title: string; description: string; button: string }> = {
  "sign-in": { title: "Welcome back", description: "Sign in to access your Anti Logic workspace.", button: "Sign in" },
  "sign-up": { title: "Create your workspace", description: "Start with a secure account and a demo-first workflow.", button: "Create account" },
  "forgot-password": { title: "Reset your password", description: "Request a secure password reset email.", button: "Send reset link" },
  "reset-password": { title: "Choose a new password", description: "Use a secure password that you do not use elsewhere.", button: "Update password" },
  "verify-email": { title: "Check your email", description: "Follow the verification link to finish setting up your account.", button: "Back to sign in" },
};

function safeNext() {
  const value = new URLSearchParams(window.location.search).get("next");
  return value && value.startsWith("/app") && !value.startsWith("//") ? value : "/app";
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseBrowserConfigured();
  const copy = labels[mode];

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("error");
    if (code === "auth_not_configured") setError("Authentication is not configured. Add the dedicated Anti Logic Supabase URL and publishable key.");
    else if (code) setError("The authentication link could not be completed. Please try again or request a new link.");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!configured) {
      setError("Supabase is not configured for Anti Logic yet. Authentication cannot complete until its dedicated project keys are added.");
      return;
    }
    if (mode === "sign-up" && password.length < 12) {
      setError("Use a password with at least 12 characters.");
      return;
    }
    if (mode === "reset-password" && password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError("Authentication configuration is missing.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "sign-in") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        router.replace(safeNext());
        router.refresh();
      } else if (mode === "sign-up") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin + "/api/auth/callback?next=/app",
            data: { display_name: displayName.trim() },
          },
        });
        if (authError) throw authError;
        if (data.session) {
          router.replace("/app");
          router.refresh();
        } else {
          setMessage("Account request received. Check your email for the verification link before signing in.");
        }
      } else if (mode === "forgot-password") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin + "/api/auth/callback?next=/auth/reset-password",
        });
        if (authError) throw authError;
        setMessage("If an account matches that address, a password-reset email will be sent.");
      } else if (mode === "reset-password") {
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
        setMessage("Password updated. You can now sign in with your new password.");
        setPassword("");
        setConfirmPassword("");
      } else {
        router.replace("/auth/sign-in");
      }
    } catch (caught) {
      const errorMessage = caught instanceof Error ? caught.message : "The request could not be completed.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const showEmail = mode !== "reset-password" && mode !== "verify-email";
  const showPassword = mode === "sign-in" || mode === "sign-up" || mode === "reset-password";

  return (
    <main className="container auth-page">
      <div className="auth-wrap">
        <Link href="/" className="auth-back"><ArrowLeft size={14}/> Back to Anti Logic</Link>
        <div className="panel auth-card">
          <Link href="/" className="brand"><span className="brand-mark">A</span><span>anti logic<span style={{color:"var(--lime)"}}>.</span></span></Link>
          <h1>{copy.title}</h1>
          <p className="muted auth-description">{copy.description}</p>
          {mode === "verify-email" ? (
            <div className="auth-verification"><CheckCircle2 size={25} color="var(--lime)"/><p>Verification is completed through the link sent by Supabase Auth. After verifying, return to sign in.</p><Link href="/auth/sign-in" className="btn btn-primary">Go to sign in</Link></div>
          ) : (
            <form onSubmit={submit}>
              {mode === "sign-up" && <div className="form-field"><label htmlFor="display-name">Display name</label><input id="display-name" autoComplete="name" maxLength={80} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name"/></div>}
              {showEmail && <div className="form-field"><label htmlFor="email">Email address</label><input required id="email" type="email" autoComplete="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"/></div>}
              {showPassword && <div className="form-field"><label htmlFor="password">{mode === "reset-password" ? "New password" : "Password"}</label><input required id="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={mode === "sign-in" ? 1 : 12} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "sign-in" ? "Your password" : "At least 12 characters"}/></div>}
              {mode === "reset-password" && <div className="form-field"><label htmlFor="confirm-password">Confirm new password</label><input required id="confirm-password" type="password" autoComplete="new-password" minLength={12} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat your new password"/></div>}
              {mode === "sign-up" && <p className="form-consent">By creating an account, you agree to the <Link href="/legal/terms">Terms</Link> and <Link href="/legal/privacy">Privacy Policy</Link>.</p>}
              {error && <div role="alert" className="form-errors">{error}</div>}
              {message && <div role="status" className="success-note"><CheckCircle2 size={15}/>{message}</div>}
              {!configured && <div className="notice auth-notice">The Supabase auth workflow is wired in code, but it is not active until the dedicated Anti Logic project URL and publishable key are configured.</div>}
              <button className="btn btn-primary auth-submit" disabled={loading || !configured} type="submit">{loading ? <><LoaderCircle className="spin" size={15}/> Working…</> : copy.button}</button>
            </form>
          )}
          <div className="auth-links">
            {mode !== "sign-in" && <Link href="/auth/sign-in">Sign in</Link>}
            {mode !== "sign-up" && <Link href="/auth/sign-up">Create account</Link>}
            {mode !== "forgot-password" && mode !== "verify-email" && <Link href="/auth/forgot-password">Forgot password?</Link>}
          </div>
          <div className="auth-secure"><ShieldCheck size={14}/> Account security is handled through the configured Supabase Auth project.</div>
        </div>
      </div>
    </main>
  );
}
