"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

type LoginClientProps = {
  accountCreated: boolean;
};

export default function LoginClient({ accountCreated }: LoginClientProps) {
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

    window.location.href = "/dashboard";
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold">Log in</h1>

      {accountCreated && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <p className="font-medium">
            Account created. You are good to go - log in below.
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
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {isLoading ? "Logging in..." : "Log in"}
        </button>
      </form>
    </div>
  );
}
