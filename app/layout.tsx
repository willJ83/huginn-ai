import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Providers from "./providers";
import { auth } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Huginn Shield — Protect Your Business Before You Sign",
  description: "AI-powered contract risk scanner for small businesses. Instant scan, 50-state analysis, Florida-focused.",
  manifest: "/manifest.json",
  metadataBase: new URL("https://huginn-ai.vercel.app"),
  openGraph: {
    title: "Huginn Shield — Protect Your Business Before You Sign",
    description: "AI-powered contract risk scanner for small businesses. Instant scan, 50-state analysis, Florida-focused.",
    images: '/og/huginnvercel',   // ← uses the exact name you have right now
    type: 'website',
    siteName: 'Huginn Shield',
    locale: 'en_US',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    // suppressHydrationWarning is required because next-themes adds class="dark"
    // on the client after reading localStorage, which would otherwise cause a
    // React hydration mismatch warning.
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="Huginn Shield" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Shield" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)" />
        <link rel="apple-touch-icon" sizes="180x180" href="/huginn-logo.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(()=>{})}`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers session={session}>
          {children}
          <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-600 dark:text-slate-400 sm:px-6 md:flex-row md:items-center md:justify-between">
              <p>© 2026 Odens Eye Creative</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                This tool is not a substitute for professional legal advice.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link href="/privacy" className="font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Terms of Service
                </Link>
                <Link href="/contact" className="font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Contact
                </Link>
              </div>
              <a
                href="mailto:support@odenseyecreative.com"
                className="font-medium text-slate-700 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
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
