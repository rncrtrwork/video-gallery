import Link from "next/link";
import { VideoForm } from "@/components/admin/video-form";
import { getCategories } from "@/lib/repositories";

export default async function NewVideoPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, categories] = await Promise.all([searchParams, getCategories(true)]);
  return <><div className="admin-heading"><div><Link className="back-link" href="/admin/videos">← Videos</Link><div className="eyebrow">New draft</div><h1>Add video</h1></div></div>{error && <div className="flash-error">Check the form and try again.</div>}<VideoForm categories={categories} /></>;
}
