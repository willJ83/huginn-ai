"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

type ProvidersProps = {
  children: ReactNode;
  session: any;
};

export default function Providers({ children, session }: ProvidersProps) {
  return (
    // attribute="class" → next-themes writes class="dark" on <html>
    // defaultTheme="system" → respects OS preference on first visit
    // enableSystem → keeps following OS preference until user overrides
    // disableTransitionOnChange={false} → allow our CSS transitions to run
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <SessionProvider session={session}>
        {children}
      </SessionProvider>
    </ThemeProvider>
  );
}
