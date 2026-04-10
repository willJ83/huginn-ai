import { cache } from "react";
import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) throw new Error("No user found");

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("Invalid password");

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // ─────────────────────────────────────────────────────────────────────────
    // JWT CALLBACK
    // Called every time a JWT is created (sign-in) or read (getServerSession,
    // useSession, update()). This is where sessionVersion validation lives.
    // ─────────────────────────────────────────────────────────────────────────
    async jwt({ token, user, trigger }) {
      // ── SIGN-IN ────────────────────────────────────────────────────────────
      // `user` is only present on the initial sign-in. Stamp the current
      // sessionVersion from the DB into the JWT so future requests can compare.
      if (user) {
        token.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { sessionVersion: true },
        });
        token.sessionVersion = dbUser?.sessionVersion ?? 0;
        token.invalidated = false;
        return token;
      }

      // ── SESSION UPDATE (client calls update()) ─────────────────────────────
      // After a password change the client calls update(), which hits this
      // branch. We re-read sessionVersion from DB so the current device's JWT
      // gets the new version — keeping this device logged in while all other
      // devices (still carrying the old version) get invalidated on next check.
      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { sessionVersion: true },
        });
        if (dbUser) {
          token.sessionVersion = dbUser.sessionVersion;
          token.invalidated = false;
        }
        return token;
      }

      // ── SUBSEQUENT REQUESTS ────────────────────────────────────────────────
      // Validate the JWT's stamped sessionVersion against the live DB value.
      // A mismatch means the password was changed on another device.
      // We mark the token as invalidated; the session callback clears the user
      // ID so every protected page/action treats it as unauthenticated.
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { sessionVersion: true },
        });

        if (!dbUser || dbUser.sessionVersion !== token.sessionVersion) {
          token.invalidated = true;
        }
      }

      return token;
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SESSION CALLBACK
    // Transforms the validated JWT token into the session object that the rest
    // of the app consumes. Invalidated tokens produce a session with no user ID,
    // which protected routes treat identically to being logged out.
    // ─────────────────────────────────────────────────────────────────────────
    async session({ session, token }) {
      if (token.invalidated) {
        // Empty user ID — protected routes check `!session?.user?.id` and
        // redirect to /login?reason=session_expired
        return {
          ...session,
          user: { id: "", name: null, email: null, image: null },
        };
      }

      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.name = String(token.name ?? "User");
        session.user.email = String(token.email ?? "");
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,

  // ── Cookie hardening ────────────────────────────────────────────────────────
  // sameSite: "strict" is safe here because we use only the Credentials
  // provider — there are no OAuth redirect flows that require "lax".
  //
  // In production, cookies carry the __Secure- / __Host- prefix, which
  // browsers enforce only on HTTPS connections.
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "strict" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.callback-url"
          : "next-auth.callback-url",
      options: {
        httpOnly: false, // must be readable by client-side NextAuth
        sameSite: "strict" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Host-next-auth.csrf-token"
          : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "strict" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

// Wrapped in React's cache() so multiple auth() calls within a single
// server-render share one DB round-trip instead of making several.
export const auth = cache(() => getServerSession(authOptions));
