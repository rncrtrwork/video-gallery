export function SiteFooter({ siteName = "FrameVault" }: { siteName?: string }) {
  return (
    <footer>
      <div className="wrap footer-simple">
        <div className="brand">{siteName}</div>
      </div>
    </footer>
  );
}
