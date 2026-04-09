"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

type ProvidersProps = {
  children: ReactNode;
  session: any;           // NextAuth session object
};

export default function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}
