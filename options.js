const checkbox = document.getElementById("repoPrefix");

chrome.storage.sync.get({ repoPrefix: false }).then(({ repoPrefix }) => {
  checkbox.checked = repoPrefix;
});

checkbox.addEventListener("change", () => {
  chrome.storage.sync.set({ repoPrefix: checkbox.checked });
});
