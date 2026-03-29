import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Huginn AI",
  description: "AI-powered contract analysis — identify risks, compliance issues, and critical deadlines in seconds",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-600 sm:px-6 md:flex-row md:items-center md:justify-between">
              <p>© 2026 Odens Eye Creative</p>
              <p className="text-xs text-slate-400">This tool is not a substitute for professional legal advice.</p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/privacy"
                  className="font-medium text-blue-600 transition hover:text-blue-700"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="font-medium text-blue-600 transition hover:text-blue-700"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/contact"
                  className="font-medium text-blue-600 transition hover:text-blue-700"
                >
                  Contact
                </Link>
              </div>

              <a
                href="mailto:support@odenseyecreative.com"
                className="font-medium text-slate-700 transition hover:text-slate-900"
              >
                support@odenseyecreative.com
              </a>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
