# Maintaining this repository

Notes for keeping Zerre's website and releases running. Visitors want the [README](README.md).

This repository hosts Zerre's public website (GitHub Pages, https://zerre.dogukaan.dev) and its signed, notarized releases. The app's source is private; its release workflow publishes here.

- `index.html`, `privacy.html`, `support.html`, `404.html`: the site
- `assets/playground.css` supplies the shared visual language; `assets/inner-pages.css` styles Support, Privacy, Releases, and the 404 page. `assets/playground.js` powers the landing page's interactive desktop scene. The scene is an illustration built with Zerre's real pixel art; it is not an app screenshot.
- `assets/zerre-social.svg` is the editable 1200 × 630 social link card; `assets/zerre-social.png` is the raster preview used by the homepage's social metadata.
- `releases.html`, `releases.json`, `appcast.xml`: written by the release workflow on every release (don't edit by hand)
- `assets/sprites/`: Zerre's pixel art, composed from the app's sprites by `make site-art SITE=<this checkout>` in the app repo (don't edit by hand; redraw in the app and re-run). Show them at whole-number scales with `image-rendering: pixelated`. `zerre-hero.png` is the older flattened hero, kept for links that point at it.
- `install.sh`: the one-line installer (`curl -fsSL https://zerre.dogukaan.dev/install.sh | sh`). It reads the latest release from `releases.json`, checks the DMG's SHA-256, the Developer ID team and Gatekeeper, then installs. Keep `releases.json`'s shape (`releases[0].version`, `.downloadURL`, `.sha256`) or update the script with it.
- The Homebrew cask lives in [darkbringer1/homebrew-tap](https://github.com/darkbringer1/homebrew-tap); the release workflow bumps its version and checksum.

CSS and JS are cached for up to four hours, so every page links them with a version (`/assets/playground.css?v=sprites1`). When you change a stylesheet or script, bump that version in every page and in the `releases.html` template in the app repo's `ci_scripts/update_release_site.py`, or returning visitors get new HTML with old styles.

The app release workflow replaces the `RELEASE_LATEST` block in `index.html` and updates links marked `data-release-download`. Keep those markers when editing the homepage.

## Website traffic in Cloudflare

The site uses no separate analytics provider or external tracking script. Cloudflare can count its normal page requests only when the `zerre.dogukaan.dev` DNS record is **Proxied** (orange cloud). In the Cloudflare dashboard, open **dogukaan.dev → Analytics & Logs → HTTP Traffic** for overall requests and unique visitors. On the Free plan, detailed Host and Path filters are not listed for that dashboard; use the report below for page and event paths. The GitHub Pages origin may serve pretty URLs with or without `.html`; the report includes both forms.

`assets/analytics.js` sends a small first-party request when a homepage heading is at least half visible, someone clicks a key link or demo button, or a tagged LinkedIn announcement link opens the homepage. The files in `assets/analytics/` exist only so those requests return 200. The report groups request counts by path:

| What to inspect | Path |
| --- | --- |
| Download button clicks | `/assets/analytics/click-download.txt` |
| Feedback link clicks | `/assets/analytics/click-feedback.txt` |
| Install command copies (Homebrew, one-line script) | `/assets/analytics/click-copy-brew.txt`, `/assets/analytics/click-copy-script.txt` |
| People reaching the download section | `/assets/analytics/section-download.txt` |
| English LinkedIn announcement arrivals | `/assets/analytics/source-linkedin-en.txt` |
| Turkish LinkedIn announcement arrivals | `/assets/analytics/source-linkedin-tr.txt` |
| Other homepage sections and clicks | `/assets/analytics/section-*.txt` and `/assets/analytics/click-*.txt` |

To see page, section, click, and campaign counts on Cloudflare Free, create a Cloudflare API token with **Account → Account Analytics → Read**, scoped to the `dogukaan.dev` zone. Find the Zone ID on that zone's **Overview** page. From this repository, run:

```sh
export CLOUDFLARE_ZONE_ID='<zone ID>'
read -rs CLOUDFLARE_API_TOKEN
export CLOUDFLARE_API_TOKEN
python3 scripts/cloudflare_traffic.py
```

The `read` command accepts the token without displaying it or adding it to shell history; press Return after pasting. The script uses only Python's standard library and reads the token from the environment. It reports the last 24 hours by default; use `--hours 6` for a shorter window. The [Cloudflare GraphQL Analytics API](https://developers.cloudflare.com/analytics/graphql-api/features/discovery/settings/) exposes the request dataset on all plans, though limits depend on the zone. On Pro and higher, you can also filter HTTP Traffic by Host and Path in the dashboard.

Section counts are approximate exposure, not eye tracking. Click counts are browser requests, not completed downloads. Campaign arrivals count openings of the tagged links, not unique visitors; they do not attribute later clicks to a specific post. Cloudflare may sample requests and may include crawlers. No cookies or persistent visitor IDs are created by the site script. The [privacy page](privacy.html) describes the website counts separately from the app's local data.
