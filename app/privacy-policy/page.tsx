import type { Metadata } from "next";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getSettings } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: settings.privacyPolicyLabel,
    description: `${settings.privacyPolicyLabel} for ${settings.siteName}.`,
    alternates: { canonical: "/privacy-policy" },
  };
}

export default async function PrivacyPolicyPage() {
  const settings = await getSettings();

  return (
    <>
      <SiteHeader siteName={settings.siteName} />
      <main className="legal-page wrap">
        <article>
          <div className="eyebrow">Legal information</div>
          <h1>{settings.privacyPolicyLabel}</h1>
          {settings.privacyPolicyContent
            ? <div className="legal-copy">{settings.privacyPolicyContent}</div>
            : <p className="legal-empty">Content will be added by the site owner.</p>}
        </article>
      </main>
      <SiteFooter siteName={settings.siteName} legalNoticeLabel={settings.legalNoticeLabel} privacyPolicyLabel={settings.privacyPolicyLabel} />
    </>
  );
}
