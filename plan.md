# FrameVault Production Build Plan

> Media provider update: the implemented application now uses Backblaze B2 with admin-authorized S3-compatible uploads. Cloudinary sections below describe the original architecture and are retained only as historical planning context.

## 1. Project outcome

Build the static demo in `old/` into a production-ready video gallery that:

- preserves the existing dark FrameVault visual direction;
- lets visitors browse, search, filter, and play cloud-hosted videos;
- gives authorized staff a simple admin interface for adding, replacing, publishing, reordering, and removing videos;
- lets staff change the hero/banner image and the introductory text without code changes;
- stores content and operational metadata in MongoDB Atlas;
- uploads and delivers videos and images through Cloudinary;
- comfortably handles the expected 5,000-10,000 monthly views;
- leaves clean extension points for moderated comments, viewer accounts, playlists, and richer analytics.

This plan treats comments as a second phase unless the client explicitly adds them to the launch scope.

## 2. Current demo assessment

The `old/` folder is a useful design prototype, not a deployable content-management application.

What should be retained:

- responsive visual style, typography, color palette, cards, filters, hero, about section, and player presentation;
- the public information architecture: Gallery, About, Search, featured video, and video details;
- the lightweight principle of serving media from a CDN instead of the application server.

What must change:

- video records, categories, counts, hero image, and text are hard-coded in `app.js` and HTML;
- the modal player has no permanent URL, which limits sharing and search-engine indexing;
- search and filtering only operate on the hard-coded browser array;
- the current player always uses one sample MP4 and has no processing/error state;
- the comments field is only a visual placeholder;
- there is no authentication, authorization, validation, audit history, database, upload workflow, error monitoring, or automated testing;
- several strings contain encoding/mojibake errors and need to be migrated as UTF-8.

## 3. Recommended technical architecture

Use one deployable application rather than a separate frontend and API. This keeps the project simple at the expected traffic while maintaining a clean separation inside the codebase.

| Layer | Recommendation | Responsibility |
| --- | --- | --- |
| Web framework | Current stable Next.js App Router + TypeScript | Public pages, admin pages, server actions/route handlers, SEO, caching |
| Styling | Existing CSS design migrated into global CSS/CSS modules | Preserve the demo closely; avoid an unnecessary redesign |
| Validation | Zod schemas shared by forms and server code | Validate every write and normalize slugs, text, and IDs |
| Database | MongoDB Atlas with the official Node.js driver | Videos, categories, site settings, admins, view deduplication, audit logs |
| Media | Cloudinary Node SDK and Cloudinary Video Player | Signed uploads, transformations, posters, CDN playback, optional HLS |
| Authentication | A maintained auth library integrated with Next.js | Secure admin sessions and role checks; no public registration at launch |
| Testing | Vitest (unit/integration) and Playwright (end-to-end) | Data rules, admin workflows, public browsing, accessibility smoke tests |
| Deployment | Managed Node/Next.js host, with staging and production environments | Preview/staging deployments, TLS, environment secrets, logs |

High-level request flow:

```text
Visitor -> Next.js public route -> cached MongoDB content
                              -> Cloudinary CDN/video player

Admin -> authenticated Next.js admin route -> MongoDB metadata/settings
                                      -> short-lived signed upload request
Browser ----------------------------------> Cloudinary direct upload
Cloudinary -> verified webhook -> processing status in MongoDB
```

The application must never proxy video bytes during normal upload or playback. That avoids server request-size limits, long-running functions, and unnecessary bandwidth cost.

## 4. Proposed application structure

```text
app/
  (public)/
    page.tsx                       # gallery/home page
    videos/[slug]/page.tsx         # shareable video detail/player page
  admin/
    login/page.tsx
    page.tsx                       # dashboard
    videos/page.tsx
    videos/new/page.tsx
    videos/[id]/edit/page.tsx
    content/page.tsx               # hero/banner and top/about text
    categories/page.tsx
  api/
    views/[videoId]/route.ts
    cloudinary/signature/route.ts
    cloudinary/webhook/route.ts
components/
  public/
  admin/
  media/
lib/
  auth/
  cloudinary/
  db/
  repositories/
  validation/
  security/
types/
tests/
old/                               # retained temporarily as visual reference
```

Server-only modules must be clearly isolated so database and Cloudinary secrets cannot enter client bundles.

## 5. MongoDB data design

### `videos`

Core fields:

- `_id`, `title`, `slug`, `shortDescription`, `fullDescription`;
- `categoryId`, optional `tags`;
- `status`: `draft`, `processing`, `published`, `failed`, or `archived`;
- `featured`, `sortOrder`, `publishedAt`, `createdAt`, `updatedAt`;
- `cloudinary.assetId`, `cloudinary.publicId`, `cloudinary.version`, `cloudinary.resourceType`;
- `media.durationSeconds`, `media.width`, `media.height`, `media.format`, `media.bytes`;
- optional custom poster asset, otherwise a poster derived from the video;
- `viewCount` as the fast display counter;
- `createdBy`, `updatedBy` for traceability.

Indexes:

- unique index on `slug`;
- indexes on `{ status, publishedAt }`, `{ categoryId, status }`, and `{ featured, status }`;
- optional text index for a small catalog, with an upgrade path to Atlas Search if the library grows substantially.

Store Cloudinary identifiers as the source of truth and generate delivery URLs with controlled transformations. Do not depend only on a copied URL, because identifiers make replacements, transformations, and cleanup safer.

### `categories`

- `_id`, `name`, unique `slug`, `sortOrder`, `isActive`, timestamps.

Do not allow removal while published videos still reference the category; offer reassignment or deactivation instead.

### `siteSettings`

A singleton document containing:

- site name and SEO defaults;
- hero eyebrow, title, description, and button label/link;
- banner Cloudinary image identifiers and accessible alt text;
- About heading and body;
- optional featured video ID;
- social/footer links;
- timestamps and `updatedBy`.

This directly satisfies the client's need to change the banner and top description without deployment.

### `users` and `sessions`

- admin identity, normalized unique email, role (`owner`, `editor`), active state, and timestamps;
- authentication-provider fields or a strong password hash if credentials login is selected;
- session storage as required by the selected auth adapter.

Only `owner` can manage other admins or irreversible settings. Both `owner` and `editor` can manage content.

### `videoViewBuckets` or `videoViews`

Use an anonymous random viewer cookie plus a server-side HMAC and time bucket to deduplicate obvious refreshes. Add a unique compound index such as `{ videoId, viewerHash, dayBucket }`. On the first qualifying play, insert the deduplication record and atomically increment `videos.viewCount`.

- count only after playback actually starts (or after a short watch threshold agreed with the client);
- never store raw IP addresses;
- rate-limit the endpoint;
- expire deduplication records after a defined analytics window with a TTL index.

This is sufficient at 5,000-10,000 monthly views. A specialist analytics product can be added later without changing the public API.

### `auditLogs`

- actor, action, entity type/ID, safe before/after summary, timestamp, and request metadata;
- record publishing, unpublishing, replacement, deletion, and site-settings changes;
- never write credentials or complete signed URLs to logs.

### Future `comments`

Prepare, but do not expose at launch:

- video ID, author identity/display name, sanitized body, status (`pending`, `approved`, `rejected`, `spam`), timestamps, and moderator ID;
- indexes for `{ videoId, status, createdAt }` and moderation queues;
- rate limits, abuse reporting, spam protection, and moderation before public display.

## 6. Cloudinary media workflow

### Secure upload flow

1. An authenticated editor starts a new draft and enters title/category/description.
2. The browser requests a short-lived signature from `/api/cloudinary/signature`.
3. The server verifies the admin session and signs only allowed parameters: video resource type, controlled asset folder, size/type restrictions, and upload preset/transformation policy.
4. The browser uploads directly to Cloudinary using the signed Upload Widget or signed upload API. For large videos, enable chunked/resumable behavior.
5. The upload result supplies `asset_id`, `public_id`, version, dimensions, duration, format, and byte size. Save these against the draft.
6. Cloudinary sends a webhook when asynchronous processing/derived assets are ready. Verify the webhook signature before updating the record.
7. Only a ready asset can be published. Failed processing must show a retry/replace action in admin.

Use signed uploads for the production admin. The API secret stays server-only. Restrict accepted formats, maximum file size, maximum duration if required, and asset folders. Do not create an open unsigned video upload preset.

### Delivery strategy

- generate optimized card posters from video frames or use an admin-uploaded poster;
- lazy-load the full video player only after user interaction;
- use automatic quality/format transformations for progressive playback;
- use HLS adaptive bitrate streaming for longer/high-resolution videos when the Cloudinary plan and transformation budget support it;
- retain progressive MP4 fallback for browser compatibility and short clips;
- include `playsinline`, captions support, keyboard controls, a meaningful poster, and accessible labels;
- do not autoplay audio.

Cloudinary recommends its player when adaptive streaming, analytics, captions, or richer player features are needed. The exact progressive-vs-HLS rule should be verified against real video lengths and the client's Cloudinary quota before launch.

### Replace and delete safety

- replacement: upload and validate the new asset, atomically switch the MongoDB reference, then queue cleanup of the old asset;
- deletion: unpublish/soft-delete the database record first, retain a recovery window, and delete the Cloudinary asset only after confirmation;
- failed database update after an upload: record or periodically discover orphan assets and provide a cleanup job;
- failed Cloudinary deletion: keep a retryable cleanup record rather than hiding the failure.

## 7. Public website features

### Home/gallery

- preserve the existing header, hero, featured content, filters, gallery cards, About section, and footer;
- load published videos and settings from MongoDB on the server;
- support pagination or cursor-based “Load more,” even if launch content fits on one page;
- place filter/search state in the URL (`?category=...&q=...`) so results are shareable and survive refresh;
- show useful empty, loading, and error states;
- render optimized Cloudinary poster images with known dimensions to avoid layout shifts.

### Video page/player

- give every published video a canonical `/videos/[slug]` page with title, description, category, player, view count, and related videos;
- retain the demo's modal-like experience as progressive enhancement if desired, but update the URL and ensure direct links work;
- count a view from a real playback event, not from opening the card;
- provide Open Graph/Twitter metadata and a video poster for sharing;
- return a real 404 for drafts, archived items, and unknown slugs;
- provide captions/transcripts when supplied by the client.

### Search, caching, and SEO

- server-side query of published records only;
- debounce browser input and cap query length;
- revalidate cached public pages/tags immediately after an admin publishes or edits content;
- generate sitemap, robots metadata, canonical URLs, descriptive page metadata, and structured video data where complete metadata is available;
- noindex the entire admin area.

## 8. Admin experience

The client should be able to complete common work without technical knowledge.

### Dashboard

- counts for published, drafts, processing, and failed uploads;
- recent content changes;
- clear “Add video” and “Edit homepage” actions;
- Cloudinary quota warning area if usage information is later integrated.

### Video management

- searchable/filterable table with thumbnail, title, category, status, featured flag, views, and last update;
- create/edit form with inline validation and preview;
- upload progress, processing status, retry, and friendly failure messages;
- draft/publish/unpublish controls;
- featured selection and explicit sort order or drag-and-drop ordering;
- safe replace, archive, restore, and delete workflows;
- warn before navigating away from unsaved changes.

### Homepage/content management

- upload/replace banner image;
- edit banner alt text, eyebrow, heading, introductory description, and call-to-action;
- edit About section and basic SEO text;
- select a featured video;
- preview changes before publishing;
- validate text length so the layout cannot be accidentally broken.

### Category management

- add, rename, reorder, deactivate;
- preserve old slugs or create redirects if public category URLs are introduced;
- prevent destructive deletion when referenced.

## 9. Security and privacy requirements

- keep all secrets in local/deployment environment stores; commit only `.env.example` with placeholders;
- use separate development, staging, and production database names and Cloudinary folders/product environments;
- never expose `MONGODB_URI`, the Cloudinary API secret, password hashes, or webhook signing data to browser code;
- protect every admin page, action, signature endpoint, and mutation on the server; hiding UI controls is not authorization;
- use secure, HTTP-only, same-site cookies and rotate sessions after login or privilege changes;
- rate-limit login, view counting, search, upload signing, and future comment endpoints;
- validate object IDs, slugs, upload metadata, MIME/type, size, and text on the server;
- apply security headers including a tested Content Security Policy that permits only required Cloudinary media/scripts;
- escape user content by default; sanitize any future rich text/comments;
- verify Cloudinary webhook signatures and make webhook processing idempotent;
- do not log secrets, signed payloads, raw IP addresses, or authentication tokens;
- use least-privilege MongoDB credentials and restrict Atlas network access to the deployment environment wherever the host supports stable egress/private networking;
- define data retention, privacy text, cookie behavior, and a process for removing content on request.

## 10. Environment and credential readiness

The values supplied with the requirement must not be committed. They are also not complete connection values in their present form:

- an Atlas SRV URI normally needs a database username, URL-encoded password, complete Atlas cluster hostname, database name, and connection options;
- a Cloudinary server URL normally contains API key, API secret, and cloud name; the supplied value has no API secret component.

Before implementation can connect, obtain complete development credentials from the Atlas and Cloudinary consoles. If any value shared in chat or another non-secret channel was a real credential, rotate it before deployment.

Recommended server environment contract:

```dotenv
MONGODB_URI=<complete Atlas SRV URI>
MONGODB_DB_NAME=<application database>
CLOUDINARY_CLOUD_NAME=<cloud name>
CLOUDINARY_API_KEY=<API key>
CLOUDINARY_API_SECRET=<API secret>
CLOUDINARY_WEBHOOK_SECRET=<if configured separately>
AUTH_SECRET=<random high-entropy value>
APP_URL=<canonical deployment URL>
```

Additional authentication-provider and monitoring variables depend on final provider choices. Only explicitly public, non-secret values may use a browser-exposed environment prefix.

## 11. Performance and capacity plan

At the expected traffic, application/database load is small; video delivery volume is the main capacity and cost variable. Estimate it before choosing a Cloudinary plan:

```text
monthly delivery GB ~= plays x average watched seconds x average bitrate (Mbps) / 8 / 1024
```

For illustration, 10,000 complete five-minute plays at an average 2 Mbps is roughly 73 GB of video transfer before cache/rounding differences. Real cost depends on watch completion, renditions, transformations, storage, and Cloudinary's current plan rules.

Performance targets:

- do not load video bytes on gallery cards;
- lazy-load below-the-fold poster images and the player library;
- paginate database results and project only fields needed by cards;
- reuse one cached MongoDB client per application process;
- cache public queries/pages and invalidate them on publishing;
- run a production Lighthouse/Core Web Vitals pass on representative mobile hardware/network;
- load-test public page reads and the view endpoint above expected peak, not video bandwidth already handled by Cloudinary.

## 12. Reliability, monitoring, and recovery

- structured application logs with request correlation IDs and redaction;
- error monitoring for server, client, and failed admin operations;
- health/readiness endpoint that does not expose secrets;
- alerts for elevated application errors, webhook failures, failed media processing, and database connection failures;
- MongoDB Atlas backups appropriate to the chosen tier, with at least one restore rehearsal before handoff;
- Cloudinary backup/versioning policy confirmed for original assets;
- documented manual recovery for an accidental unpublish, deleted metadata, failed replacement, and unavailable third-party service;
- dependency/security update process and monthly quota review during the first operating period.

## 13. Testing strategy

### Unit tests

- validation and normalization;
- slug generation/collision handling;
- authorization rules;
- Cloudinary delivery URL/profile selection;
- view deduplication and state transitions;
- webhook signature/idempotency helpers.

### Integration tests

- repositories against a dedicated test database;
- unique indexes and publish rules;
- authenticated create/update/archive flows;
- signature endpoint rejects unauthenticated or disallowed parameters;
- webhook processing updates only the intended asset;
- cache invalidation after content changes.

### End-to-end tests

- visitor browses, filters, searches, opens a direct video URL, and plays a video;
- owner/editor login and authorization boundaries;
- create draft, simulate upload completion, publish, edit, unpublish, restore;
- update banner and top text and confirm public rendering;
- responsive navigation and player on mobile viewports;
- keyboard navigation, focus trapping, labels, contrast, and reduced-motion behavior;
- 404 and user-friendly third-party failure states.

Use a separate Cloudinary test folder and MongoDB test database. Automated tests must never delete production media.

## 14. Implementation phases

### Phase 0 - requirements and service preflight (0.5-1 day)

- confirm branding/site name, domain, launch content count, typical video length/resolution, supported source formats, maximum upload size, and who can administer;
- decide whether view count means “play started” or a minimum watch threshold;
- confirm whether comments are post-launch;
- verify complete credentials, Atlas access, Cloudinary quotas/features, and hosting constraints;
- inventory real videos, posters, titles, categories, descriptions, captions, and banner assets.

Exit criteria: scope is signed off, credentials work in development, and media limits/cost assumptions are documented.

### Phase 1 - application foundation (1-1.5 days)

- scaffold Next.js/TypeScript, linting, formatting, test runners, and environment validation;
- create layout, error/not-found boundaries, security headers, and base design tokens;
- create reusable MongoDB connection and repository layer;
- establish staging and CI checks.

Exit criteria: clean build/test pipeline and deployable empty application.

### Phase 2 - data and authentication (1.5-2 days)

- implement collections, indexes, validation, migrations/seed mechanism, and audit logging;
- implement admin authentication, roles, middleware/server authorization, logout, and initial owner provisioning;
- build basic admin shell and dashboard.

Exit criteria: unauthorized access is rejected server-side and an owner can securely enter the empty admin.

### Phase 3 - Cloudinary media pipeline (2-3 days)

- configure signed video/image upload flows and restrictions;
- implement direct upload UI, progress, cancellation/retry, metadata persistence, and processing states;
- implement and verify idempotent webhooks;
- generate/test posters and progressive/HLS delivery policy;
- implement replace/archive/cleanup safety.

Exit criteria: an admin can upload a real representative video, wait for processing, preview it, and recover cleanly from a simulated failure.

### Phase 4 - public experience migration (2-3 days)

- convert the static hero, gallery, cards, filters, search, About section, and footer into database-backed components;
- implement shareable video routes and accessible Cloudinary playback;
- add view counting, related content, metadata, sitemap, and cache invalidation;
- correct text encoding and complete responsive/accessibility passes.

Exit criteria: the production app visually matches the approved demo while all content comes from MongoDB/Cloudinary.

### Phase 5 - complete admin CMS (2-3 days)

- video list, create/edit/publish/reorder/archive/restore workflows;
- hero/banner/top text/About settings editor and preview;
- category management and validation;
- unsaved-change protection, clear notifications, and audit history display.

Exit criteria: a non-technical client can complete all requested content changes without code or database access.

### Phase 6 - hardening and launch preparation (2-3 days)

- unit, integration, end-to-end, accessibility, performance, and load smoke tests;
- security review of every mutation and upload/webhook boundary;
- monitoring, backups, restore rehearsal, seed/import of launch content;
- cross-browser/mobile acceptance testing and client UAT fixes.

Exit criteria: all acceptance criteria pass in staging using production-like media.

### Phase 7 - production launch and handoff (1 day)

- provision production secrets, domain/TLS, database indexes, network access, Cloudinary folders/presets, alerts, and backups;
- deploy, smoke test, verify SEO/noindex rules, and monitor first uploads/plays;
- provide a short admin guide and recorded walkthrough;
- document deployment, rollback, credential rotation, recovery, and routine maintenance.

Expected MVP engineering effort: approximately 10-16 working days, depending mainly on authentication choice, upload sizes/processing, visual fidelity revisions, and content readiness. Allow calendar time for client review and Cloudinary processing/quota decisions. Comments are a separate estimated 3-5 day feature after moderation and identity requirements are agreed.

## 15. Launch acceptance criteria

The MVP is complete when:

- only published videos appear publicly, each at a stable shareable URL;
- gallery search, category filters, pagination, playback, and mobile layouts work on supported browsers;
- videos and posters are served from Cloudinary, not the Next.js server;
- an authorized editor can create, upload, preview, publish, edit, feature, reorder, unpublish, replace, archive, and restore a video;
- an authorized editor can replace the banner and change the hero/top and About text without deployment;
- unauthorized users cannot access admin data, generate signatures, or mutate content;
- upload failure, processing delay, duplicate webhook, and Cloudinary/database outage paths are handled without corrupt records;
- view increments are rate-limited and deduplicated without storing raw IP addresses;
- public pages have correct titles, descriptions, canonical URLs, social images, sitemap, and 404 behavior;
- keyboard/accessibility smoke checks and performance budgets pass on staging;
- backups, logs, alerts, rollback, and an admin operating guide are in place;
- no real secrets exist in the repository or browser bundle.

## 16. Post-launch extension roadmap

1. Moderated comments with viewer identity choice, spam protection, reports, and notification policy.
2. Viewer accounts, favorites, and playlists.
3. Captions/transcripts and transcript search.
4. Richer analytics (watch time, completion, popular searches) with explicit privacy/consent design.
5. Scheduled publishing and content revisions/approvals.
6. Multiple admin roles, invitations, and MFA/SSO if the team expands.
7. Atlas Search if catalog size and search requirements outgrow basic indexed queries.

## 17. Documentation references

- [Next.js authentication guide](https://nextjs.org/docs/app/guides/authentication)
- [Next.js production checklist](https://nextjs.org/docs/app/guides/production-checklist)
- [Cloudinary Node.js image and video uploads](https://cloudinary.com/documentation/node_image_and_video_upload)
- [Cloudinary signed Upload Widget](https://cloudinary.com/documentation/upload_widget)
- [Cloudinary video player](https://cloudinary.com/documentation/cloudinary_video_player)
- [Cloudinary adaptive bitrate streaming](https://cloudinary.com/documentation/adaptive_bitrate_streaming)
- [Cloudinary webhook notifications](https://cloudinary.com/documentation/notifications)
- [MongoDB Atlas connection requirements](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/)
- [MongoDB connection string format](https://www.mongodb.com/docs/manual/reference/connection-string/)
