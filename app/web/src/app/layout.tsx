import type { Metadata } from "next";
import localFont from "next/font/local";
import Navigation from "@/components/Navigation";
import { LanguageProvider, T } from "@/lib/i18n";
import "./globals.css";

const manrope = localFont({
  src: "./fonts/Manrope-VariableFont_wght.ttf",
  variable: "--font-manrope",
  weight: "200 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stella Root | Cruz Alta-RS",
  description:
    "Agroclimatic tool: crop rotation backed by 44 years of NASA data. NASA Space Apps Challenge 2026.",
  openGraph: {
    title: "Stella Root | Cruz Alta-RS",
    description:
      "Agroclimatic tool: crop rotation backed by 44 years of NASA data. NASA Space Apps Challenge 2026.",
    siteName: "Stella Root",
    locale: "en_US",
    alternateLocale: ["pt_BR"],
    type: "website",
  },
  icons: {
    icon: "/brand/stella-root-symbol.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} h-full antialiased`} style={{ fontFamily: "var(--font-manrope), ui-sans-serif, system-ui, sans-serif" }}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <LanguageProvider>
          <Navigation />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border px-4 py-4 text-center text-[11px] text-muted-foreground">
            <T en="Stella Root — Cruz Alta, RS, Brazil | NASA Space Apps 2026" pt="Stella Root — Cruz Alta-RS | NASA Space Apps 2026" />
          </footer>
        </LanguageProvider>
      </body>
    </html>
  );
}
