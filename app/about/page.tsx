import type { Metadata } from "next";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getSettings } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: settings.aboutPageLabel,
    description: `${settings.aboutPageLabel} — ${settings.siteName}.`,
    alternates: { canonical: "/about" },
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
          {settings.aboutPageContent
            ? <div className="page-copy">{settings.aboutPageContent}</div>
            : <p className="page-empty">Content will be added by the site owner.</p>}
        </article>
      </main>
      <SiteFooter siteName={settings.siteName} aboutPageLabel={settings.aboutPageLabel} privacyPolicyLabel={settings.privacyPolicyLabel} />
    </>
  );
}
