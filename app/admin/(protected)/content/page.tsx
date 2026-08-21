import { BackblazeUpload } from "@/components/admin/backblaze-upload";
import { saveSettingsAction } from "@/app/admin/actions";
import { getAllVideos, getSettings } from "@/lib/repositories";
import { storageUrl } from "@/lib/storage";

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
          <div className="form-group full"><BackblazeUpload kind="image" inputName="heroImageJson" initialJson={settings.heroImage ? JSON.stringify({ ...settings.heroImage, url: storageUrl(settings.heroImage.key) }) : ""} label="Banner image" /></div>
          <div className="form-group full"><label htmlFor="heroImageAlt">Banner alternative text</label><input className="form-control" id="heroImageAlt" name="heroImageAlt" defaultValue={settings.heroImageAlt} required maxLength={180} /></div>
          <div className="form-group full"><label htmlFor="featuredVideoId">Featured video</label><select className="form-control" id="featuredVideoId" name="featuredVideoId" defaultValue={settings.featuredVideoId?.toHexString() || ""}><option value="">Automatic — first video in gallery</option>{published.map((video) => <option key={video._id?.toHexString()} value={video._id?.toHexString()}>{video.title}</option>)}</select><small>Visitors open this video when they click the banner image. Automatic uses the first published video in gallery order.</small></div>
          <div className="form-group full"><label className="checkbox"><input name="showFeaturedOverlay" type="checkbox" defaultChecked={settings.showFeaturedOverlay !== false} /> Show featured text box on banner</label><small>Turn this off to show only the banner image. The banner remains linked to the featured video.</small></div>
        </div></section>
        <div className="form-actions"><button className="btn" type="submit">Save homepage</button><span className="subtle">Changes become public immediately.</span></div>
      </form>
    </>
  );
}
