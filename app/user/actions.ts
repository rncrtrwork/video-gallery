"use server";

import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { configureCloudinary, parseCloudinaryAsset } from "@/lib/cloudinary";
import { getDb } from "@/lib/db";
import { uniqueSlug } from "@/lib/repositories";
import { consumeRateLimit } from "@/lib/security";
import type { CategoryDocument, VideoDocument } from "@/lib/types";
import { parseFormData, videoInputSchema } from "@/lib/validation";

export async function submitPublicVideoAction(formData: FormData) {
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || "unknown";
  if (!(await consumeRateLimit(`public-submit:${ip}`, 5, 60 * 60))) redirect("/user?error=rate");

  const parsed = videoInputSchema.safeParse(parseFormData(formData));
  if (!parsed.success) redirect("/user?error=validation");
  const asset = parseCloudinaryAsset(parsed.data.assetJson);
  if (!asset?.publicId || !asset.publicId.startsWith("framevault/public-submissions/")) redirect("/user?error=media");

  const { cloudinary } = configureCloudinary();
  let remote: { asset_id?: string; resource_type?: string; bytes?: number; duration?: number; width?: number; height?: number; format?: string };
  try {
    remote = await cloudinary.api.resource(asset.publicId, { resource_type: "video" });
  } catch {
    redirect("/user?error=media");
  }
  if (remote.asset_id !== asset.assetId || remote.resource_type !== "video" || !remote.bytes || remote.bytes > 1_000_000_000 || (remote.duration ?? 0) > 60 * 60 * 2) redirect("/user?error=media");

  const db = await getDb();
  let categoryId: ObjectId | null = null;
  if (parsed.data.categoryId && ObjectId.isValid(parsed.data.categoryId)) {
    const category = await db.collection<CategoryDocument>("categories").findOne({ _id: new ObjectId(parsed.data.categoryId), isActive: true });
    categoryId = category?._id ?? null;
  }
  const now = new Date();
  const slug = await uniqueSlug(parsed.data.title, parsed.data.slug || "");
  const result = await db.collection<VideoDocument>("videos").insertOne({
    title: parsed.data.title,
    slug,
    description: parsed.data.description,
    categoryId,
    tags: parsed.data.tags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 20),
    status: "published",
    featured: false,
    sortOrder: 0,
    cloudinary: asset,
    poster: null,
    media: { durationSeconds: remote.duration, width: remote.width, height: remote.height, bytes: remote.bytes, format: remote.format },
    viewCount: 0,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  });
  await db.collection("auditLogs").insertOne({ action: "video.publicly_uploaded", entityType: "video", entityId: result.insertedId, createdAt: now });
  revalidatePath("/");
  redirect(`/videos/${slug}`);
}
