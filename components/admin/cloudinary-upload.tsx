"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

type UploadResult = {
  asset_id: string;
  public_id: string;
  version?: number;
  format?: string;
  secure_url?: string;
  duration?: number;
  width?: number;
  height?: number;
  bytes?: number;
};

type Widget = { open: () => void; destroy: () => void };

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (error: { message?: string } | null, result: { event: string; info?: UploadResult }) => void,
      ) => Widget;
    };
  }
}

export function CloudinaryUpload({ kind, inputName, initialJson, label }: { kind: "video" | "image"; inputName: string; initialJson?: string; label: string }) {
  const [config, setConfig] = useState<{ cloudName: string; apiKey: string } | null>(null);
  const [assetJson, setAssetJson] = useState(initialJson || "");
  const [status, setStatus] = useState(initialJson ? "Media attached" : "");

  useEffect(() => {
    fetch("/api/cloudinary/signature", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Upload configuration unavailable")))
      .then(setConfig)
      .catch((error: Error) => setStatus(error.message));
  }, []);

  function openWidget() {
    if (!config || !window.cloudinary) return;
    const folder = kind === "video" ? "framevault/videos" : "framevault/images";
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: config.cloudName,
        apiKey: config.apiKey,
        resourceType: kind,
        folder,
        multiple: false,
        maxFiles: 1,
        clientAllowedFormats: kind === "video" ? ["mp4", "mov", "webm", "mkv"] : ["jpg", "jpeg", "png", "webp", "avif"],
        maxFileSize: kind === "video" ? 1_000_000_000 : 15_000_000,
        uploadSignature: async (callback: (signature: string) => void, paramsToSign: Record<string, string | number>) => {
          const response = await fetch("/api/cloudinary/signature", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ paramsToSign, kind }),
          });
          if (!response.ok) throw new Error("Could not authorize upload");
          const data = await response.json() as { signature: string };
          callback(data.signature);
        },
      },
      (error, result) => {
        if (error) setStatus(error.message || "Upload failed");
        if (result.event === "success" && result.info) {
          setAssetJson(JSON.stringify(result.info));
          setStatus(`${result.info.public_id} uploaded successfully`);
          widget.destroy();
        }
      },
    );
    widget.open();
  }

  return (
    <div className="upload-box">
      <Script src="https://upload-widget.cloudinary.com/latest/global/all.js" strategy="lazyOnload" />
      <strong>{label}</strong>
      <p>{kind === "video" ? "MP4, MOV, WebM, or MKV. The file uploads directly to Cloudinary." : "JPG, PNG, WebP, or AVIF. Use a wide landscape image."}</p>
      <input type="hidden" name={inputName} value={assetJson} />
      <button className="ghost" type="button" onClick={openWidget} disabled={!config}>Choose {kind}</button>
      {status && <div className="upload-success" aria-live="polite">{status}</div>}
    </div>
  );
}
