import "server-only";

import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getBackblazeEnv } from "@/lib/env";
import type { StorageAsset } from "@/lib/types";
import { storageAssetInputSchema } from "@/lib/validation";

let storageClient: S3Client | undefined;

export function getStorageClient() {
  if (!storageClient) {
    const env = getBackblazeEnv();
    storageClient = new S3Client({
      region: env.region,
      endpoint: env.endpoint,
      forcePathStyle: true,
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
      credentials: {
        accessKeyId: env.keyId,
        secretAccessKey: env.applicationKey,
      },
    });
  }
  return storageClient;
}

export function storageUrl(key: string) {
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `${getBackblazeEnv().publicBaseUrl}/${encodedKey}`;
}

export function parseStorageAsset(value?: string | null, kind?: "video" | "image"): StorageAsset | null {
  if (!value) return null;
  try {
    const result = storageAssetInputSchema.safeParse(JSON.parse(value));
    if (!result.success) return null;
    const parsed = result.data;
    const { key, contentType, size } = parsed;
    const requiredPrefix = kind === "video" ? "videos/" : kind === "image" ? "images/" : "";
    if (!key.startsWith(requiredPrefix)) return null;
    return {
      key,
      contentType,
      size,
      originalName: parsed.originalName,
    };
  } catch {
    return null;
  }
}

export async function storedAssetExists(asset: StorageAsset) {
  try {
    const env = getBackblazeEnv();
    const result = await getStorageClient().send(new HeadObjectCommand({ Bucket: env.bucketName, Key: asset.key }));
    return result.ContentLength === asset.size && (!result.ContentType || result.ContentType === asset.contentType);
  } catch {
    return false;
  }
}
