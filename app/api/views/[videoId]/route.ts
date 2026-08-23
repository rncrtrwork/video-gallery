import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { consumeRateLimit } from "@/lib/security";
import type { VideoDocument } from "@/lib/types";

export async function POST(request: Request, { params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  if (!ObjectId.isValid(videoId)) return NextResponse.json({ error: "Invalid video" }, { status: 400 });
  const forwardedIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
  if (forwardedIp && !(await consumeRateLimit(`views:${forwardedIp}`, 120, 60 * 60))) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const id = new ObjectId(videoId);
  const db = await getDb();
  const video = await db.collection<VideoDocument>("videos").findOneAndUpdate(
    { _id: id, status: "published" },
    { $inc: { viewCount: 1 } },
    { returnDocument: "after", projection: { viewCount: 1 } },
  );
  if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ counted: true, viewCount: video.viewCount });
}
