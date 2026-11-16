import type { Metadata } from "next";
import localFont from "next/font/local";
import Navigation from "@/components/Navigation";
import LanguageProvider from "@/components/LanguageProvider";
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
    "Instrumento agroclimatico: rotacao de culturas com 44 anos de dados da NASA. NASA Space Apps Challenge 2026.",
  openGraph: {
    title: "Stella Root | Cruz Alta-RS",
    description:
      "Instrumento agroclimatico: rotacao de culturas com 44 anos de dados da NASA. NASA Space Apps Challenge 2026.",
    siteName: "Stella Root",
    locale: "pt_BR",
    type: "website",
  },
  icons: {
    icon: "/brand/stella-root-symbol.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} h-full antialiased`} style={{ fontFamily: "var(--font-manrope), ui-sans-serif, system-ui, sans-serif" }}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <LanguageProvider>
          <Navigation />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border px-4 py-4 text-center text-[11px] text-muted-foreground">
            Stella Root — Cruz Alta-RS | NASA Space Apps 2026
          </footer>
        </LanguageProvider>
      </body>
    </html>
  );
}
