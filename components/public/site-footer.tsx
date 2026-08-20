import Link from "next/link";

export function SiteFooter({ siteName = "FrameVault" }: { siteName?: string }) {
  return (
    <footer>
      <div className="wrap footer-grid">
        <div><div className="brand">{siteName}</div><p>Curated stories, delivered from the cloud.</p></div>
        <div><strong>Explore</strong><Link href="/#gallery">Gallery</Link><Link href="/#about">About</Link></div>
        <div><strong>Manage</strong><Link href="/admin">Admin sign in</Link></div>
      </div>
    </footer>
  );
}
