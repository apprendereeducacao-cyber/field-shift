"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Idioma da interface. Padrão: inglês (regra do NASA Space Apps).
export type Lang = "en" | "pt";

const STORAGE_KEY = "stellaroot_lang";

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Escolhe o texto do idioma atual: t("English", "Português"). */
  t: (en: string, pt: string) => string;
};

const LangContext = createContext<LangContextValue>({
  lang: "en",
  setLang: () => {},
  t: (en) => en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Lê a escolha salva depois de montar (SSR sempre sai em inglês).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com localStorage, só no cliente
      if (saved === "pt" || saved === "en") setLangState(saved);
    } catch {
      /* localStorage indisponível: fica em inglês */
    }
  }, []);

  // <html lang> acompanha o idioma.
  useEffect(() => {
    document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignora */
    }
  }, []);

  const t = useCallback((en: string, pt: string) => (lang === "pt" ? pt : en), [lang]);

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

/** Rótulo de opção com as duas línguas. */
export type Bilingual = { en: string; pt: string };

/** Texto livre só no cliente (rodapé do layout, que é server component). */
export function T({ en, pt }: Bilingual) {
  const { t } = useLang();
  return <>{t(en, pt)}</>;
}
