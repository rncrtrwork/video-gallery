import { describe, expect, it } from "vitest";
import { categoryInputSchema, siteSettingsInputSchema, slugify, storageAssetInputSchema, videoInputSchema } from "@/lib/validation";

describe("slugify", () => {
  it("creates safe stable URL segments", () => {
    expect(slugify("  Behind thé Lens!  ")).toBe("behind-the-lens");
  });

  it("removes separators at the edges", () => {
    expect(slugify("--- Coastal Study ---")).toBe("coastal-study");
  });
});

describe("Backblaze asset validation", () => {
  it("accepts stored media metadata", () => {
    expect(storageAssetInputSchema.safeParse({ key: "videos/example.mp4", contentType: "video/mp4", size: 1024 }).success).toBe(true);
  });

  it("rejects unsafe storage keys", () => {
    expect(storageAssetInputSchema.safeParse({ key: "videos/../secret", contentType: "video/mp4", size: 1024 }).success).toBe(false);
  });
});

describe("content validation", () => {
  it("accepts a complete video draft", () => {
    expect(videoInputSchema.safeParse({ title: "Morning Light", description: "A quiet observational film with a complete description.", tags: "nature, morning", sortOrder: "2" }).success).toBe(true);
  });

  it("rejects incomplete hero descriptions", () => {
    const result = siteSettingsInputSchema.safeParse({ siteName: "FrameVault", heroEyebrow: "Curated films", heroTitle: "Watch remarkable stories", heroDescription: "Short", heroImageAlt: "A production set" });
    expect(result.success).toBe(false);
  });

  it("parses the featured banner text checkbox", () => {
    const settings = { siteName: "FrameVault", heroEyebrow: "Curated films", heroTitle: "Watch remarkable stories", heroDescription: "A complete homepage description.", heroImageAlt: "A production set" };
    expect(siteSettingsInputSchema.parse({ ...settings, showFeaturedOverlay: "on" }).showFeaturedOverlay).toBe(true);
    expect(siteSettingsInputSchema.parse(settings).showFeaturedOverlay).toBe(false);
  });

  it("accepts editable legal page names and plain-text content", () => {
    const settings = {
      siteName: "FrameVault",
      heroEyebrow: "Curated films",
      heroTitle: "Watch remarkable stories",
      heroDescription: "A complete homepage description.",
      heroImageAlt: "A production set",
      legalNoticeLabel: "Imprint",
      legalNoticeContent: "Responsible for this website:\nExample Owner",
      privacyPolicyLabel: "Data protection",
      privacyPolicyContent: "This page explains how personal data is handled.",
    };
    const result = siteSettingsInputSchema.parse(settings);
    expect(result.legalNoticeLabel).toBe("Imprint");
    expect(result.privacyPolicyContent).toContain("personal data");
  });

  it("limits legal page content length", () => {
    const settings = { siteName: "FrameVault", heroEyebrow: "Curated films", heroTitle: "Watch remarkable stories", heroDescription: "A complete homepage description.", heroImageAlt: "A production set", legalNoticeContent: "x".repeat(50_001) };
    expect(siteSettingsInputSchema.safeParse(settings).success).toBe(false);
  });

  it("requires useful category names", () => {
    expect(categoryInputSchema.safeParse({ name: "A", sortOrder: 0 }).success).toBe(false);
  });
});
