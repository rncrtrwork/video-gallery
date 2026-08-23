"use client";

import { type ReactNode, useRef, useState } from "react";

interface VideoPlayerProps {
  videoId: string;
  src: string;
  poster?: string;
  contentType: string;
  title: string;
  initialViewCount: number;
  durationSeconds?: number;
  children: ReactNode;
}

export function VideoPlayer({ videoId, src, poster, contentType, title, initialViewCount, durationSeconds, children }: VideoPlayerProps) {
  const counted = useRef(false);
  const [viewCount, setViewCount] = useState(initialViewCount);

  async function countView() {
    if (counted.current) return;
    counted.current = true;
    try {
      const response = await fetch(`/api/views/${videoId}`, { method: "POST", keepalive: true });
      if (!response.ok) throw new Error("Unable to count view");
      const result = await response.json() as { viewCount?: number };
      if (typeof result.viewCount === "number") setViewCount(result.viewCount);
    } catch {
      counted.current = false;
    }
  }

  return (
    <>
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
      <div className="video-copy">
        {children}
        <div className="player-meta" aria-live="polite">
          <span>{viewCount.toLocaleString()} views</span>
          {durationSeconds ? <span>{Math.ceil(durationSeconds / 60)} min</span> : null}
        </div>
      </div>
    </>
  );
}
