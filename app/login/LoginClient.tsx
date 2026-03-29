"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

type LoginClientProps = {
  accountCreated: boolean;
  next: string;
};

export default function LoginClient({ accountCreated, next }: LoginClientProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsLoading(false);

    if (!result || result.error) {
      setError("Email or password is incorrect.");
      return;
    }

    window.location.href = next;
  }

  return (
    <div>
      <h1 className="sr-only">Log in</h1>

      {accountCreated && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <p className="font-medium">
            Account created. Log in below to choose your plan.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2"
            placeholder="Email address"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2"
            placeholder="Password"
            required
          />
          <div className="mt-1 text-right">
            <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
              Forgot password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {isLoading ? "Logging in..." : "Log in"}
        </button>
        <p className="mt-2 text-center text-xs text-slate-400">
          Huginn AI is not a substitute for legal advice.
        </p>
      </form>
    </div>
  );
}
