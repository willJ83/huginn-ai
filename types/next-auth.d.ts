import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    // The DB sessionVersion value at the time this token was issued.
    // If it no longer matches the DB value, the token is considered stale.
    sessionVersion?: number;
    // Set to true when a sessionVersion mismatch is detected.
    // The session callback then clears the user ID so protected routes redirect.
    invalidated?: boolean;
  }
}
