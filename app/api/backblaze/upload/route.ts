import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getBackblazeEnv } from "@/lib/env";
import { assertSameOrigin, consumeRateLimit } from "@/lib/security";
import { getStorageClient, storageUrl } from "@/lib/storage";

const ALLOWED_TYPES: Record<"video" | "image", Record<string, string>> = {
  video: { "video/mp4": "mp4", "video/webm": "webm" },
  image: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" },
};

function safeBaseName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "media";
}

export async function POST(request: Request) {
  try { assertSameOrigin(request); } catch { return NextResponse.json({ error: "Invalid origin" }, { status: 403 }); }
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await consumeRateLimit(`admin-storage-upload:${session.userId}`, 100, 60 * 60))) return NextResponse.json({ error: "Upload limit reached" }, { status: 429 });

  const body = await request.json() as { fileName?: string; contentType?: string; size?: number; kind?: string };
  if (body.kind !== "video" && body.kind !== "image") return NextResponse.json({ error: "Invalid media type" }, { status: 400 });
  const contentType = String(body.contentType || "").toLowerCase();
  const extension = ALLOWED_TYPES[body.kind][contentType];
  const size = Number(body.size);
  const maxSize = body.kind === "video" ? 1_000_000_000 : 15_000_000;
  if (!extension || !Number.isSafeInteger(size) || size <= 0 || size > maxSize) {
    return NextResponse.json({ error: "Unsupported file type or size" }, { status: 400 });
  }

  const folder = body.kind === "video" ? "videos" : "images";
  const key = `${folder}/${Date.now()}-${randomUUID()}-${safeBaseName(String(body.fileName || "media"))}.${extension}`;
  const env = getBackblazeEnv();
  const uploadUrl = await getSignedUrl(
    getStorageClient(),
    new PutObjectCommand({ Bucket: env.bucketName, Key: key, ContentType: contentType }),
    { expiresIn: 600 },
  );

  return NextResponse.json({
    uploadUrl,
    asset: { key, url: storageUrl(key), contentType, size, originalName: String(body.fileName || "media").slice(0, 255) },
  }, { headers: { "cache-control": "no-store" } });
}
