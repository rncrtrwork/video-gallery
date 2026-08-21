import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import type { AdminSession, UserDocument } from "@/lib/types";

const COOKIE_NAME = "framevault_admin";
const SESSION_LENGTH_SECONDS = 60 * 60 * 8;

function secretKey() {
  return new TextEncoder().encode(getServerEnv().AUTH_SECRET);
}

export async function createSession(user: UserDocument & { _id: ObjectId }) {
  const session: AdminSession = {
    userId: user._id.toHexString(),
    email: user.email,
    name: user.name,
    role: user.role,
  };
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_LENGTH_SECONDS}s`)
    .setIssuer("framevault")
    .setAudience("framevault-admin")
    .sign(secretKey());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_LENGTH_SECONDS,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: "framevault",
      audience: "framevault-admin",
    });
    const session = payload as unknown as AdminSession;
    if (!ObjectId.isValid(session.userId)) return null;

    const db = await getDb();
    const user = await db.collection<UserDocument>("users").findOne({
      _id: new ObjectId(session.userId),
      active: true,
    });
    if (!user || user.role !== session.role) return null;
    return session;
  } catch {
    return null;
  }
}

export async function requireAdmin(loginPath = "/admin/login") {
  const session = await getSession();
  if (!session) redirect(loginPath);
  return session;
}

export async function requireOwner() {
  const session = await requireAdmin();
  if (session.role !== "owner") throw new Error("Owner access required");
  return session;
}
