import { NextResponse } from "next/server";
import { configureCloudinary } from "@/lib/cloudinary";
import { getDb } from "@/lib/db";
import { verifyCloudinaryWebhook } from "@/lib/security";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const timestamp = request.headers.get("x-cld-timestamp") || "";
  const signature = request.headers.get("x-cld-signature") || "";
  const { apiSecret } = configureCloudinary();
  if (!signature || !verifyCloudinaryWebhook(rawBody, timestamp, signature, apiSecret)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  let payload: Record<string, unknown>;
  try { payload = JSON.parse(rawBody) as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const assetId = typeof payload.asset_id === "string" ? payload.asset_id : null;
  const publicId = typeof payload.public_id === "string" ? payload.public_id : null;
  if (assetId || publicId) {
    const db = await getDb();
    await db.collection("videos").updateMany(
      { $or: [...(assetId ? [{ "cloudinary.assetId": assetId }] : []), ...(publicId ? [{ "cloudinary.publicId": publicId }] : [])] },
      { $set: { updatedAt: new Date() } },
    );
  }
  return NextResponse.json({ received: true });
}
