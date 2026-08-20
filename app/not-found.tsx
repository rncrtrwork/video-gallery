import Link from "next/link";

export default function NotFound() {
  return (
    <main className="center-page">
      <div className="eyebrow">404</div>
      <h1>That film is not here.</h1>
      <p>The link may be old, or the video may no longer be published.</p>
      <Link className="btn" href="/">Return to the gallery</Link>
    </main>
  );
}
