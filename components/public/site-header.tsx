import Link from "next/link";

export function SiteHeader({ siteName = "FrameVault" }: { siteName?: string }) {
  return (
    <header className="topbar">
      <div className="wrap nav">
        <Link className="brand" href="/" aria-label={`${siteName} home`}>
          {siteName.slice(0, -5) || siteName}<span>{siteName.length > 5 ? siteName.slice(-5) : ""}</span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/#gallery">Gallery</Link>
          <Link href="/#about">About</Link>
          <Link className="ghost" href="/?focus=search#gallery">Search</Link>
        </nav>
      </div>
    </header>
  );
}
