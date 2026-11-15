"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Inicio" },
  { href: "/painel", label: "Painel" },
  { href: "/produtor", label: "Sua Lavoura" },
  { href: "/dados", label: "Dados" },
  { href: "/mapa", label: "Mapa" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

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
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-stone-300 hover:text-white md:hidden"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
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
