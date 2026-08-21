import { NextResponse } from "next/server";
import { configureCloudinary } from "@/lib/cloudinary";
import { assertSameOrigin, consumeRateLimit } from "@/lib/security";

const ALLOWED_SIGNED_KEYS = new Set(["timestamp", "source", "folder", "upload_preset"]);

function requestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export async function GET(request: Request) {
  if (!(await consumeRateLimit(`public-upload-config:${requestIp(request)}`, 30, 60 * 60))) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const { cloudName, apiKey } = configureCloudinary();
  return NextResponse.json({ cloudName, apiKey }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  try { assertSameOrigin(request); } catch { return NextResponse.json({ error: "Invalid origin" }, { status: 403 }); }
  if (!(await consumeRateLimit(`public-upload-signature:${requestIp(request)}`, 10, 60 * 60))) return NextResponse.json({ error: "Too many uploads" }, { status: 429 });
  const body = await request.json() as { paramsToSign?: Record<string, string | number>; kind?: string };
  if (!body.paramsToSign || body.kind !== "video") return NextResponse.json({ error: "Only video uploads are allowed" }, { status: 400 });
  const keys = Object.keys(body.paramsToSign);
  if (keys.some((key) => !ALLOWED_SIGNED_KEYS.has(key)) || body.paramsToSign.folder !== "framevault/public-submissions") return NextResponse.json({ error: "Disallowed upload parameters" }, { status: 400 });
  const timestamp = Number(body.paramsToSign.timestamp);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 60 * 10) return NextResponse.json({ error: "Expired upload request" }, { status: 400 });
  const { cloudinary, apiSecret } = configureCloudinary();
  return NextResponse.json({ signature: cloudinary.utils.api_sign_request(body.paramsToSign, apiSecret) });
}
