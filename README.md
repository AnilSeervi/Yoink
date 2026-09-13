# Yoink

Chrome extension that copies the current GitHub PR or issue as a rich link:

- **Link text:** `<title> (#<number>)` — e.g. `Fix login flow (#123)`
- **Rich targets** (Slack, Google Docs, Notion): pastes as a clickable link
- **Plain-text targets** (editors, terminals): pastes as markdown `[Fix login flow (#123)](https://github.com/org/repo/pull/123)`

Works on both `/pull/...` and `/issues/...` pages, including sub-tabs like _Files changed_.

## Install

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select this folder

## Use

- **Copy link:** click the small link button next to the PR/issue title, or press **Cmd+Shift+L** (Mac) / **Ctrl+Shift+L** (Windows/Linux)
- **Copy branch name:** on a PR, press **Cmd+Shift+Y** (Mac) / **Ctrl+Shift+Y** (Windows/Linux) — copies the head branch for `git checkout`

Shortcuts are remappable at `chrome://extensions/shortcuts`. A toast confirms every copy.

### Link format

Default text: `Fix login flow (#123)`. Two toggles under right-click the extension icon → Options:

- **Repository prefix:** `vscode#123: Fix login flow`
- **State emoji:** 🟣 merged / 🟢 open / 📝 draft / 🔴 closed — e.g. `🟣 Fix login flow (#123)`

## TODO

- [ ] Copy button on PR list rows — parked until GitHub's new PR list/page rollout settles

## Files

- `manifest.json` — Manifest V3 config (`offscreen`, `clipboardWrite`, `storage` permissions)
- `background.js` — routes keyboard shortcuts to the active tab, manages the offscreen document
- `content.js` — title/branch/state extraction, button injection, clipboard write, toast
- `content.css` — button and toast styles
- `options.html` / `options.js` — extension options (repository prefix toggle)
- `offscreen.html` / `offscreen.js` — clipboard fallback for when the page isn't focused (e.g. right after a reload)
