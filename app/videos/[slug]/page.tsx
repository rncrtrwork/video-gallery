import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { VideoCard } from "@/components/public/video-card";
import { VideoPlayer } from "@/components/public/video-player";
import { cloudinaryImageUrl, cloudinaryPosterUrl, cloudinaryVideoUrl } from "@/lib/cloudinary";
import { categoryMap, getCategories, getPublishedVideos, getSettings, getVideoBySlug } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const video = await getVideoBySlug(slug);
  if (!video) return { title: "Video not found" };
  const posterId = video.poster?.publicId ?? video.cloudinary?.publicId;
  return {
    title: video.title,
    description: video.description,
    alternates: { canonical: `/videos/${video.slug}` },
    openGraph: { type: "video.other", title: video.title, description: video.description, images: posterId ? [cloudinaryPosterUrl(posterId, 1200)] : [] },
  };
}

export default async function VideoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [video, settings, categories] = await Promise.all([getVideoBySlug(slug), getSettings(), getCategories()]);
  if (!video?._id || !video.cloudinary?.publicId) notFound();
  const related = (await getPublishedVideos({ limit: 4 })).filter((item) => !item._id?.equals(video._id)).slice(0, 3);
  const categoriesById = categoryMap(categories);
  const posterUrl = video.poster?.secureUrl || (video.poster?.publicId ? cloudinaryImageUrl(video.poster.publicId, 1600) : cloudinaryPosterUrl(video.cloudinary.publicId, 1600));

  return (
    <>
      <SiteHeader siteName={settings.siteName} />
      <main>
        <section className="video-hero wrap">
          <Link className="back-link" href="/#gallery">← Back to gallery</Link>
          <VideoPlayer videoId={video._id.toHexString()} src={cloudinaryVideoUrl(video.cloudinary.publicId)} poster={posterUrl} title={video.title} />
          <div className="video-copy">
            <div className="eyebrow">{video.categoryId ? categoriesById.get(video.categoryId.toHexString())?.name : "Video"}</div>
            <h1>{video.title}</h1>
            <p>{video.description}</p>
            <div className="player-meta"><span>{video.viewCount.toLocaleString()} views</span>{video.media?.durationSeconds && <span>{Math.ceil(video.media.durationSeconds / 60)} min</span>}</div>
          </div>
        </section>
        {related.length > 0 && <section className="wrap section"><div className="eyebrow">Continue watching</div><h2>More videos</h2><div className="video-grid">{related.map((item) => <VideoCard key={item._id?.toHexString()} video={item} category={item.categoryId ? categoriesById.get(item.categoryId.toHexString())?.name : undefined} />)}</div></section>}
      </main>
      <SiteFooter siteName={settings.siteName} />
    </>
  );
}
