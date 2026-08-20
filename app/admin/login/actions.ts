"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import type { UserDocument } from "@/lib/types";
import { consumeRateLimit } from "@/lib/security";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email || password.length < 8) redirect("/admin/login?error=invalid");
  const requestHeaders = await headers();
  const forwardedIp = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || "unknown";
  if (!(await consumeRateLimit(`login:${forwardedIp}:${email}`, 8, 60 * 15))) redirect("/admin/login?error=rate");

  const db = await getDb();
  const user = await db.collection<UserDocument>("users").findOne({ email, active: true });
  if (!user?._id || !(await compare(password, user.passwordHash))) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    redirect("/admin/login?error=invalid");
  }
  await createSession(user as UserDocument & { _id: NonNullable<UserDocument["_id"]> });
  await db.collection("auditLogs").insertOne({ actorId: user._id, action: "admin.login", entityType: "user", entityId: user._id, createdAt: new Date() });
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}
