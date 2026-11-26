# CLIPIT — AI Clip Studio v5

Phone-first video editing and YouTube publishing interface. The editor supports local video selection, clip suggestions, manual cuts, overlays and saving, with Google OAuth-based YouTube integration awaiting account configuration.

## Open the app

After enabling **Settings → Pages → Deploy from a branch → main → /(root)**, the expected address is:

https://taemur-cell.github.io/CLIPIT/

The link is **not confirmed live until GitHub Pages deployment completes**.

## Files

- `index.html` — browser app
- `GUIDE.html` — beginner guide
- `PRIVACY.html` — app privacy / permissions
- `DEPLOY_AND_CONNECT.md` — owner instructions for Google Cloud, OAuth and live testing
- `Cloud_Processing_Colab.ipynb` — optional manual notebook; not part of the automatic browser editor
- `manifest.webmanifest`, `sw.js`, `icon.svg` — installable web app shell

## One-time YouTube setup

1. Enable YouTube Data API v3 and YouTube Analytics API in a Google Cloud project.
2. Set up a **Web application OAuth client** and authorize the JavaScript origin `https://taemur-cell.github.io`.
3. Enter the OAuth **public client ID**, not a client secret, in the YouTube setup area of the deployed app.
4. Connect your own channel and test an original short upload as **Private** before publishing publicly.

**Status:** Editor code has passed simulated browser/API tests. This deployment is not yet verified with a real YouTube account, and does not include a 24/7 background server. Google/YouTube account access needs user authorization.

**Media rights:** Only upload videos you have permission to publish. Cropping and overlays do not provide copyright clearance.
