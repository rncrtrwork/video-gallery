import Link from "next/link";
import { notFound } from "next/navigation";
import { VideoForm } from "@/components/admin/video-form";
import { getCategories, getVideoById } from "@/lib/repositories";
import { setVideoStatusAction } from "@/app/admin/actions";

export default async function EditVideoPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; success?: string }> }) {
  const { id } = await params;
  const [{ error, success }, video, categories] = await Promise.all([searchParams, getVideoById(id), getCategories(true)]);
  if (!video?._id) notFound();
  return <><div className="admin-heading"><div><Link className="back-link" href="/admin/videos">← Videos</Link><div className="eyebrow">{video.status}</div><h1>Edit video</h1></div><div className="inline-actions">{video.status !== "published" && <form action={setVideoStatusAction}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value="published" /><button className="btn" type="submit">Publish</button></form>}{video.status === "published" && <Link className="ghost" href={`/videos/${video.slug}`} target="_blank">View live ↗</Link>}</div></div>{success && <div className="flash-success">Draft saved.</div>}{error === "media-required" && <div className="flash-error">Upload and save a video file before publishing.</div>}{error === "validation" && <div className="flash-error">Check the form and try again.</div>}<VideoForm video={video} categories={categories} /></>;
}
