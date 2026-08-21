import Link from "next/link";
import { VideoForm } from "@/components/admin/video-form";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { requireAdmin } from "@/lib/auth";
import { getCategories, getSettings } from "@/lib/repositories";

export const dynamic = "force-dynamic";
export const metadata = { title: "Upload a video", robots: { index: false, follow: false } };

export default async function UserUploadPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  await requireAdmin("/admin/login?next=/user");
  const [{ success, error }, settings, categories] = await Promise.all([searchParams, getSettings(), getCategories(true)]);

  return (
    <>
      <SiteHeader siteName={settings.siteName} />
      <main className="wrap user-upload-page">
        <div className="user-upload-heading">
          <div><div className="eyebrow">Authenticated upload</div><h1>Upload a video</h1><p>Complete the details and upload the file. Your submission will remain private until it is reviewed and published.</p></div>
          <Link className="ghost" href="/">Return to gallery</Link>
        </div>
        {success && <div className="flash-success">Your video was uploaded and saved for review.</div>}
        {error && <div className="flash-error">Check the form and try again.</div>}
        <section className="admin-panel user-upload-panel"><VideoForm categories={categories} returnTo="/user" /></section>
      </main>
      <SiteFooter siteName={settings.siteName} />
    </>
  );
}
