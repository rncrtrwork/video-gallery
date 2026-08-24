import Link from "next/link";

interface SiteFooterProps {
  siteName?: string;
  legalNoticeLabel?: string;
  privacyPolicyLabel?: string;
}

export function SiteFooter({ siteName = "FrameVault", legalNoticeLabel = "Legal notice", privacyPolicyLabel = "Privacy policy" }: SiteFooterProps) {
  return (
    <footer>
      <div className="wrap footer-simple">
        <div className="brand">{siteName}</div>
        <nav className="footer-legal-links" aria-label="Legal information">
          <Link href="/legal-notice">{legalNoticeLabel}</Link>
          <Link href="/privacy-policy">{privacyPolicyLabel}</Link>
        </nav>
      </div>
    </footer>
  );
}
