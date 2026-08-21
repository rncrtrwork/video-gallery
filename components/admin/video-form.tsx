import type { CategoryDocument, VideoDocument } from "@/lib/types";
import { CloudinaryUpload } from "./cloudinary-upload";
import { saveVideoAction } from "@/app/admin/actions";

function assetJson(asset?: VideoDocument["cloudinary"] | VideoDocument["poster"]) {
  return asset ? JSON.stringify(asset) : "";
}

export function VideoForm({ video, categories, returnTo }: { video?: VideoDocument; categories: CategoryDocument[]; returnTo?: "/user" }) {
  return (
    <form className="admin-form" action={saveVideoAction}>
      {video?._id && <input type="hidden" name="id" value={video._id.toHexString()} />}
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      <div className="form-grid">
        <div className="form-group full"><label htmlFor="title">Title</label><input className="form-control" id="title" name="title" defaultValue={video?.title} required minLength={2} maxLength={120} /></div>
        <div className="form-group"><label htmlFor="slug">URL slug</label><input className="form-control" id="slug" name="slug" defaultValue={video?.slug} placeholder="Generated from title" maxLength={140} /><small>Leave blank to generate automatically.</small></div>
        <div className="form-group"><label htmlFor="categoryId">Category</label><select className="form-control" id="categoryId" name="categoryId" defaultValue={video?.categoryId?.toHexString() || ""}><option value="">No category</option>{categories.map((category) => <option value={category._id?.toHexString()} key={category._id?.toHexString()}>{category.name}{!category.isActive ? " (inactive)" : ""}</option>)}</select></div>
        <div className="form-group full"><label htmlFor="shortDescription">Card description</label><textarea className="form-control" id="shortDescription" name="shortDescription" defaultValue={video?.shortDescription} required minLength={5} maxLength={240} /><small>Maximum 240 characters.</small></div>
        <div className="form-group full"><label htmlFor="fullDescription">Full description</label><textarea className="form-control" id="fullDescription" name="fullDescription" defaultValue={video?.fullDescription} required minLength={5} maxLength={5000} /></div>
        <div className="form-group"><label htmlFor="tags">Tags</label><input className="form-control" id="tags" name="tags" defaultValue={video?.tags.join(", ")} placeholder="film, interview, coast" /><small>Comma-separated.</small></div>
        <div className="form-group"><label htmlFor="sortOrder">Sort order</label><input className="form-control" id="sortOrder" name="sortOrder" type="number" min="0" defaultValue={video?.sortOrder ?? 0} /></div>
        <div className="form-group full"><label className="checkbox"><input name="featured" type="checkbox" defaultChecked={video?.featured} /> Feature this video</label></div>
        <div className="form-group full"><CloudinaryUpload kind="video" inputName="assetJson" initialJson={assetJson(video?.cloudinary)} label={video?.cloudinary ? "Replace video file" : "Upload video file"} /></div>
        <div className="form-group full"><CloudinaryUpload kind="image" inputName="posterJson" initialJson={assetJson(video?.poster)} label="Optional custom poster" /></div>
      </div>
      <div className="form-actions"><button className="btn" type="submit">{returnTo === "/user" ? "Submit video" : "Save draft"}</button><span className="subtle">The video is saved as a draft and must be reviewed before publication.</span></div>
    </form>
  );
}
