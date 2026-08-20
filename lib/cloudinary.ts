import "server-only";

import { v2 as cloudinary } from "cloudinary";
import { getCloudinaryEnv } from "@/lib/env";
import type { CloudinaryAsset } from "@/lib/types";

export function configureCloudinary() {
  const env = getCloudinaryEnv();
  cloudinary.config({
    cloud_name: env.cloudName,
    api_key: env.apiKey,
    api_secret: env.apiSecret,
    secure: true,
  });
  return { cloudinary, ...env };
}

export function parseCloudinaryAsset(value?: string | null): CloudinaryAsset | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const assetId = String(parsed.assetId ?? parsed.asset_id ?? "");
    const publicId = String(parsed.publicId ?? parsed.public_id ?? "");
    if (!assetId || !publicId || !/^[\w/.-]+$/.test(publicId)) return null;
    return {
      assetId,
      publicId,
      version: typeof parsed.version === "number" ? parsed.version : undefined,
      format: typeof parsed.format === "string" ? parsed.format : undefined,
      secureUrl: typeof parsed.secureUrl === "string" ? parsed.secureUrl : typeof parsed.secure_url === "string" ? parsed.secure_url : undefined,
    };
  } catch {
    return null;
  }
}

function encodedPublicId(publicId: string) {
  return publicId.split("/").map(encodeURIComponent).join("/");
}

export function cloudinaryPosterUrl(publicId: string, width = 1000) {
  const { cloudName } = getCloudinaryEnv();
  return `https://res.cloudinary.com/${encodeURIComponent(cloudName)}/video/upload/so_0,f_jpg,q_auto,w_${width}/${encodedPublicId(publicId)}.jpg`;
}

export function cloudinaryImageUrl(publicId: string, width = 1400) {
  const { cloudName } = getCloudinaryEnv();
  return `https://res.cloudinary.com/${encodeURIComponent(cloudName)}/image/upload/f_auto,q_auto,w_${width}/${encodedPublicId(publicId)}`;
}

export function cloudinaryVideoUrl(publicId: string) {
  const { cloudName } = getCloudinaryEnv();
  return `https://res.cloudinary.com/${encodeURIComponent(cloudName)}/video/upload/f_auto,q_auto/${encodedPublicId(publicId)}.mp4`;
}
