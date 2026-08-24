import type { Metadata } from "next";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getSettings } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: settings.legalNoticeLabel,
    description: `${settings.legalNoticeLabel} for ${settings.siteName}.`,
    alternates: { canonical: "/legal-notice" },
  };
}

export default async function LegalNoticePage() {
  const settings = await getSettings();

  return (
    <>
      <SiteHeader siteName={settings.siteName} />
      <main className="legal-page wrap">
        <article>
          <div className="eyebrow">Legal information</div>
          <h1>{settings.legalNoticeLabel}</h1>
          {settings.legalNoticeContent
            ? <div className="legal-copy">{settings.legalNoticeContent}</div>
            : <p className="legal-empty">Content will be added by the site owner.</p>}
        </article>
      </main>
      <SiteFooter siteName={settings.siteName} legalNoticeLabel={settings.legalNoticeLabel} privacyPolicyLabel={settings.privacyPolicyLabel} />
    </>
  );
}
