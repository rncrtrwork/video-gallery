export function SiteFooter({ siteName = "FrameVault" }: { siteName?: string }) {
  return (
    <footer>
      <div className="wrap footer-simple">
        <div><div className="brand">{siteName}</div><p>Curated stories, delivered from the cloud.</p></div>
      </div>
    </footer>
  );
}
