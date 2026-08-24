import Link from "next/link";

interface SiteFooterProps {
  siteName?: string;
  aboutPageLabel?: string;
  privacyPolicyLabel?: string;
}

export function SiteFooter({ siteName = "FrameVault", aboutPageLabel = "About", privacyPolicyLabel = "Privacy policy" }: SiteFooterProps) {
  return (
    <footer>
      <div className="wrap footer-simple">
        <div className="brand">{siteName}</div>
        <nav className="footer-page-links" aria-label="Information pages">
          <Link href="/about">{aboutPageLabel}</Link>
          <Link href="/privacy-policy">{privacyPolicyLabel}</Link>
        </nav>
      </div>
    </footer>
  );
}
