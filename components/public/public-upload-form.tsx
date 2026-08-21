import { submitPublicVideoAction } from "@/app/user/actions";
import type { CategoryDocument } from "@/lib/types";
import { CloudinaryUpload } from "@/components/admin/cloudinary-upload";
import { PublishButton } from "@/components/public/publish-button";

export function PublicUploadForm({ categories }: { categories: CategoryDocument[] }) {
  return (
    <form className="admin-form" action={submitPublicVideoAction}>
      <div className="form-grid">
        <div className="form-group full"><label htmlFor="title">Title</label><input className="form-control" id="title" name="title" required minLength={2} maxLength={120} /></div>
        <div className="form-group full"><label htmlFor="description">Description</label><textarea className="form-control" id="description" name="description" required minLength={5} maxLength={5000} /><small>Long descriptions are shortened automatically on gallery cards.</small></div>
        <div className="form-group"><label htmlFor="categoryId">Category</label><select className="form-control" id="categoryId" name="categoryId" defaultValue=""><option value="">No category</option>{categories.filter((category) => category.isActive).map((category) => <option value={category._id?.toHexString()} key={category._id?.toHexString()}>{category.name}</option>)}</select></div>
        <div className="form-group"><label htmlFor="tags">Tags</label><input className="form-control" id="tags" name="tags" placeholder="film, interview, coast" maxLength={500} /><small>Comma-separated.</small></div>
        <input type="hidden" name="sortOrder" value="0" />
        <div className="form-group full"><CloudinaryUpload kind="video" inputName="assetJson" label="Upload video file" publicUpload /></div>
      </div>
      <div className="form-actions"><PublishButton /><span className="subtle">Your video will be visible in the gallery immediately.</span></div>
    </form>
  );
}
