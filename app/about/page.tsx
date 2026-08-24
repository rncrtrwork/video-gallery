import type { Metadata } from "next";
import Image from "next/image";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getSettings } from "@/lib/repositories";
import { storageUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const heroImage = settings.aboutPageImage?.key ? storageUrl(settings.aboutPageImage.key) : undefined;
  return {
    title: settings.aboutPageLabel,
    description: `${settings.aboutPageLabel} — ${settings.siteName}.`,
    alternates: { canonical: "/about" },
    openGraph: { title: settings.aboutPageLabel, images: heroImage ? [heroImage] : [] },
  };
}

export default async function AboutPage() {
  const settings = await getSettings();

  return (
    <>
      <SiteHeader siteName={settings.siteName} />
      <main className="content-page wrap">
        <article>
          <div className="eyebrow">About</div>
          <h1>{settings.aboutPageLabel}</h1>
          {settings.aboutPageImage?.key
            ? <div className="about-page-hero"><Image src={storageUrl(settings.aboutPageImage.key)} alt={settings.aboutPageImageAlt} width={1600} height={700} priority /></div>
            : null}
          {settings.aboutPageContent
            ? <div className="page-copy">{settings.aboutPageContent}</div>
            : <p className="page-empty">Content will be added by the site owner.</p>}
        </article>
      </main>
      <SiteFooter siteName={settings.siteName} aboutPageLabel={settings.aboutPageLabel} privacyPolicyLabel={settings.privacyPolicyLabel} />
    </>
  );
}
