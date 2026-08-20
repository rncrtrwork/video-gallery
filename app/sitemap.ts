import type { MetadataRoute } from "next";
import { getPublishedVideoIndex } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL || "http://localhost:3000";
  const videos = await getPublishedVideoIndex();
  return [{ url: base, lastModified: new Date() }, ...videos.map((video) => ({ url: `${base}/videos/${video.slug}`, lastModified: video.updatedAt }))];
}
