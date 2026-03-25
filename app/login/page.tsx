"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountCreated = searchParams.get("created") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email or password is incorrect.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Log in to Huginn AI</h1>
        <p className="mt-2 text-sm text-slate-600">
          Access your dashboard and contract analysis tools.
        </p>

        {accountCreated && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <p className="font-medium">Account created. You are good to go - log in below.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="email"
            placeholder="Email address"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Your password"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Log In
          </button>

          <p className="text-right text-sm">
            <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-700">
              Forgot password?
            </Link>
          </p>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Do not have an account?{" "}
          <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-700">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
