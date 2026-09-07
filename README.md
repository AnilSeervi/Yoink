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

- Click the small link button next to the PR/issue title, or
- Press **Cmd+Shift+L** (Mac) / **Ctrl+Shift+L** (Windows/Linux) — remappable at `chrome://extensions/shortcuts`

A toast confirms what was copied.

## TODO

- [ ] Copy branch name shortcut (PR head branch, for `git checkout`)
- [ ] Repo prefix option (`vscode#123: Fix login`)
- [ ] State emoji in link text (🟣 merged / 🟢 open / 📝 draft / 🔴 closed)
- [ ] Copy button on `/pulls` list rows

## Files

- `manifest.json` — Manifest V3 config (`offscreen` + `clipboardWrite` permissions)
- `background.js` — routes the keyboard shortcut to the active tab, manages the offscreen document
- `content.js` — title extraction, button injection, clipboard write, toast
- `content.css` — button and toast styles
- `offscreen.html` / `offscreen.js` — clipboard fallback for when the page isn't focused (e.g. right after a reload)
