"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Send only non-sensitive operational metadata to the browser console.
    console.error("Anti Logic page error", { digest: error.digest || "unavailable" });
  }, [error]);

  return <main className="container error-shell"><section className="panel error-card"><div className="feature-icon"><AlertTriangle size={19}/></div><div className="eyebrow">Something went wrong</div><h1 className="section-title">This page could not load.</h1><p className="muted">Your account and trading state have not been changed by this error screen. Try again or return to the workspace.</p><div className="error-actions"><button className="btn btn-primary" onClick={() => reset()}><RefreshCw size={14}/> Try again</button><Link className="btn" href="/app">Workspace overview</Link></div>{error.digest && <p className="field-hint">Reference: {error.digest}</p>}</section></main>;
}
