import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navigation from "@/components/Navigation";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Field Shift | Cruz Alta-RS",
  description:
    "Ferramenta de decisao para rotacao de culturas usando 44 anos de dados da NASA. NASA Space Apps Challenge 2026.",
  openGraph: {
    title: "Field Shift | Cruz Alta-RS",
    description:
      "Ferramenta de decisao para rotacao de culturas usando 44 anos de dados da NASA. NASA Space Apps Challenge 2026.",
    siteName: "Field Shift",
    locale: "pt_BR",
    type: "website",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Navigation />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
        <footer className="border-t border-border bg-bg-surface px-4 py-6 text-center text-xs text-text-dim">
          <p>
            Field Shift — NASA Space Apps Challenge 2026 — Cruz Alta-RS, Brasil
          </p>
          <p className="mt-1">
            Dados: NASA POWER, IBGE SIDRA, SoilGrids (ISRIC), INMET
          </p>
        </footer>
      </body>
    </html>
  );
}
