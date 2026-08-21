"use client";

import { useRef } from "react";

export function VideoPlayer({ videoId, src, poster, contentType, title }: { videoId: string; src: string; poster?: string; contentType: string; title: string }) {
  const counted = useRef(false);

  async function countView() {
    if (counted.current) return;
    counted.current = true;
    try {
      await fetch(`/api/views/${videoId}`, { method: "POST", keepalive: true });
    } catch {
      counted.current = false;
    }
  }

  return (
    <video
      className="main-player"
      controls
      playsInline
      preload="metadata"
      poster={poster}
      onPlay={countView}
      aria-label={`Video player for ${title}`}
    >
      <source src={src} type={contentType} />
      Your browser does not support HTML video.
    </video>
  );
}
