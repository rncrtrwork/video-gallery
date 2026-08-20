import { describe, expect, it } from "vitest";
import { categoryInputSchema, siteSettingsInputSchema, slugify, videoInputSchema } from "@/lib/validation";
import { createHash } from "node:crypto";
import { verifyCloudinaryWebhook } from "@/lib/security";

describe("slugify", () => {
  it("creates safe stable URL segments", () => {
    expect(slugify("  Behind thé Lens!  ")).toBe("behind-the-lens");
  });

  it("removes separators at the edges", () => {
    expect(slugify("--- Coastal Study ---")).toBe("coastal-study");
  });
});

describe("Cloudinary webhook verification", () => {
  it("accepts a current correctly signed raw payload", () => {
    const timestamp = "1700000000";
    const body = '{"public_id":"sample"}';
    const secret = "test-secret";
    const signature = createHash("sha1").update(`${body}${timestamp}${secret}`).digest("hex");
    expect(verifyCloudinaryWebhook(body, timestamp, signature, secret, 1700000000 * 1000)).toBe(true);
  });

  it("rejects stale webhook payloads", () => {
    expect(verifyCloudinaryWebhook("{}", "1", "bad", "secret", 1700000000 * 1000)).toBe(false);
  });
});

describe("content validation", () => {
  it("accepts a complete video draft", () => {
    expect(videoInputSchema.safeParse({ title: "Morning Light", shortDescription: "A quiet observational film.", fullDescription: "A longer description of the complete film.", tags: "nature, morning", sortOrder: "2" }).success).toBe(true);
  });

  it("rejects external hero links", () => {
    const result = siteSettingsInputSchema.safeParse({ siteName: "FrameVault", heroEyebrow: "Curated films", heroTitle: "Watch remarkable stories", heroDescription: "A sufficiently long introduction for visitors.", heroButtonLabel: "Browse films", heroButtonLink: "https://malicious.example", heroImageAlt: "A production set", aboutHeading: "About the gallery", aboutBody: "A sufficiently long description of the gallery." });
    expect(result.success).toBe(false);
  });

  it("requires useful category names", () => {
    expect(categoryInputSchema.safeParse({ name: "A", sortOrder: 0 }).success).toBe(false);
  });
});
