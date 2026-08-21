"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { parseCloudinaryAsset } from "@/lib/cloudinary";
import { getDb } from "@/lib/db";
import type { SiteSettingsDocument, VideoDocument, VideoStatus } from "@/lib/types";
import { categoryInputSchema, objectIdString, parseFormData, siteSettingsInputSchema, slugify, videoInputSchema } from "@/lib/validation";
import { uniqueSlug } from "@/lib/repositories";

async function audit(actorId: string, action: string, entityType: string, entityId?: ObjectId) {
  const db = await getDb();
  await db.collection("auditLogs").insertOne({ actorId: new ObjectId(actorId), action, entityType, entityId, createdAt: new Date() });
}

function uploadedMedia(value?: string) {
  if (!value) return undefined;
  try {
    const item = JSON.parse(value) as Record<string, unknown>;
    return {
      durationSeconds: typeof item.duration === "number" ? item.duration : undefined,
      width: typeof item.width === "number" ? item.width : undefined,
      height: typeof item.height === "number" ? item.height : undefined,
      bytes: typeof item.bytes === "number" ? item.bytes : undefined,
      format: typeof item.format === "string" ? item.format : undefined,
    };
  } catch { return undefined; }
}

export async function saveVideoAction(formData: FormData) {
  const session = await requireAdmin();
  const parsed = videoInputSchema.safeParse(parseFormData(formData));
  if (!parsed.success) redirect(`/admin/videos${String(formData.get("id") || "") ? `/${formData.get("id")}/edit` : "/new"}?error=validation`);
  const input = parsed.data;
  const db = await getDb();
  const now = new Date();
  const id = input.id && ObjectId.isValid(input.id) ? new ObjectId(input.id) : undefined;
  const existing = id ? await db.collection<VideoDocument>("videos").findOne({ _id: id }) : null;
  const cloudinary = parseCloudinaryAsset(input.assetJson) ?? existing?.cloudinary ?? null;
  const poster = parseCloudinaryAsset(input.posterJson) ?? existing?.poster ?? null;
  const categoryId = input.categoryId && ObjectId.isValid(input.categoryId) ? new ObjectId(input.categoryId) : null;
  const slug = existing?.slug ?? await uniqueSlug(input.title, slugify(input.title), input.id);
  const update = {
    title: input.title,
    slug,
    description: input.description,
    categoryId,
    tags: input.tags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 20),
    sortOrder: input.sortOrder,
    featured: input.featured,
    cloudinary,
    poster,
    media: input.assetJson ? uploadedMedia(input.assetJson) : existing?.media,
    updatedAt: now,
    updatedBy: new ObjectId(session.userId),
  };

  let savedId: ObjectId;
  if (id && existing) {
    await db.collection<VideoDocument>("videos").updateOne({ _id: id }, { $set: update });
    savedId = id;
  } else {
    const result = await db.collection<VideoDocument>("videos").insertOne({
      ...update,
      status: "draft",
      viewCount: 0,
      publishedAt: null,
      createdAt: now,
      createdBy: new ObjectId(session.userId),
    });
    savedId = result.insertedId;
  }
  await audit(session.userId, existing ? "video.updated" : "video.created", "video", savedId);
  revalidatePath("/");
  revalidatePath("/admin/videos");
  redirect(`/admin/videos/${savedId.toHexString()}/edit?success=saved`);
}

export async function setVideoStatusAction(formData: FormData) {
  const session = await requireAdmin();
  const idResult = objectIdString.safeParse(formData.get("id"));
  const status = String(formData.get("status") || "");
  if (!idResult.success || !["published", "draft", "archived"].includes(status)) throw new Error("Invalid video action");
  const nextStatus = status as VideoStatus;
  const db = await getDb();
  const id = new ObjectId(idResult.data);
  const video = await db.collection<VideoDocument>("videos").findOne({ _id: id });
  if (!video) throw new Error("Video not found");
  if (status === "published" && !video.cloudinary?.publicId) redirect(`/admin/videos/${idResult.data}/edit?error=media-required`);
  await db.collection<VideoDocument>("videos").updateOne({ _id: id }, { $set: { status: nextStatus, publishedAt: nextStatus === "published" ? video.publishedAt ?? new Date() : video.publishedAt, updatedAt: new Date(), updatedBy: new ObjectId(session.userId) } });
  await audit(session.userId, `video.${status}`, "video", id);
  revalidatePath("/");
  revalidatePath(`/videos/${video.slug}`);
  revalidatePath("/admin/videos");
  redirect("/admin/videos?success=status");
}

export async function saveSettingsAction(formData: FormData) {
  const session = await requireAdmin();
  const parsed = siteSettingsInputSchema.safeParse(parseFormData(formData));
  if (!parsed.success) redirect("/admin/content?error=validation");
  const db = await getDb();
  const existing = await db.collection<SiteSettingsDocument>("siteSettings").findOne({ key: "main" });
  const heroImage = parseCloudinaryAsset(parsed.data.heroImageJson) ?? existing?.heroImage ?? null;
  const featuredVideoId = parsed.data.featuredVideoId && ObjectId.isValid(parsed.data.featuredVideoId) ? new ObjectId(parsed.data.featuredVideoId) : null;
  const { heroImageJson: _ignored, ...fields } = parsed.data;
  await db.collection<SiteSettingsDocument>("siteSettings").updateOne({ key: "main" }, { $set: { ...fields, heroImage, featuredVideoId, updatedAt: new Date(), updatedBy: new ObjectId(session.userId) } }, { upsert: true });
  await audit(session.userId, "settings.updated", "siteSettings");
  revalidatePath("/");
  redirect("/admin/content?success=saved");
}

export async function saveCategoryAction(formData: FormData) {
  const session = await requireAdmin();
  const parsed = categoryInputSchema.safeParse(parseFormData(formData));
  if (!parsed.success) redirect("/admin/categories?error=validation");
  const db = await getDb();
  const id = parsed.data.id && ObjectId.isValid(parsed.data.id) ? new ObjectId(parsed.data.id) : undefined;
  const now = new Date();
  const fields = { name: parsed.data.name, slug: slugify(parsed.data.name), sortOrder: parsed.data.sortOrder, updatedAt: now };
  if (id) await db.collection("categories").updateOne({ _id: id }, { $set: fields });
  else await db.collection("categories").insertOne({ ...fields, isActive: true, createdAt: now });
  await audit(session.userId, id ? "category.updated" : "category.created", "category", id);
  revalidatePath("/");
  redirect("/admin/categories?success=saved");
}

export async function toggleCategoryAction(formData: FormData) {
  const session = await requireAdmin();
  const id = objectIdString.parse(formData.get("id"));
  const active = String(formData.get("active")) === "true";
  const db = await getDb();
  await db.collection("categories").updateOne({ _id: new ObjectId(id) }, { $set: { isActive: active, updatedAt: new Date() } });
  await audit(session.userId, active ? "category.activated" : "category.deactivated", "category", new ObjectId(id));
  revalidatePath("/");
  redirect("/admin/categories?success=status");
}
