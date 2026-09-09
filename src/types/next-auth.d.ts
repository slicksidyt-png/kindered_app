import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    platformRole?: "SUPER_ADMIN" | null;
  }

  interface Session {
    user: {
      id: string;
      platformRole: "SUPER_ADMIN" | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    platformRole?: "SUPER_ADMIN" | null;
  }
}