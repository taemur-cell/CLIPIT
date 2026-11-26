# AI Clip Studio v5.0 — Video Editor + YouTube

The existing v4.3 phone editor is preserved. Added YouTube connection (OAuth token model), Publish buttons, upload-review dialog, direct file upload, a dashboard for channel subscribers/views, recent video likes/comments, recent comments and YouTube Analytics trends.

## First step

Read **DEPLOY_AND_CONNECT.md**. YouTube integration requires a registered HTTPS origin and a public OAuth Web client ID. Opening `AI_Clip_Studio_v5_OPEN_ME.html` as a local file will still allow video editing, but YouTube sign-in cannot work there. You can share the hosted URL with your friend once Google OAuth is configured.

## Files

- `index.html` — official app entry point on GitHub Pages.
- `AI_Clip_Studio_v5_OPEN_ME.html` — same app, standalone preview. YouTube OAuth only on an allowed HTTPS origin.
- `GUIDE.html` — phone-friendly end-user guide.
- `DEPLOY_AND_CONNECT.md` — detailed owner setup and troubleshooting.
- `PRIVACY.html` — base privacy language to adapt for your public app.
- `manifest.webmanifest`, `sw.js`, `icon-*.png` — PWA installability; offline caching restricted to same-origin app shell files.
- `AI_Clip_Studio_Colab.ipynb` — **optional separate** Urdu/English speech AI experiment from earlier builds; it is not directly connected to the v5 editor.

## Status and security

- JavaScript syntax checked; UI and OAuth/API endpoints simulated successfully in a local browser test; a video upload request's multipart structure and a render-first publish path were tested using mock YouTube endpoints. No real YouTube access or publish was performed.
- The Google OAuth client ID is public app configuration. No client secret is required in browser code. Never insert a client secret into HTML.
- Google OAuth tokens stay in memory only. Dashboard only reads the connected user's YouTube API data; it does not invent metrics.
- Real YouTube publishing will only become operable after app deployment, OAuth authorization and testing on a channel.
- This is not a 24/7 automatic uploader; each upload requires a real person to confirm details, visibility, audience and rights.