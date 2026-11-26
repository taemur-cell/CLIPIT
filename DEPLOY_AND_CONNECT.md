# Deploy AI Clip Studio v5 + Connect YouTube (one-time owner setup)

**Status:** The integration code is built, locally inspected and tested with simulated Google/YouTube responses. Google OAuth and a real YouTube video upload **have not yet been verified against a live account**. A live YouTube connection requires these account-specific steps.

## 1. Host the app on HTTPS — GitHub Pages, free

1. Create a **public** GitHub repository, for example `ai-clip-studio`.
2. Upload `index.html`, `GUIDE.html`, `manifest.webmanifest`, `sw.js`, `icon-192.png`, `icon-512.png`, and `PRIVACY.html` to the repository **root**. Do not upload credentials or private channel data.
3. In GitHub **Settings → Pages → Build and deployment**, select **Deploy from a branch**, `main`, `/(root)`, and save.
4. Wait for GitHub to display the published URL; open it in Chrome. Do not assume the page is live before GitHub confirms deployment. The expected format for a project site is `https://YOUR-USERNAME.github.io/ai-clip-studio/`.
5. Chrome → menu → **Add to Home screen** or **Install app** on your Pixel and OPPO, when offered. Chrome may require the HTTPS page to be fully loaded.

## 2. Enable official YouTube APIs

1. Open https://console.cloud.google.com/ and select or create a project.
2. Open **APIs & Services → Library** and enable **YouTube Data API v3** and **YouTube Analytics API**.
3. Open **Google Auth Platform / OAuth consent screen**. Configure app name, support email, and (if External/Testing) add your own and your friend's Google accounts as **test users**. Sensitive-scope approval or verification requirements can apply; follow Google Cloud's instructions.
4. Under **Data Access**, add the scopes for uploading videos, reading channel data, and analytics:

   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube.readonly`
   - `https://www.googleapis.com/auth/yt-analytics.readonly`

5. Under **Clients / Credentials**, create **OAuth client ID → Web application**. Set **Authorized JavaScript origins** to the exact **origin** of your GitHub Pages site, e.g. `https://YOUR-USERNAME.github.io` (no repository path or trailing slash). You do not need a redirect URI for the Google Identity Services popup token flow in this version.
6. Copy the **client ID** (ends in `.apps.googleusercontent.com`). **Never put your client secret in this HTML or repository.**

## 3. Enter the client ID

**For a single shared link without a setup form for your friend:** in `index.html`, change the one line

```html
<script>window.CLIP_STUDIO_YOUTUBE_CLIENT_ID = '';</script>
```

so the empty string contains the public OAuth **client ID**, not a client secret. Commit the file. When both people open the hosted link, the app can offer Google account authorization without having to enter the client ID again.

**Alternative:** Each user can enter the client ID in **First-time YouTube connection setup** → **Save public client ID**. It is stored locally on their device.

## 4. Verify in Chrome on your phone

1. Open the HTTPS app. Tap **Connect YouTube channel**.
2. Google prompts to select an account and approve permissions. Choose the right channel.
3. Expect the dashboard to show your real subscribers and channel views; recent videos, comments, and daily Analytics should populate if allowed.
4. Test publishing with a short **original/authorized** video as **Private**. Use **▶ Publish** beside a clip or choose an MP4 from phone storage, review details, choose **Made for kids?**, check rights confirmation, and tap **Confirm upload**.
5. Wait for the YouTube video link and open YouTube Studio to confirm upload and processing. Do not test with unlicensed television footage.
6. Finally, let your friend connect her own channel via the same URL, using her Google account.

## 5. What is free and what isn't guaranteed

- GitHub Pages and a Google Cloud project's default YouTube API quota generally permit a small no-hosting-fee starter, subject to provider terms, limits, and account-specific requirements.
- The upload quota is limited; the current developer documentation lists a default limit of **100 `videos.insert` calls/day** in its upload bucket, with separate non-upload method quotas. Check the actual quotas in Google Cloud.
- Some OAuth scopes may require testing-user setup or Google app verification for broader distribution. Unverified applications may display warnings.
- This client-side app **does not run in the background**. It has no private server or silent token refresh. Opening a new tab or expiry requires reconnecting.
- Clips must finish rendering before uploading. Keep Chrome open during the upload. Very long videos may fail on low-memory phones.
- Real YouTube integration is not fully validated until actual OAuth and upload tests are completed with your connected account.

## 6. Troubleshooting checklist

| Symptom | Cause / next step |
|---|---|
| `origin_mismatch` / `idpiframe_initialization_failed` | Use the exact origin of the HTTPS site in authorized JavaScript origins; wait for Google config propagation |
| Blank Google popup | Allow pop-ups / use current Chrome, check login, avoid embedded in-app browsers |
| Access blocked / test user required | Add the email to OAuth test users; make sure scopes are added and app permissions are approved |
| Connected but no channel | The Google account lacks an active channel or has multiple Brand identities; choose the channel account |
| Analytics API error | Enable YouTube Analytics API and consent to `yt-analytics.readonly` scope |
| Upload 401/403 | Reconnect, check quota, API enabled status, permissions, channel rights, and Google project verification |
| Upload hangs | Keep app open; for long video prefer a smaller clip and reliable Wi-Fi. Check the channel before retrying |
| Client ID field not needed on friend's phone? | Embed the public client ID into the hosted `index.html`, then commit redeploy |

## Official technical documentation

- [Google Identity Services browser token client](https://developers.google.com/identity/oauth2/web/guides/use-token-model)
- [Google Cloud OAuth web client setup](https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid)
- [YouTube video upload](https://developers.google.com/youtube/v3/docs/videos/insert)
- [YouTube channel retrieval](https://developers.google.com/youtube/v3/docs/channels/list)
- [YouTube Analytics reports](https://developers.google.com/youtube/analytics/reference/reports/query)
- [YouTube quota & compliance](https://developers.google.com/youtube/data/guides/quota_and_compliance_audits)

**Privacy:** never paste Google passwords, refresh tokens, or the client secret into a public repository or chat. The OAuth client ID itself is designed to be public.