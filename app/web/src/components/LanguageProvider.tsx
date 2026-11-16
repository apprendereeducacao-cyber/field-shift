"use client";

import { useState, useEffect, type ReactNode } from "react";
import { LanguageContext, type Lang } from "@/lib/i18n";

const STORAGE_KEY = "stellaroot_lang";

// Default language by address: the old link (shieldshift.vercel.app) was shared with
// Brazilian stakeholders, so it opens in Portuguese; stellaroot.vercel.app (the submission)
// opens in English. "?lang=pt" or "?lang=en" in the URL also works. The visitor's own
// choice (saved by the switcher) always wins.
function defaultLang(): Lang {
  const param = new URLSearchParams(window.location.search).get("lang");
  if (param === "en" || param === "pt") return param;
  return window.location.hostname.startsWith("shieldshift") ? "pt" : "en";
}

export default function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "pt") setLangState(saved);
      else setLangState(defaultLang());
    } catch {
      setLangState(defaultLang());
    }
  }, []);

  // Keep <html lang> in sync with the language on screen (screen readers, browser translation).
  useEffect(() => {
    document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
  }, [lang]);

  function setLang(newLang: Lang) {
    setLangState(newLang);
    try { localStorage.setItem(STORAGE_KEY, newLang); } catch {}
  }

  return (
    <LanguageContext value={{ lang, setLang }}>
      {children}
    </LanguageContext>
  );
}
