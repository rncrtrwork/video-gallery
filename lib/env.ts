import { z } from "zod";

const serverSchema = z.object({
  MONGODB_URI: z.string().min(1),
  MONGODB_DB_NAME: z.string().min(1).default("framevault"),
  AUTH_SECRET: z.string().min(32),
  APP_URL: z.string().url().default("http://localhost:3000"),
});

export function getServerEnv() {
  const result = serverSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(
      `Invalid server environment: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`,
    );
  }
  return result.data;
}

export function getCloudinaryEnv() {
  if (process.env.CLOUDINARY_URL) {
    const match = process.env.CLOUDINARY_URL.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
    if (!match) throw new Error("CLOUDINARY_URL is incomplete or malformed");
    return { apiKey: match[1], apiSecret: match[2], cloudName: match[3] };
  }

  const result = z
    .object({
      CLOUDINARY_CLOUD_NAME: z.string().min(1),
      CLOUDINARY_API_KEY: z.string().min(1),
      CLOUDINARY_API_SECRET: z.string().min(1),
    })
    .safeParse(process.env);
  if (!result.success) throw new Error("Cloudinary server environment is missing");
  return {
    cloudName: result.data.CLOUDINARY_CLOUD_NAME,
    apiKey: result.data.CLOUDINARY_API_KEY,
    apiSecret: result.data.CLOUDINARY_API_SECRET,
  };
}
