import Link from "next/link";

export function SiteHeader({ siteName = "FrameVault" }: { siteName?: string }) {
  return (
    <header className="topbar">
      <div className="wrap nav">
        <Link className="brand" href="/" aria-label={`${siteName} home`}>
          {siteName.slice(0, -5) || siteName}<span>{siteName.length > 5 ? siteName.slice(-5) : ""}</span>
        </Link>
      </div>
    </header>
  );
}
