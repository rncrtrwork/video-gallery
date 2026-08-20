import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { anonymousViewerHash, consumeRateLimit } from "@/lib/security";
import type { VideoDocument } from "@/lib/types";

export async function POST(request: Request, { params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  if (!ObjectId.isValid(videoId)) return NextResponse.json({ error: "Invalid video" }, { status: 400 });
  const forwardedIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
  if (forwardedIp && !(await consumeRateLimit(`views:${forwardedIp}`, 120, 60 * 60))) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const id = new ObjectId(videoId);
  const db = await getDb();
  const exists = await db.collection<VideoDocument>("videos").findOne({ _id: id, status: "published" }, { projection: { _id: 1 } });
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cookieHeader = request.headers.get("cookie") || "";
  const existingToken = cookieHeader.match(/(?:^|;\s*)fv_viewer=([^;]+)/)?.[1];
  const token = existingToken ? decodeURIComponent(existingToken) : randomUUID();
  const now = new Date();
  const dayBucket = now.toISOString().slice(0, 10);
  let counted = false;
  try {
    await db.collection("videoViews").insertOne({
      videoId: id,
      viewerHash: anonymousViewerHash(token),
      dayBucket,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 90),
    });
    await db.collection<VideoDocument>("videos").updateOne({ _id: id }, { $inc: { viewCount: 1 } });
    counted = true;
  } catch (error) {
    if (!(error instanceof Error && "code" in error && (error as Error & { code?: number }).code === 11000)) throw error;
  }

  const response = NextResponse.json({ counted });
  if (!existingToken) response.cookies.set("fv_viewer", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
  return response;
}
