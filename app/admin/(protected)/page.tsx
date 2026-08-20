import Link from "next/link";
import { getDb } from "@/lib/db";

export default async function DashboardPage() {
  const db = await getDb();
  const [published, drafts, processing, failed, recent] = await Promise.all([
    db.collection("videos").countDocuments({ status: "published" }),
    db.collection("videos").countDocuments({ status: "draft" }),
    db.collection("videos").countDocuments({ status: "processing" }),
    db.collection("videos").countDocuments({ status: "failed" }),
    db.collection("auditLogs").find().sort({ createdAt: -1 }).limit(8).toArray(),
  ]);
  return (
    <>
      <div className="admin-heading"><div><div className="eyebrow">Overview</div><h1>Dashboard</h1></div><Link className="btn" href="/admin/videos/new">Add video</Link></div>
      <div className="admin-grid">
        <div className="metric"><strong>{published}</strong><span>Published</span></div>
        <div className="metric"><strong>{drafts}</strong><span>Drafts</span></div>
        <div className="metric"><strong>{processing}</strong><span>Processing</span></div>
        <div className="metric"><strong>{failed}</strong><span>Failed</span></div>
      </div>
      <section className="admin-panel"><h2>Quick actions</h2><div className="inline-actions"><Link className="ghost" href="/admin/content">Edit homepage</Link><Link className="ghost" href="/admin/categories">Manage categories</Link><Link className="ghost" href="/admin/videos">Review videos</Link></div></section>
      <section className="admin-panel"><h2>Recent activity</h2>{recent.length ? <table className="admin-table"><thead><tr><th>Action</th><th>Type</th><th>Time</th></tr></thead><tbody>{recent.map((item) => <tr key={item._id.toHexString()}><td>{String(item.action)}</td><td>{String(item.entityType)}</td><td>{new Date(item.createdAt as Date).toLocaleString()}</td></tr>)}</tbody></table> : <p className="subtle">No changes yet.</p>}</section>
    </>
  );
}
