import Link from "next/link";
import AccountMenu from "@/app/components/AccountMenu";

export default function AppHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="inline-flex items-center"
        >
          <img src="/huginn-logo.png" alt="Huginn AI" className="h-10 w-auto rounded-lg" />
          <span className="ml-2 text-lg font-bold text-slate-900">Huginn AI</span>
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Analyzer
          </Link>

          <Link
            href="/pricing"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Pricing
          </Link>

          <AccountMenu />
        </nav>
      </div>
    </header>
  );
}