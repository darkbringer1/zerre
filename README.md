# Zerre

A tiny creature that lives on your Mac's desktop and grows from your real life.

**Website:** https://zerre.dogukaan.dev · **Downloads:** [Releases](https://github.com/darkbringer1/zerre/releases)

This repository hosts Zerre's public website (GitHub Pages) and its signed, notarized releases. The app's source is private.

- `index.html`, `privacy.html`, `support.html`, `404.html`: the site
- `assets/playground.css` supplies the shared visual language; `assets/inner-pages.css` styles Support, Privacy, Releases, and the 404 page. `assets/playground.js` powers the landing page's interactive desktop scene. The scene is an illustration built with Zerre's real pixel art; it is not an app screenshot.
- `releases.html`, `releases.json`, `appcast.xml`: written by the release workflow on every release (don't edit by hand)

The app release workflow replaces the `RELEASE_LATEST` block in `index.html` and updates links marked `data-release-download`. Keep those markers when editing the homepage.
