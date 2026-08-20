# FrameVault

Production video gallery and small content-management system built with Next.js, MongoDB Atlas, and Cloudinary. The original static visual prototype remains in `old/`; the live application is at the repository root.

## Features

- Server-rendered, responsive gallery with search and category filters
- Stable, shareable video pages with Cloudinary playback
- Anonymous, daily-deduplicated view counting without storing raw IP addresses
- Protected owner/editor admin area
- Draft, publish, unpublish, archive, restore, feature, and order video workflows
- Direct signed Cloudinary video/image uploads (media does not pass through Next.js)
- Editable banner, top description, featured video, About content, and categories
- Audit trail, MongoDB indexes, environment validation, SEO metadata, sitemap, and health endpoint

## Requirements

- Node.js 20.9 or newer
- Complete MongoDB Atlas SRV connection string and database user
- Cloudinary product environment with video support

## Local setup

1. Install packages:

   ```powershell
   npm install
   ```

2. Copy `.env.example` to `.env.local` and enter complete development credentials. Do not commit this file.

3. In MongoDB Atlas, allow access from the development machine. The hostname must be the full Atlas hostname copied from **Connect > Drivers**, not only a cluster display name.

4. Generate a strong `AUTH_SECRET`, for example:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```

5. Set temporary `ADMIN_EMAIL` and `ADMIN_PASSWORD` variables in `.env.local`, then initialize indexes, site settings, categories, and the first owner:

   ```powershell
   npm run seed
   ```

   Remove `ADMIN_PASSWORD` from the environment after seeding. Run the seed again with a new value to rotate the owner's password.

6. Start the application:

   ```powershell
   npm run dev
   ```

7. Open `http://localhost:3000` for the gallery and `http://localhost:3000/admin` for administration.

## Cloudinary configuration

The app accepts either `CLOUDINARY_URL` or the three explicit Cloudinary values shown in `.env.example`. All are server-only. Admin browsers receive only the cloud name, public API key, and a short-lived signature after server-side authorization.

In Cloudinary, configure an HTTPS notification URL pointing to:

```text
https://your-domain.example/api/cloudinary/webhook
```

Uploads are restricted to `framevault/videos` and `framevault/images`. The application uses progressive optimized MP4 delivery by default. Validate real media, quota, and playback startup before enabling eager HLS renditions.

## Commands

```powershell
npm run dev
npm run typecheck
npm test
npm run build
npm run seed
```

## Deployment checklist

- Use separate staging and production databases and Cloudinary folders/product environments.
- Add all secrets through the hosting provider's encrypted environment store.
- Set `APP_URL` to the exact HTTPS origin; upload signature requests enforce it.
- Configure Atlas network access for the deployment platform and use a least-privilege database user.
- Run `npm run seed` once against production, then remove the seed password.
- Configure the Cloudinary webhook and test a real upload, replacement, publish, unpublish, and playback.
- Enable Atlas backups and application error monitoring.
- Run `npm run typecheck`, `npm test`, and `npm run build` before promotion.
- Rotate any credential that has been pasted into chat, email, source code, or logs.

See [plan.md](./plan.md) for the full architecture, phased delivery, testing, security, and extension roadmap.
