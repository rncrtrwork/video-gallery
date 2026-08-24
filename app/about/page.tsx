import type { Metadata } from "next";
import Image from "next/image";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getSettings } from "@/lib/repositories";
import { storageUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const heroImage = settings.aboutPageImage?.key
    ? storageUrl(settings.aboutPageImage.key)
    : settings.heroImage?.key ? storageUrl(settings.heroImage.key) : undefined;
  return {
    title: settings.aboutPageLabel,
    description: `${settings.aboutPageLabel} — ${settings.siteName}.`,
    alternates: { canonical: "/about" },
    openGraph: { title: settings.aboutPageLabel, images: heroImage ? [heroImage] : [] },
  };
}

export default async function AboutPage() {
  const settings = await getSettings();
  const imageUrl = settings.aboutPageImage?.key
    ? storageUrl(settings.aboutPageImage.key)
    : settings.heroImage?.key ? storageUrl(settings.heroImage.key) : null;
  const imageAlt = settings.aboutPageImage?.key ? settings.aboutPageLabel : settings.heroImageAlt;

  return (
    <>
      <SiteHeader siteName={settings.siteName} />
      <main className="about-page">
        <div className="wrap about-page-grid">
          <article className="about-page-copy">
            <h1>{settings.aboutPageLabel}</h1>
            {settings.aboutPageContent
              ? <div className="page-copy">{settings.aboutPageContent}</div>
              : <p className="page-empty">Content will be added by the site owner.</p>}
          </article>
          <div className="about-page-image">
            {imageUrl
              ? <Image src={imageUrl} alt={imageAlt} width={900} height={1040} priority />
              : <div className="about-page-image-placeholder" aria-hidden="true" />}
          </div>
        </div>
      </main>
      <SiteFooter siteName={settings.siteName} aboutPageLabel={settings.aboutPageLabel} privacyPolicyLabel={settings.privacyPolicyLabel} />
    </>
  );
}
