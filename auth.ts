import "dotenv/config";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
const superAdminPasswordHash = process.env.SUPER_ADMIN_PASSWORD_HASH_BASE64 ? Buffer.from(process.env.SUPER_ADMIN_PASSWORD_HASH_BASE64, "base64").toString("utf8") : process.env.SUPER_ADMIN_PASSWORD_HASH;

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password || !superAdminEmail || !superAdminPasswordHash || email !== superAdminEmail) return null;

        const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true, status: true, platformRole: true } });
        if (!user || user.status !== "active" || user.platformRole !== "SUPER_ADMIN") return null;
        if (!(await bcrypt.compare(password, superAdminPasswordHash))) return null;

        return { id: user.id, email: user.email, name: user.name, platformRole: user.platformRole };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.platformRole = user.platformRole;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.platformRole = token.platformRole === "SUPER_ADMIN" ? token.platformRole : null;
      }
      return session;
    },
  },
});