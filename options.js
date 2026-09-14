const DEFAULTS = { repoPrefix: false, stateEmoji: false };

chrome.storage.sync.get(DEFAULTS).then((settings) => {
  for (const key of Object.keys(DEFAULTS)) {
    const checkbox = document.getElementById(key);
    if (!checkbox) {
      // Stale options.html/options.js pair after a partial extension reload —
      // skip so the remaining checkboxes still work.
      console.warn(`[ghlc options] missing checkbox #${key}`);
      continue;
    }
    checkbox.checked = settings[key];
    checkbox.addEventListener("change", () => {
      chrome.storage.sync.set({ [key]: checkbox.checked });
    });
  }
});
