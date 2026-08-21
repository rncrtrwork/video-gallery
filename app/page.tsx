import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { GallerySearch } from "@/components/public/gallery-search";
import { VideoCard } from "@/components/public/video-card";
import { cloudinaryImageUrl, cloudinaryPosterUrl } from "@/lib/cloudinary";
import { categoryMap, getCategories, getPublishedVideos, getSettings, getVideoById } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; focus?: string; page?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.page || "1", 10) || 1));
  const [settings, categories] = await Promise.all([
    getSettings(),
    getCategories(),
  ]);
  const [pageResults, selectedFeatured, fallbackFeatured] = await Promise.all([
    getPublishedVideos({ query: params.q, categorySlug: params.category, offset: (page - 1) * 24, limit: 25 }),
    settings.featuredVideoId ? getVideoById(settings.featuredVideoId.toHexString()) : Promise.resolve(null),
    getPublishedVideos({ limit: 1 }),
  ]);
  const hasNext = pageResults.length > 24;
  const videos = pageResults.slice(0, 24);
  const categoriesById = categoryMap(categories);
  const featured = selectedFeatured?.status === "published" ? selectedFeatured : fallbackFeatured[0];
  const heroSrc = settings.heroImage?.publicId
    ? cloudinaryImageUrl(settings.heroImage.publicId, 1400)
    : featured?.cloudinary?.publicId
      ? cloudinaryPosterUrl(featured.cloudinary.publicId, 1400)
      : null;

  return (
    <>
      <SiteHeader siteName={settings.siteName} />
      <main id="top">
        <section className="hero">
          <div className="wrap hero-grid">
            <div>
              <div className="eyebrow">{settings.heroEyebrow}</div>
              <h1>{settings.heroTitle}</h1>
              <p>{settings.heroDescription}</p>
              <Link className="btn" href="/user">Upload Video</Link>
            </div>
            <div className="hero-card">
              {heroSrc ? <Image src={heroSrc} alt={settings.heroImageAlt} width={1200} height={800} priority /> : <div className="hero-placeholder" />}
              {featured && <div className="hero-overlay"><span>Featured</span><strong>{featured.title}</strong></div>}
            </div>
          </div>
        </section>

        <section className="wrap section" id="gallery">
          <div className="section-head">
            <div><div className="eyebrow">Latest uploads</div><h2>The Gallery</h2></div>
            <GallerySearch initialQuery={params.q} category={params.category} autoFocus={params.focus === "search"} />
          </div>
          <div className="filters" aria-label="Filter by category">
            <Link scroll={false} className={`filter ${!params.category ? "active" : ""}`} href={params.q ? `/?q=${encodeURIComponent(params.q)}` : "/"}>All</Link>
            {categories.map((category) => (
              <Link scroll={false} key={category._id?.toHexString()} className={`filter ${params.category === category.slug ? "active" : ""}`} href={`/?category=${category.slug}${params.q ? `&q=${encodeURIComponent(params.q)}` : ""}`}>
                {category.name}
              </Link>
            ))}
          </div>
          {videos.length ? (
            <><div className="video-grid">
              {videos.map((video) => <VideoCard key={video._id?.toHexString()} video={video} category={video.categoryId ? categoriesById.get(video.categoryId.toHexString())?.name : undefined} />)}
            </div><div className="pagination">{page > 1 && <Link scroll={false} className="ghost" href={`/?${new URLSearchParams({ ...(params.q ? { q: params.q } : {}), ...(params.category ? { category: params.category } : {}), page: String(page - 1) })}`}>← Previous</Link>}<span>Page {page}</span>{hasNext && <Link scroll={false} className="ghost" href={`/?${new URLSearchParams({ ...(params.q ? { q: params.q } : {}), ...(params.category ? { category: params.category } : {}), page: String(page + 1) })}`}>Next →</Link>}</div></>
          ) : (
            <div className="empty-state"><h3>No videos found</h3><p>Try another search or category.</p><Link scroll={false} href="/">Clear filters</Link></div>
          )}
        </section>

      </main>
      <SiteFooter siteName={settings.siteName} />
    </>
  );
}
