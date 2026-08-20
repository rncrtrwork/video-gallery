# FrameVault — Video Gallery Demo

Runnable implementation for the requested video-gallery project.

## Implemented
- Responsive video gallery
- Search and category filtering
- Video cards with poster, duration, description and view count
- HTML5 video player modal
- Cloud-hosted video URL architecture
- Mobile-friendly layout
- About section
- Basic SEO metadata
- Comments extension UI placeholder
- Clear separation between video metadata and media URLs

## Cloud storage
Each video's `src` is a URL. In production, videos can live in S3, Cloudflare R2, Backblaze B2, or a dedicated video/CDN service, while the application stores the video metadata and URL in a database.

## Scale
The frontend is lightweight and does not proxy video through the web server. For 5,000–10,000 monthly views, production delivery should use object storage + CDN or a video platform appropriate to the client's codec/streaming needs.

## Future extensions
- User accounts/authentication
- Database-backed comments and moderation
- Playlists/favorites
- Admin upload dashboard
- View/event analytics
- Search indexing
- Signed/private URLs
- HLS/DASH adaptive streaming

Open `index.html` to run the demo. Internet access is required for sample poster images and the demo MP4.
