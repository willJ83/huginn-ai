"use client";

import { Session } from "next-auth";

interface NavbarProps {
  session: Session | null;
  onLogin: () => void;
  onLogout: () => void;
}

export default function Navbar({ session, onLogin, onLogout }: NavbarProps) {
  return (
    <nav className="w-full border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2">
          <img
            src="/huginn-logo.png"
            alt="Huginn AI"
            className="h-10 w-auto"
          />

          <span className="font-semibold text-gray-900 text-xl">
            Huginn <span className="text-blue-600">AI</span>
          </span>
        </a>

        <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <a href="#features" className="hover:text-blue-600">
            Features
          </a>

          <a href="#pricing" className="hover:text-blue-600">
            Pricing
          </a>

          {session ? (
            <button
              onClick={onLogout}
              className="text-slate-700 hover:text-black transition"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="text-slate-700 hover:text-black transition"
            >
              Login
            </button>
          )}

          <button
            onClick={onLogin}
            className="rounded-xl bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition"
          >
            Start Free
          </button>
        </div>
      </div>
    </nav>
  );
}