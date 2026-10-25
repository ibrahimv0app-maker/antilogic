"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import { createClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

export function UserMenu() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const configured = isSupabaseBrowserConfigured();

  useEffect(() => {
    if (!configured) return;
    const supabase = createClient();
    if (!supabase) return;
    let alive = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (alive) setEmail(data.user?.email || "");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (alive) setEmail(session?.user?.email || "");
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, [configured]);

  async function signOut() {
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    setBusy(false);
    if (error) return;
    setOpen(false);
    router.replace("/auth/sign-in");
    router.refresh();
  }

  return <div className="user-menu">
    <button className="profile-chip" type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <span className="profile-chip-avatar"><UserRound size={14}/></span>
      <span className="profile-chip-text">{email ? email.split("@")[0] : "My account"}</span>
    </button>
    {open && <div className="user-menu-popover" role="menu">
      {email && <div className="user-menu-email">{email}</div>}
      <Link role="menuitem" href="/app/account" onClick={() => setOpen(false)}>Profile & account</Link>
      <Link role="menuitem" href="/app/settings" onClick={() => setOpen(false)}>Settings</Link>
      {configured && email ? <button role="menuitem" type="button" onClick={() => void signOut()} disabled={busy}><LogOut size={14}/>{busy ? "Signing out…" : "Sign out"}</button> : <div className="user-menu-hint">Preview mode · not signed in</div>}
    </div>}
  </div>;
}
