# Zerre

A tiny creature that lives on your Mac's desktop and grows from your real life.

**Website:** https://zerre.dogukaan.dev · **Downloads:** [Releases](https://github.com/darkbringer1/zerre/releases)

This repository hosts Zerre's public website (GitHub Pages) and its signed, notarized releases. The app's source is private.

- `index.html`, `privacy.html`, `support.html`, `404.html`: the site
- `assets/playground.css` supplies the shared visual language; `assets/inner-pages.css` styles Support, Privacy, Releases, and the 404 page. `assets/playground.js` powers the landing page's interactive desktop scene. The scene is an illustration built with Zerre's real pixel art; it is not an app screenshot.
- `assets/zerre-social.svg` is the editable 1200 × 630 social link card; `assets/zerre-social.png` is the raster preview used by the homepage's social metadata.
- `releases.html`, `releases.json`, `appcast.xml`: written by the release workflow on every release (don't edit by hand)

The app release workflow replaces the `RELEASE_LATEST` block in `index.html` and updates links marked `data-release-download`. Keep those markers when editing the homepage.

## Website traffic in Cloudflare

The site uses no analytics service or external tracking script. Cloudflare can count its normal page requests only when the `zerre.dogukaan.dev` DNS record is **Proxied** (orange cloud). In the Cloudflare dashboard, open **dogukaan.dev → Analytics & Logs → HTTP Traffic**, filter **Host** to `zerre.dogukaan.dev`, then use **Path** to look at `/`, `/privacy`, `/support`, and `/releases`. The GitHub Pages origin may serve pretty URLs with or without `.html`; check both forms if a page looks empty.

`assets/analytics.js` sends a small first-party request when a homepage heading is at least half visible or someone clicks a key link or demo button. The files in `assets/analytics/` exist only so those requests return 200. Filter HTTP Traffic by **Path** and use **Requests** to count an event:

| What to inspect | Path |
| --- | --- |
| Download button clicks | `/assets/analytics/click-download.txt` |
| Feedback link clicks | `/assets/analytics/click-feedback.txt` |
| People reaching the download section | `/assets/analytics/section-download.txt` |
| Other homepage sections and clicks | `/assets/analytics/section-*.txt` and `/assets/analytics/click-*.txt` |

The exact path filters work on the Free plan. Section counts are approximate exposure, not eye tracking. Click counts are browser requests, not completed downloads. For ordinary page traffic, exclude `/assets/analytics/` and other static assets from the request count. No cookies or persistent visitor IDs are created by the site script. The [privacy page](privacy.html) describes the website counts separately from the app's local data.
