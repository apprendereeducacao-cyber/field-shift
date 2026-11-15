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
      <body className="flex min-h-full flex-col bg-bg-base text-text-primary">
        <Navigation />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border px-4 py-4 text-center text-[11px] text-text-dim">
          Field Shift — Cruz Alta-RS | NASA Space Apps 2026
        </footer>
      </body>
    </html>
  );
}
