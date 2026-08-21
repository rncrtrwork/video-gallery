import { CloudinaryUpload } from "@/components/admin/cloudinary-upload";
import { saveSettingsAction } from "@/app/admin/actions";
import { getAllVideos, getSettings } from "@/lib/repositories";

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const [{ success, error }, settings, videos] = await Promise.all([searchParams, getSettings(), getAllVideos()]);
  const published = videos.filter((video) => video.status === "published");
  return (
    <>
      <div className="admin-heading"><div><div className="eyebrow">Site content</div><h1>Homepage</h1></div></div>
      {success && <div className="flash-success">Homepage content saved and public cache refreshed.</div>}
      {error && <div className="flash-error">Check all fields and try again.</div>}
      <form className="admin-form" action={saveSettingsAction}>
        <section className="admin-panel"><h2>Brand and hero</h2><div className="form-grid">
          <div className="form-group"><label htmlFor="siteName">Site name</label><input className="form-control" id="siteName" name="siteName" defaultValue={settings.siteName} required maxLength={60} /></div>
          <div className="form-group"><label htmlFor="heroEyebrow">Eyebrow</label><input className="form-control" id="heroEyebrow" name="heroEyebrow" defaultValue={settings.heroEyebrow} required maxLength={60} /></div>
          <div className="form-group full"><label htmlFor="heroTitle">Main heading</label><input className="form-control" id="heroTitle" name="heroTitle" defaultValue={settings.heroTitle} required maxLength={120} /></div>
          <div className="form-group full"><label htmlFor="heroDescription">Top description</label><textarea className="form-control" id="heroDescription" name="heroDescription" defaultValue={settings.heroDescription} required minLength={10} maxLength={500} /></div>
          <div className="form-group"><label htmlFor="heroButtonLabel">Button label</label><input className="form-control" id="heroButtonLabel" name="heroButtonLabel" defaultValue={settings.heroButtonLabel} required maxLength={40} /></div>
          <div className="form-group"><label htmlFor="heroButtonLink">Button link</label><input className="form-control" id="heroButtonLink" name="heroButtonLink" defaultValue={settings.heroButtonLink} required /></div>
          <div className="form-group full"><CloudinaryUpload kind="image" inputName="heroImageJson" initialJson={settings.heroImage ? JSON.stringify(settings.heroImage) : ""} label="Banner image" /></div>
          <div className="form-group full"><label htmlFor="heroImageAlt">Banner alternative text</label><input className="form-control" id="heroImageAlt" name="heroImageAlt" defaultValue={settings.heroImageAlt} required maxLength={180} /></div>
          <div className="form-group full"><label htmlFor="featuredVideoId">Featured video</label><select className="form-control" id="featuredVideoId" name="featuredVideoId" defaultValue={settings.featuredVideoId?.toHexString() || ""}><option value="">Choose automatically</option>{published.map((video) => <option key={video._id?.toHexString()} value={video._id?.toHexString()}>{video.title}</option>)}</select></div>
        </div></section>
        <div className="form-actions"><button className="btn" type="submit">Save homepage</button><span className="subtle">Changes become public immediately.</span></div>
      </form>
    </>
  );
}
