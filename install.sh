#!/bin/sh
# Installs (or updates) Zerre, a tiny creature that lives on your Mac's desktop.
#
#   curl -fsSL https://zerre.dogukaan.dev/install.sh | sh
#
# What it does:
#   1. Reads the latest release from https://zerre.dogukaan.dev/releases.json
#   2. Downloads the DMG from GitHub Releases and checks its SHA-256
#   3. Checks the app is signed by Zerre's Developer ID (team 7LSPRM5R8H) and notarized
#   4. Copies Zerre.app to /Applications (or ~/Applications if /Applications isn't writable)
#   5. Links the zerrectl command into ~/.local/bin and opens Zerre
#
# No sudo, nothing else on your Mac is touched. Options, as environment variables:
#   ZERRE_INSTALL_DIR=/path   install Zerre.app somewhere else
#   ZERRE_BIN_DIR=/path       link zerrectl somewhere else (default ~/.local/bin)
#   ZERRE_NO_LAUNCH=1         don't open Zerre afterwards

# Everything lives in main, so a partially downloaded script never runs.
main() {
  set -eu

  SITE="https://zerre.dogukaan.dev"
  TEAM_ID="7LSPRM5R8H"
  BUNDLE_ID="com.dogukaan.zerre"

  if [ -t 1 ]; then
    bold=$(printf '\033[1m'); dim=$(printf '\033[2m'); green=$(printf '\033[32m'); red=$(printf '\033[31m'); reset=$(printf '\033[0m')
  else
    bold=""; dim=""; green=""; red=""; reset=""
  fi
  say()  { printf '%s\n' "$*"; }
  step() { printf '%s==>%s %s\n' "$green" "$reset" "$*"; }
  fail() { printf '%sError:%s %s\n' "$red" "$reset" "$*" >&2; exit 1; }

  [ "$(uname -s)" = "Darwin" ] || fail "Zerre is a Mac app. This installer only runs on macOS."
  major=$(sw_vers -productVersion | cut -d. -f1)
  [ "$major" -ge 26 ] 2>/dev/null || fail "Zerre needs macOS 26 or later (this Mac has $(sw_vers -productVersion))."
  for tool in curl shasum hdiutil ditto codesign plutil; do
    command -v "$tool" >/dev/null 2>&1 || fail "missing '$tool', which macOS normally includes."
  done

  tmp=$(mktemp -d "${TMPDIR:-/tmp}/zerre-install.XXXXXX")
  mnt="$tmp/mnt"
  cleanup() {
    [ -d "$mnt" ] && hdiutil detach -quiet "$mnt" >/dev/null 2>&1 || true
    rm -rf "$tmp"
  }
  trap cleanup EXIT INT TERM

  say ""
  say "${bold}Zerre${reset} ${dim}· a little life on your desktop${reset}"
  say ""

  step "Finding the latest release"
  curl -fsSL "$SITE/releases.json" -o "$tmp/releases.json" || fail "couldn't reach $SITE. Check your connection and try again."
  version=$(plutil -extract releases.0.version raw -o - "$tmp/releases.json" 2>/dev/null) || fail "couldn't read the release list."
  url=$(plutil -extract releases.0.downloadURL raw -o - "$tmp/releases.json")
  sha=$(plutil -extract releases.0.sha256 raw -o - "$tmp/releases.json")
  case "$url" in
    https://github.com/darkbringer1/zerre/releases/download/*) ;;
    *) fail "unexpected download address: $url" ;;
  esac

  step "Downloading Zerre $version"
  curl -fL --progress-bar "$url" -o "$tmp/Zerre.dmg" || fail "the download failed. Try again, or get it from $SITE"

  step "Checking the download"
  actual=$(shasum -a 256 "$tmp/Zerre.dmg" | awk '{print $1}')
  [ "$actual" = "$sha" ] || fail "checksum mismatch (expected $sha, got $actual). Nothing was installed."

  mkdir -p "$mnt"
  hdiutil attach -quiet -nobrowse -readonly -noautoopen -mountpoint "$mnt" "$tmp/Zerre.dmg" || fail "couldn't open the disk image."
  src="$mnt/Zerre.app"
  [ -d "$src" ] || fail "Zerre.app isn't in the disk image."
  codesign --verify --deep --strict "$src" 2>/dev/null || fail "Zerre.app's signature doesn't verify. Nothing was installed."
  team=$(codesign -dv "$src" 2>&1 | sed -n 's/^TeamIdentifier=//p')
  [ "$team" = "$TEAM_ID" ] || fail "Zerre.app is signed by an unexpected team ($team). Nothing was installed."
  spctl --assess --type execute "$src" 2>/dev/null || fail "macOS Gatekeeper rejected Zerre.app. Nothing was installed."

  if [ -n "${ZERRE_INSTALL_DIR:-}" ]; then
    apps="$ZERRE_INSTALL_DIR"
  elif [ -w /Applications ]; then
    apps="/Applications"
  else
    apps="$HOME/Applications"
  fi
  mkdir -p "$apps"
  dest="$apps/Zerre.app"

  if pgrep -x Zerre >/dev/null 2>&1; then
    step "Quitting the running Zerre"
    osascript -e "quit app id \"$BUNDLE_ID\"" >/dev/null 2>&1 || true
    i=0
    while pgrep -x Zerre >/dev/null 2>&1 && [ "$i" -lt 10 ]; do sleep 1; i=$((i + 1)); done
    pkill -x Zerre 2>/dev/null || true
  fi

  step "Installing to $dest"
  staged="$apps/.Zerre.app.installing"
  rm -rf "$staged"
  ditto "$src" "$staged" || fail "couldn't copy Zerre.app to $apps."
  rm -rf "$dest"
  mv "$staged" "$dest"

  # The link points at the stable path Zerre keeps up to date on every launch, so it survives
  # Sparkle updates and moving the app. "Remove Zerre" in the app deletes it again.
  bin="${ZERRE_BIN_DIR:-$HOME/.local/bin}"
  link="$bin/zerrectl"
  target="$HOME/Library/Application Support/Zerre/bin/zerrectl"
  cli_note=""
  mkdir -p "$bin"
  if [ -L "$link" ] || [ -e "$link" ]; then
    [ "$(readlink "$link" 2>/dev/null)" = "$target" ] || cli_note="$link already exists, so it was left alone."
  else
    ln -s "$target" "$link"
  fi
  case ":$PATH:" in
    *":$bin:"*) ;;
    *) [ -n "$cli_note" ] || cli_note="Add $bin to your PATH to use zerrectl, e.g. in ~/.zshrc:  export PATH=\"$bin:\$PATH\"" ;;
  esac

  if [ -z "${ZERRE_NO_LAUNCH:-}" ]; then
    step "Opening Zerre"
    open "$dest"
  fi

  say ""
  say "${green}Zerre $version is installed.${reset} Look for it on your desktop and in the menu bar."
  say "Updates arrive by themselves. In a terminal, try ${bold}zerrectl${reset} for a live dashboard."
  [ -z "$cli_note" ] || say "${dim}$cli_note${reset}"
  say ""
}

main "$@"
