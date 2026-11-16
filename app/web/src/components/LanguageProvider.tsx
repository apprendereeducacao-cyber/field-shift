"use client";

import { useState, useEffect, type ReactNode } from "react";
import { LanguageContext, type Lang } from "@/lib/i18n";

const STORAGE_KEY = "stellaroot_lang";

export default function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "pt") setLangState(saved);
    } catch {}
  }, []);

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
