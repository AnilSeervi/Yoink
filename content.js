(() => {
  const BTN_ID = "ghlc-copy-btn";
  const TOAST_ID = "ghlc-toast";

  const LINK_ICON =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M7.775 3.275a.75.75 0 0 0 1.06 1.06l1.25-1.25a2 2 0 1 1 2.83 2.83l-2.5 2.5a2 2 0 0 1-2.83 0 .75.75 0 0 0-1.06 1.06 3.5 3.5 0 0 0 4.95 0l2.5-2.5a3.5 3.5 0 0 0-4.95-4.95l-1.25 1.25Zm-4.69 9.64a2 2 0 0 1 0-2.83l2.5-2.5a2 2 0 0 1 2.83 0 .75.75 0 0 0 1.06-1.06 3.5 3.5 0 0 0-4.95 0l-2.5 2.5a3.5 3.5 0 0 0 4.95 4.95l1.25-1.25a.75.75 0 0 0-1.06-1.06l-1.25 1.25a2 2 0 0 1-2.83 0Z"/></svg>';
  const CHECK_ICON =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>';

  function pageInfo() {
    const m = location.pathname.match(/^\/([^/]+)\/([^/]+)\/(pull|issues)\/(\d+)(?:\/|$)/);
    if (!m) return null;
    return {
      kind: m[3],
      repo: m[2],
      number: m[4],
      url: `${location.origin}/${m[1]}/${m[2]}/${m[3]}/${m[4]}`,
    };
  }

  function getBranch() {
    // React UI: "into <base> from <head>" — links appear in that order, so the
    // second one is the head branch. Text is "owner:branch" on fork PRs.
    const refs = document.querySelectorAll('a[data-component="BranchName"]');
    const el = refs[1] ?? document.querySelector(".commit-ref.head-ref, span.head-ref"); // classic UI
    const text = el?.textContent.trim();
    return text ? text.split(":").pop() : null;
  }

  async function copyBranch() {
    if (pageInfo()?.kind !== "pull") {
      showToast("Not a PR page — no branch to copy");
      return;
    }
    const branch = getBranch();
    if (!branch) {
      showToast("Couldn't find the branch name");
      return;
    }
    if (await writeClipboard(escHtml(branch), branch)) {
      showToast(`Copied branch: ${branch}`);
      flashButton();
    } else {
      showToast("Copy failed");
    }
  }

  // Issues and PRs render different header markup; classic selectors kept as
  // fallback for not-yet-migrated views and GitHub Enterprise.
  const TITLE_SELECTORS = [
    'bdi[data-testid="issue-title"]', // issues (React UI); excludes "issue-title-sticky"
    'h1[data-component="PH_Title"] span.markdown-title', // PRs (React UI); sticky copy sits in an h2
    ".gh-header-title .js-issue-title", // classic UI
    ".gh-header-title bdi.markdown-title", // classic UI
  ];

  function getTitleEl() {
    for (const sel of TITLE_SELECTORS) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el;
    }
    return null;
  }

  function getTitle() {
    const el = getTitleEl();
    if (el) return el.textContent.trim();
    // Fallback: parse the tab title. PRs append " by <author>", issues don't.
    const m =
      document.title.match(/^(.*) by \S+ · Pull Request #\d+ · /) ||
      document.title.match(/^(.*) · (?:Pull Request|Issue) #\d+ · /);
    return m ? m[1].trim() : null;
  }

  const escHtml = (s) =>
    s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  async function copyLink() {
    const info = pageInfo();
    if (!info) {
      showToast("Not a PR or issue page");
      return;
    }
    const title = getTitle();
    if (!title) {
      showToast("Couldn't find the title");
      return;
    }
    const { repoPrefix } = await chrome.storage.sync.get({ repoPrefix: false });
    const text = repoPrefix ? `${info.repo}#${info.number}: ${title}` : `${title} (#${info.number})`;
    const html = `<a href="${escHtml(info.url)}">${escHtml(text)}</a>`;
    const markdown = `[${text.replace(/([[\]])/g, "\\$1")}](${info.url})`;
    if (await writeClipboard(html, markdown)) {
      showToast(`Copied: ${text}`);
      flashButton();
    } else {
      showToast("Copy failed");
    }
  }

  async function writeClipboard(html, plain) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        }),
      ]);
      return true;
    } catch (e) {
      // No transient user activation (keyboard-command path) — copy-event fallback.
      console.warn("[ghlc] clipboard.write failed:", e);
    }
    if (execCopy(html, plain)) return true;
    console.warn("[ghlc] execCommand fallback failed");
    // Document not focused (e.g. focus in the address bar after a reload) —
    // both in-page paths are blocked; copy via the extension's offscreen document.
    try {
      const res = await chrome.runtime.sendMessage({ type: "bg-copy", html, plain });
      if (!res?.ok) console.warn("[ghlc] offscreen copy failed:", res?.error);
      return !!res?.ok;
    } catch (e) {
      console.warn("[ghlc] background unreachable:", e);
      return false;
    }
  }

  function execCopy(html, plain) {
    const onCopy = (e) => {
      e.preventDefault();
      e.clipboardData.setData("text/html", html);
      e.clipboardData.setData("text/plain", plain);
    };
    document.addEventListener("copy", onCopy, true);
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {}
    document.removeEventListener("copy", onCopy, true);
    return ok;
  }

  let flashTimer;
  function flashButton() {
    const btn = document.getElementById(BTN_ID);
    if (!btn) return;
    btn.innerHTML = CHECK_ICON;
    btn.classList.add("ghlc-copied");
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
      btn.innerHTML = LINK_ICON;
      btn.classList.remove("ghlc-copied");
    }, 1500);
  }

  let toastTimer;
  function showToast(msg) {
    let toast = document.getElementById(TOAST_ID);
    if (!toast) {
      toast = document.createElement("div");
      toast.id = TOAST_ID;
      toast.className = "ghlc-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.remove("ghlc-show");
    void toast.offsetWidth; // restart the CSS animation
    toast.classList.add("ghlc-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.remove(), 2300);
  }

  function ensureButton() {
    const existing = document.getElementById(BTN_ID);
    if (!pageInfo()) {
      existing?.remove();
      return;
    }
    const titleEl = getTitleEl();
    if (!titleEl) {
      existing?.remove();
      return;
    }
    if (existing && existing.previousElementSibling === titleEl) return;
    existing?.remove();
    const btn = document.createElement("button");
    btn.id = BTN_ID;
    btn.className = "ghlc-btn";
    btn.type = "button";
    btn.title = "Copy link with title";
    btn.setAttribute("aria-label", "Copy link with title");
    btn.innerHTML = LINK_ICON;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      copyLink();
    });
    titleEl.insertAdjacentElement("afterend", btn);
  }

  // React re-renders wipe the button and SPA navigations swap the page without
  // a reload — a debounced observer re-injects in both cases.
  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      ensureButton();
    }, 200);
  }
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  ensureButton();

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "copy-link") copyLink();
    else if (msg?.type === "copy-branch") copyBranch();
  });
})();
