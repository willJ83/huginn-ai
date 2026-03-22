"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut()}
      className="text-sm text-slate-600 hover:text-slate-900"
    >
      Logout
    </button>
  );
}