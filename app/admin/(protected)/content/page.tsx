import { BackblazeUpload } from "@/components/admin/backblaze-upload";
import { saveSettingsAction } from "@/app/admin/actions";
import { getAllVideos, getSettings } from "@/lib/repositories";
import { storageUrl } from "@/lib/storage";

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const [{ success, error }, settings, videos] = await Promise.all([searchParams, getSettings(), getAllVideos()]);
  const published = videos.filter((video) => video.status === "published");
  const errorMessage = error === "hero-image"
    ? "The homepage banner could not be verified. Upload it again and retry."
    : error === "about-image"
      ? "The About page image could not be verified. Upload it again and retry."
      : "Check all required fields and their length limits, then try again.";
  return (
    <>
      <div className="admin-heading"><div><div className="eyebrow">Site content</div><h1>Pages</h1></div></div>
      {success && <div className="flash-success">Site content saved and public cache refreshed.</div>}
      {error && <div className="flash-error">{errorMessage}</div>}
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
        <section className="admin-panel"><h2>Footer and information pages</h2><p className="subtle">The page names become links in the public footer. Enter plain text; line breaks are preserved. Have the final privacy wording reviewed by a qualified professional.</p><div className="form-grid content-settings-grid">
          <div className="form-group full"><label htmlFor="aboutPageLabel">About page name</label><input className="form-control" id="aboutPageLabel" name="aboutPageLabel" defaultValue={settings.aboutPageLabel} required minLength={2} maxLength={80} /><small>For example: About or About us.</small></div>
          <div className="form-group full"><BackblazeUpload kind="image" inputName="aboutPageImageJson" initialJson={settings.aboutPageImage ? JSON.stringify({ ...settings.aboutPageImage, url: storageUrl(settings.aboutPageImage.key) }) : ""} label="About page hero image" /></div>
          <div className="form-group full"><label htmlFor="aboutPageContent">About the client</label><textarea className="form-control page-content-input" id="aboutPageContent" name="aboutPageContent" defaultValue={settings.aboutPageContent} maxLength={50000} /></div>
          <div className="form-group full"><label htmlFor="privacyPolicyLabel">Second page name</label><input className="form-control" id="privacyPolicyLabel" name="privacyPolicyLabel" defaultValue={settings.privacyPolicyLabel} required minLength={2} maxLength={80} /><small>For example: Privacy policy.</small></div>
          <div className="form-group full"><label htmlFor="privacyPolicyContent">Privacy policy text</label><textarea className="form-control page-content-input" id="privacyPolicyContent" name="privacyPolicyContent" defaultValue={settings.privacyPolicyContent} maxLength={50000} /></div>
        </div></section>
        <div className="form-actions"><button className="btn" type="submit">Save site content</button><span className="subtle">Changes become public immediately.</span></div>
      </form>
    </>
  );
}
