import { prisma } from "@/lib/prisma";
import { auth } from "../../auth";

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  status: "active" | "invited" | "disabled";
  platformRole: "SUPER_ADMIN" | null;
};

export class AuthorizationError extends Error {
  constructor(public readonly status: 401 | 403, message: string) {
    super(message);
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, status: true, platformRole: true } });
}

export async function requireAuthenticatedUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError(401, "Authentication required");
  if (user.status !== "active") throw new AuthorizationError(403, "User account is not active");
  return user;
}

export async function requireSuperAdmin() {
  const user = await requireAuthenticatedUser();
  if (user.platformRole !== "SUPER_ADMIN") throw new AuthorizationError(403, "Super Admin access required");
  return user;
}

export function authorizationErrorResponse(error: unknown) {
  if (error instanceof AuthorizationError) return Response.json({ error: error.message }, { status: error.status });
  throw error;
}