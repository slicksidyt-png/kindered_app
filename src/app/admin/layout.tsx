import { forbidden, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-guards";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin");
  if (user.status !== "active" || user.platformRole !== "SUPER_ADMIN") forbidden();
  return children;
}