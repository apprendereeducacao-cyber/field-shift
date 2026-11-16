"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLanguage, t } from "@/lib/i18n";

export default function Navigation() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang, setLang } = useLanguage();

  const NAV_ITEMS = [
    { href: "/", label: t(lang, "nav.inicio") },
    { href: "/mapa", label: t(lang, "nav.mapa") },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-shell" style={{ height: 72 }}>
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-4 sm:px-10">
        <Link href="/" className="flex items-center">
          <Image
            src="/brand/stella-root-lockup-horizontal-white.png"
            alt="Stella Root"
            width={140}
            height={28}
            className="h-7 w-auto"
            priority
          />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-full px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? "font-semibold text-white"
                    : "text-stone-300 hover:text-white"
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-lime-signal" />
                )}
              </Link>
            );
          })}

          <button
            onClick={() => setLang(lang === "pt" ? "en" : "pt")}
            className="ml-3 flex items-center gap-1.5 rounded-full border border-stone-600 px-3 py-1.5 text-xs font-semibold text-stone-300 transition-colors hover:border-stone-400 hover:text-white"
          >
            <span className="uppercase">{lang === "pt" ? "EN" : "PT"}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setLang(lang === "pt" ? "en" : "pt")}
            className="flex h-10 items-center gap-1 rounded-full border border-stone-600 px-3 text-xs font-semibold text-stone-300 transition-colors hover:border-stone-400 hover:text-white"
          >
            <span className="uppercase">{lang === "pt" ? "EN" : "PT"}</span>
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-stone-300 hover:text-white"
            aria-label={menuOpen ? t(lang, "nav.fechar_menu") : t(lang, "nav.abrir_menu")}
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 5h14M3 10h14M3 15h14" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="bg-shell px-4 pb-4 pt-2 md:hidden">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm transition-colors ${
                  isActive ? "font-semibold text-white" : "text-stone-300 hover:text-white"
                }`}
              >
                {isActive && <span className="h-1.5 w-1.5 rounded-full bg-lime-signal" />}
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
