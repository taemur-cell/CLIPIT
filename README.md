# CLIPIT — AI Clip Studio v6 (context-analysis beta)

Free, phone-first video editor with an optional experimental context-analysis stage and YouTube publishing / channel insights.

## Website
https://taemur-cell.github.io/CLIPIT/

## How to make context-aware Shorts
1. Use your phone to choose footage that you own or have rights to edit.
2. For **real Urdu/English transcription and sampled visual captions**, launch the [free Google Colab notebook](https://colab.research.google.com/github/taemur-cell/CLIPIT/blob/main/Cloud_Processing_Colab.ipynb) and put the video in your own Google Drive at `AI-Clip-Studio/INPUT`.
3. Run all cells; find `context_analysis.json` in `AI-Clip-Studio/OUTPUT/<run>/` when the analysis finishes.
4. In the CLIPIT browser app, open the **same video** and import that report in **Context AI — Dialogue + Actions**.
5. Tap **Create context-aware clip suggestions**. Review/adjust every cut, add captions and save or open the YouTube publish review.
6. If you have an existing `.srt` / `.vtt` file, you can import it directly without Colab; this uses spoken text but no action captions.

## What currently works
- Video import, visual-change clip suggestions, custom timestamps, preview, 9:16 editor overlays and local rendering, subject to browser codec/phone memory limits
- v6 context-report import, ranked highlight suggestions based on **actual transcript and provided video-frame descriptions**, caption-bar creation, searchable dialogue
- OAuth-based YouTube publish button, upload-review form, channel dashboard code (live authorization and uploads still require per-account testing)

## What is NOT yet automatic
- The free Colab notebook requires manual starting, and may disconnect or hit download/compute limits
- The app does not directly upload source videos for remote AI analysis: **GitHub Pages is static hosting**, not a video AI backend
- Image captions are approximate, not verified scene understanding; the BLIP caption model may fail or hallucinate
- No server-side scheduler, 24/7 worker, unattended posting, or unlimited length guarantee
- Real YouTube account posting has not yet been confirmed end-to-end for this project

## Important files
- `index.html` — Android Chrome/PWA editor and optional YouTube publishing
- `context_engine.js` — deterministic Urdu/English transcript + visual caption highlight ranking
- `Cloud_Processing_Colab.ipynb` — free, manual audio/vision report creator
- `GUIDE.html` — phone-friendly walkthrough
- `DEPLOY_AND_CONNECT.md` — YouTube OAuth setup
- `PRIVACY.html` — video and credential handling
- `.github/workflows/validate.yml` — free syntax and scoring smoke tests

**Permissions and copyrights:** Only publish footage you may legally reuse. Cropping, captions, or overlays cannot guarantee protection from copyright claims. No client secret or Google access token belongs in this public repository.
