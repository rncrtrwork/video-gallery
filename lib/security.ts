import { createHmac, timingSafeEqual } from "node:crypto";
import { getDb } from "@/lib/db";
import { getServerEnv } from "@/lib/env";

export function anonymousViewerHash(viewerToken: string) {
  return createHmac("sha256", getServerEnv().AUTH_SECRET).update(viewerToken).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const first = Buffer.from(a);
  const second = Buffer.from(b);
  return first.length === second.length && timingSafeEqual(first, second);
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = new URL(getServerEnv().APP_URL).origin;
  if (!origin || origin !== expected) throw new Error("Invalid request origin");
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function consumeRateLimit(rawKey: string, limit: number, windowSeconds: number) {
  const key = anonymousViewerHash(rawKey);
  const now = new Date();
  const bucket = Math.floor(now.getTime() / (windowSeconds * 1000));
  const db = await getDb();
  const record = await db.collection<{ key: string; bucket: number; count: number; expiresAt: Date }>("rateLimits").findOneAndUpdate(
    { key, bucket },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(now.getTime() + windowSeconds * 2000) } },
    { upsert: true, returnDocument: "after" },
  );
  return (record?.count ?? 1) <= limit;
}
