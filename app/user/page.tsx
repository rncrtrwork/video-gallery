import Link from "next/link";
import { PublicUploadForm } from "@/components/public/public-upload-form";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getCategories, getSettings } from "@/lib/repositories";

export const dynamic = "force-dynamic";
export const metadata = { title: "Upload a video", robots: { index: false, follow: false } };

export default async function UserUploadPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const [{ success, error }, settings, categories] = await Promise.all([searchParams, getSettings(), getCategories(true)]);

  return (
    <>
      <SiteHeader siteName={settings.siteName} />
      <main className="wrap user-upload-page">
        <div className="user-upload-heading">
          <div><div className="eyebrow">Share your video</div><h1>Upload a video</h1><p>Complete the details and upload the file. It will be published to the gallery immediately.</p></div>
          <Link className="ghost" href="/">Return to gallery</Link>
        </div>
        {success && <div className="flash-success">Your video was published.</div>}
        {error && <div className="flash-error">{error === "rate" ? "Upload limit reached. Try again later." : error === "media" ? "The uploaded video could not be verified. Upload it again." : "Check the form and try again."}</div>}
        <section className="admin-panel user-upload-panel"><PublicUploadForm categories={categories} /></section>
      </main>
      <SiteFooter siteName={settings.siteName} />
    </>
  );
}
