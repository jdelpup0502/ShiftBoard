import { redirect } from "next/navigation";
import { db } from "./db";
import { getSession } from "./session";
import type { User } from "@prisma/client";

export { BCRYPT_COST } from "./validation";

export async function requireUser(): Promise<User> {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireManager(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "MANAGER") redirect("/dashboard");
  return user;
}
