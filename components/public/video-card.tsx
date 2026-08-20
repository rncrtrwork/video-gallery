import Image from "next/image";
import Link from "next/link";
import { cloudinaryImageUrl, cloudinaryPosterUrl } from "@/lib/cloudinary";
import type { VideoDocument } from "@/lib/types";

function duration(value?: number) {
  if (!value) return null;
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function VideoCard({ video, category }: { video: VideoDocument; category?: string }) {
  const posterId = video.poster?.publicId ?? video.cloudinary?.publicId;
  const posterSrc = video.poster?.secureUrl || (video.poster?.publicId ? cloudinaryImageUrl(video.poster.publicId, 900) : video.cloudinary?.publicId ? cloudinaryPosterUrl(video.cloudinary.publicId, 900) : null);
  return (
    <article className="video-card">
      <Link href={`/videos/${video.slug}`} aria-label={`Watch ${video.title}`}>
        <div className="thumb">
          {posterId && posterSrc ? (
            <Image src={posterSrc} alt="" fill sizes="(max-width: 650px) 100vw, (max-width: 900px) 50vw, 33vw" />
          ) : <div className="poster-placeholder" aria-hidden="true" />}
          <span className="play" aria-hidden="true">▶</span>
          {duration(video.media?.durationSeconds) && <span className="duration">{duration(video.media?.durationSeconds)}</span>}
        </div>
        <div className="card-body">
          <div className="eyebrow">{category || "Video"}</div>
          <h3>{video.title}</h3>
          <p>{video.shortDescription}</p>
          <div className="meta"><span>{video.viewCount.toLocaleString()} views</span><span>Cloud video</span></div>
        </div>
      </Link>
    </article>
  );
}
