import Link from "next/link";

export function SiteHeader({ siteName = "FrameVault" }: { siteName?: string }) {
  const normalizedName = siteName.trim();
  const lastSpace = normalizedName.lastIndexOf(" ");
  const accentStart = lastSpace >= 0 ? lastSpace + 1 : Math.max(0, normalizedName.length - 5);
  const baseName = normalizedName.slice(0, accentStart);
  const accentName = normalizedName.slice(accentStart);

  return (
    <header className="topbar">
      <div className="wrap nav">
        <Link className="brand" href="/" aria-label={`${siteName} home`}>
          {baseName}<span>{accentName}</span>
        </Link>
      </div>
    </header>
  );
}
