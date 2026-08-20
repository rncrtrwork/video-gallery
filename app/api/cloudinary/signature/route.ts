import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { configureCloudinary } from "@/lib/cloudinary";
import { assertSameOrigin } from "@/lib/security";

const ALLOWED_SIGNED_KEYS = new Set(["timestamp", "source", "folder", "upload_preset"]);

export async function GET() {
  if (!(await getSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { cloudName, apiKey } = configureCloudinary();
  return NextResponse.json({ cloudName, apiKey }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  try { assertSameOrigin(request); } catch { return NextResponse.json({ error: "Invalid origin" }, { status: 403 }); }
  if (!(await getSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as { paramsToSign?: Record<string, string | number>; kind?: string };
  if (!body.paramsToSign || !["video", "image"].includes(body.kind || "")) return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
  const requiredFolder = body.kind === "video" ? "framevault/videos" : "framevault/images";
  const keys = Object.keys(body.paramsToSign);
  if (keys.some((key) => !ALLOWED_SIGNED_KEYS.has(key)) || body.paramsToSign.folder !== requiredFolder) {
    return NextResponse.json({ error: "Disallowed upload parameters" }, { status: 400 });
  }
  const timestamp = Number(body.paramsToSign.timestamp);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 60 * 10) return NextResponse.json({ error: "Expired upload request" }, { status: 400 });
  const { cloudinary, apiSecret } = configureCloudinary();
  const signature = cloudinary.utils.api_sign_request(body.paramsToSign, apiSecret);
  return NextResponse.json({ signature });
}
