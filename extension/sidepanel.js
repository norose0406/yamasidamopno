const $ = (id) => document.getElementById(id);

function faviconOf(tab) {
  return tab.favIconUrl || "icons/icon16.png";
}

async function render() {
  const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (active) {
    $("favicon").src = faviconOf(active);
    $("title").textContent = active.title || "(無題)";
    $("url").textContent = active.url || "";
    $("url").href = active.url || "#";
  }

  const tabs = await chrome.tabs.query({ currentWindow: true });
  $("count").textContent = tabs.length;
  const list = $("tabs");
  list.replaceChildren(
    ...tabs.map((tab) => {
      const li = document.createElement("li");
      li.title = tab.url || "";
      if (tab.active) li.classList.add("active");
      const img = document.createElement("img");
      img.src = faviconOf(tab);
      img.width = img.height = 16;
      img.alt = "";
      li.append(img, document.createTextNode(tab.title || tab.url || "(無題)"));
      li.addEventListener("click", () => chrome.tabs.update(tab.id, { active: true }));
      return li;
    })
  );
}

$("refresh").addEventListener("click", render);
$("copy").addEventListener("click", async () => {
  await navigator.clipboard.writeText($("url").textContent);
  $("copy").textContent = "コピーしました";
  setTimeout(() => ($("copy").textContent = "URLをコピー"), 1500);
});

// タブの切り替え・読み込み・開閉に追従して自動更新
chrome.tabs.onActivated.addListener(render);
chrome.tabs.onUpdated.addListener(render);
chrome.tabs.onRemoved.addListener(render);
chrome.tabs.onCreated.addListener(render);

render();
