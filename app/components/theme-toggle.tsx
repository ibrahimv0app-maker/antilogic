"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "anti-logic:theme:v1";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    let value: "dark" | "light" = "dark";
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved === "light" || saved === "dark") value = saved;
    } catch {}
    document.documentElement.dataset.theme = value;
    setTheme(value);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { window.localStorage.setItem(KEY, next); } catch {}
    setTheme(next);
  }

  return <button type="button" className="icon-action" onClick={toggle} aria-label={"Switch to " + (theme === "dark" ? "light" : "dark") + " theme"} title="Toggle theme">{theme === "dark" ? <Sun size={15}/> : <Moon size={15}/>}</button>;
}
