"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";

function Brand({ onClick }: { onClick?: () => void }) {
  return <Link href="/" className="brand" onClick={onClick}><span className="brand-mark">A</span><span>anti logic<span style={{color:"var(--lime)"}}>.</span></span></Link>;
}

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  return <header className="site-header"><div className="container public-header-inner">
    <Brand onClick={() => setOpen(false)} />
    <nav className={"nav-links public-header-nav " + (open ? "public-mobile-open" : "")} aria-label="Main navigation">
      <Link href="/platform" onClick={() => setOpen(false)}>Platform</Link>
      <Link href="/features" onClick={() => setOpen(false)}>Features</Link>
      <Link href="/blog" onClick={() => setOpen(false)}>Research</Link>
      <Link href="/docs" onClick={() => setOpen(false)}>Docs</Link>
      <Link href="/pricing" onClick={() => setOpen(false)}>Pricing</Link>
    </nav>
    <div className="public-header-actions"><Link className="btn hide-mobile" href="/auth/sign-in">Sign in</Link><Link className="btn btn-primary" href="/auth/sign-up">Get started <ArrowRight size={14}/></Link><button className="icon-action public-menu-toggle" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} onClick={() => setOpen((v) => !v)}>{open ? <X size={17}/> : <Menu size={17}/>}</button></div>
  </div></header>;
}
