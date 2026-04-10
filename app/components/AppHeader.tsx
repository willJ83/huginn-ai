"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import AccountMenu from "@/app/components/AccountMenu";
import ThemeToggle from "@/app/components/ThemeToggle";

export default function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href={session ? "/dashboard" : "/"} className="inline-flex shrink-0 items-center">
          <img src="/huginn-logo.png" alt="Huginn AI" className="h-10 w-auto rounded-lg" />
          <span className="ml-2 text-lg font-bold text-slate-900 dark:text-slate-50">Huginn AI</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex">
          <Link
            href="/shield"
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
          >
            <span aria-hidden="true">🛡️</span> Shield
          </Link>
          <Link
            href="/pricing"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Pricing
          </Link>
          <Link
            href="/demo"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Demo
          </Link>
          <ThemeToggle />
          <AccountMenu />
        </nav>

        {/* Mobile: theme toggle + account + hamburger */}
        <div className="flex items-center gap-1 sm:hidden">
          <ThemeToggle />
          <AccountMenu />
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {menuOpen ? (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="flex flex-col gap-1 border-t border-slate-100 px-6 py-3 dark:border-slate-800 sm:hidden">
          <Link
            href="/shield"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
          >
            <span aria-hidden="true">🛡️</span> Shield
          </Link>
          <Link
            href="/pricing"
            onClick={() => setMenuOpen(false)}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Pricing
          </Link>
          <Link
            href="/demo"
            onClick={() => setMenuOpen(false)}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Demo
          </Link>
        </div>
      )}
    </header>
  );
}
