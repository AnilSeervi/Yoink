chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "copy-link") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "copy-link" });
  } catch {
    // No content script in this tab (not a github.com page) — nothing to do.
  }
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ensureOffscreen() {
  if (!(await chrome.offscreen.hasDocument())) {
    try {
      await chrome.offscreen.createDocument({
        url: "offscreen.html",
        reasons: ["CLIPBOARD"],
        justification: "Write the copied link to the clipboard when the page is not focused",
      });
    } catch (e) {
      // A concurrent call may have created it already; anything else is fatal.
      if (!String(e).includes("single offscreen")) throw e;
    }
  }
  // createDocument can resolve before the document's scripts have registered
  // their message listener — wait until it answers a ping.
  for (let i = 0; i < 20; i++) {
    try {
      const res = await chrome.runtime.sendMessage({ type: "offscreen-ping" });
      if (res?.pong) return;
    } catch {}
    await sleep(50);
  }
  throw new Error("offscreen document never became ready");
}

// Content script falls back to this when the page document is not focused
// (e.g. focus is in the address bar) and in-page clipboard APIs are blocked.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "bg-copy") return;
  (async () => {
    try {
      await ensureOffscreen();
      const res = await chrome.runtime.sendMessage({
        type: "offscreen-copy",
        html: msg.html,
        plain: msg.plain,
      });
      if (!res?.ok) console.warn("[ghlc bg] offscreen copy failed:", res?.error);
      sendResponse({ ok: !!res?.ok, error: res?.error ?? "" });
    } catch (e) {
      console.warn("[ghlc bg] offscreen path failed:", e);
      sendResponse({ ok: false, error: String(e) });
    }
  })();
  return true; // keep the message channel open for the async response
});
