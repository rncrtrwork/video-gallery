"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="center-page">
      <div className="eyebrow">Temporary problem</div>
      <h1>We could not load the gallery.</h1>
      <p>Please try again. If the problem continues, contact the site owner.</p>
      <button className="btn" onClick={reset}>Try again</button>
    </main>
  );
}
