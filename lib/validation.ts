import { z } from "zod";

export const objectIdString = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");

export const videoInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2).max(120),
  slug: z.string().trim().max(140).optional(),
  description: z.string().trim().min(5).max(5_000),
  categoryId: z.string().optional(),
  tags: z.string().max(500).default(""),
  sortOrder: z.coerce.number().int().min(0).max(100_000).default(0),
  featured: z.coerce.boolean().default(false),
  assetJson: z.string().max(10_000).optional(),
  posterJson: z.string().max(10_000).optional(),
});

export const categoryInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(60),
  sortOrder: z.coerce.number().int().min(0).max(10_000).default(0),
});

export const siteSettingsInputSchema = z.object({
  siteName: z.string().trim().min(2).max(60),
  heroEyebrow: z.string().trim().min(2).max(60),
  heroTitle: z.string().trim().min(2).max(120),
  heroDescription: z.string().trim().min(10).max(500),
  heroImageAlt: z.string().trim().min(2).max(180),
  featuredVideoId: z.string().optional(),
  showFeaturedOverlay: z.preprocess((value) => value === true || value === "true" || value === "on", z.boolean()),
  heroImageJson: z.string().max(10_000).optional(),
});

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}

export function parseFormData(formData: FormData) {
  return Object.fromEntries(formData.entries());
}
