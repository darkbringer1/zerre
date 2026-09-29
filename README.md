<p align="center">
  <a href="https://zerre.dogukaan.dev"><img src="assets/zerre-social.png" alt="Zerre: a little life for your coding day. A tiny creature for your Mac." width="720"></a>
</p>

<p align="center">
  <a href="https://github.com/darkbringer1/zerre/releases/latest"><img src="https://img.shields.io/github/v/release/darkbringer1/zerre?label=latest&color=3d6b4f" alt="Latest release"></a>
  <img src="https://img.shields.io/badge/macOS-26%2B-3d6b4f" alt="macOS 26 or later">
  <img src="https://img.shields.io/badge/signed%20%26%20notarized-Developer%20ID-3d6b4f" alt="Signed and notarized">
  <img src="https://img.shields.io/badge/price-free-e8967a" alt="Free">
</p>

<p align="center">
  <a href="https://zerre.dogukaan.dev"><b>Website</b></a> ·
  <a href="https://github.com/darkbringer1/zerre/releases/latest"><b>Download</b></a> ·
  <a href="https://zerre.dogukaan.dev/releases"><b>Release notes</b></a> ·
  <a href="https://zerre.dogukaan.dev/privacy"><b>Privacy</b></a> ·
  <a href="https://github.com/darkbringer1/zerre/issues/new/choose"><b>Feedback</b></a>
</p>

---

**Zerre** is a tiny pixel creature that lives on your Mac's desktop. It naps on the Dock, hops onto windows and watches your cursor. It notices your agent handoffs, commits and focus time, and turns the rhythm of your day into a character that feels like yours.

*Zerre* means "speck", a tiny particle, in Turkish. Small things can grow.

## Install

**Homebrew**

```sh
brew install --cask darkbringer1/tap/zerre
```

**One line in Terminal**

```sh
curl -fsSL https://zerre.dogukaan.dev/install.sh | sh
```

The [script](install.sh) downloads the latest release, checks its checksum, Developer ID signature and notarization, installs Zerre to `/Applications` and opens it. It never asks for your password.

**Or download it:** grab the DMG from [the latest release](https://github.com/darkbringer1/zerre/releases/latest) and drag Zerre to Applications.

All three give you the app and the `zerrectl` command. Zerre updates itself after that.

## What it does

- **Lives on your desktop.** Wanders, naps, follows your cursor and reacts when you poke it. It has moods and little habits of its own.
- **Keeps you company while you work.** Claude Code, Codex, Gemini CLI and OpenCode tell Zerre when a turn ends or needs you, and it holds up a little note. Click it to jump back to that terminal when it can.
- **Grows from your days.** Focus blocks, commits and your own patterns slowly give it traits: a sprout for the days you show up, and more over time.
- **Stays calm.** At most three nudges a day. Quiet during focus, at night and in meetings. Ignore it and it gets sleepy, never punishing.

Connect only the tools you want from the welcome screen or Settings › Hooks. Zerre works with nothing connected, too.

## In your terminal

`zerrectl` is Zerre's command-line companion:

```sh
zerrectl                    # a live dashboard: mood, focus, what's waiting for you
zerrectl focus 25           # start a 25-minute focus block
zerrectl start              # just start: 5 minutes on the thing you're avoiding
zerrectl note "stretch in 20 min"   # pin a reminder to Zerre's notice board
zerrectl pending            # agents and long commands waiting for you
zerrectl help               # everything else
```

## Private by design

Zerre notices *that* things happen, never *what* they were.

- Agent hooks send handoffs, not your prompts or code.
- Calendar access, if you grant it, tells Zerre when you're busy, not what the meeting is.
- Everything it remembers stays on your Mac. No account, no usage telemetry.
- Settings › Your data exports everything it has noticed, or erases it.

The full details are on the [privacy page](https://zerre.dogukaan.dev/privacy).

## Requirements

- macOS 26 Tahoe or later
- About 20 MB of disk space

## Updating and uninstalling

Zerre checks for updates once a day and installs them through Sparkle. You can also use **Check for Updates…** on its menu bar card.

To remove it completely, open **Settings › Your data › Remove Zerre from this Mac** first. That takes out the hooks it added to your agents, git and zsh, and deletes its data. Then:

```sh
brew uninstall --cask zerre     # if you installed with Homebrew
```

or drag Zerre from Applications to the Trash.

## Feedback

Zerre is young and your feedback shapes what comes next. Tell me what felt delightful, distracting or confusing:

- [Share feedback or report a bug](https://github.com/darkbringer1/zerre/issues/new/choose)
- Prefer to write privately? [zerre@dogukaan.dev](mailto:zerre@dogukaan.dev)

Please don't send your event log or notes. They're not needed.

## About this repository

This repository hosts Zerre's [website](https://zerre.dogukaan.dev) and its releases. The app's source is private. Maintainer notes are in [MAINTAINING.md](MAINTAINING.md).

<p align="center"><sub>Made with care for curious Mac people.</sub></p>
