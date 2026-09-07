// Copies rich text to the clipboard on behalf of the content script when the
// GitHub tab's document is not focused (navigator.clipboard requires focus).
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "offscreen-ping") {
    sendResponse({ pong: true });
    return;
  }
  if (msg?.type !== "offscreen-copy") return;

  const onCopy = (e) => {
    e.preventDefault();
    e.clipboardData.setData("text/html", msg.html);
    e.clipboardData.setData("text/plain", msg.plain);
  };
  document.addEventListener("copy", onCopy, true);
  let ok = false;
  let error = "";
  try {
    const ta = document.querySelector("textarea");
    ta.value = " ";
    ta.focus();
    ta.select();
    ok = document.execCommand("copy");
    if (!ok) error = "execCommand returned false";
  } catch (e) {
    error = String(e);
  }
  document.removeEventListener("copy", onCopy, true);
  if (!ok) console.warn("[ghlc offscreen] copy failed:", error);
  sendResponse({ ok, error });
});
