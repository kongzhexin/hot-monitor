const byId = (id) => document.getElementById(id);

async function api(url, options) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "请求失败");
  }
  return response.json();
}

function formatTime(value) {
  return new Date(value).toLocaleString("zh-CN");
}

function setHealth(data) {
  const target = byId("health");
  target.innerHTML = "";
  [
    `服务时间: ${formatTime(data.now)}`,
    `AI鉴别: ${data.openRouterEnabled ? "OpenRouter已启用" : "启发式降级"}`,
  ].forEach((text) => {
    const node = document.createElement("span");
    node.className = "pill";
    node.textContent = text;
    target.appendChild(node);
  });
}

async function renderRules() {
  const result = await api("/api/rules");
  const list = byId("ruleList");
  list.innerHTML = "";

  result.data.forEach((rule) => {
    const card = byId("ruleTemplate").content.firstElementChild.cloneNode(true);
    card.querySelector("h3").textContent = `${rule.name} (${rule.type})`;
    card.querySelector(".meta").textContent = `${rule.query}`;
    const button = card.querySelector(".toggleBtn");
    button.textContent = rule.enabled ? "禁用" : "启用";
    button.addEventListener("click", async () => {
      await api(`/api/rules/${rule.id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !rule.enabled }),
      });
      await refresh();
    });
    list.appendChild(card);
  });
}

async function renderHotspots() {
  const result = await api("/api/hotspots");
  const list = byId("hotspotList");
  list.innerHTML = "";

  result.data.slice(0, 24).forEach((item) => {
    const card = byId("hotTemplate").content.firstElementChild.cloneNode(true);
    if (item.score >= 0.8) {
      card.classList.add("high");
    }
    const title = card.querySelector(".title");
    title.textContent = item.title;
    title.href = item.link;
    card.querySelector(".meta").textContent =
      `${item.ruleName} | ${item.source} | 评分 ${item.score} | ${formatTime(item.scannedAt)}`;
    card.querySelector(".reason").textContent =
      item.ai?.reasoning_summary || "";
    list.appendChild(card);
  });
}

async function renderTrends() {
  const result = await api("/api/trends");
  const list = byId("trendList");
  list.innerHTML = "";

  result.data.forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `<h3>${item.topic}</h3><p class="meta">事件数 ${item.count} | 平均分 ${item.avgScore}</p>`;
    list.appendChild(card);
  });
}

async function renderNotifications() {
  const result = await api("/api/notifications");
  const list = byId("notificationList");
  list.innerHTML = "";

  result.data.slice(0, 16).forEach((item) => {
    const card =
      byId("notifyTemplate").content.firstElementChild.cloneNode(true);
    card.querySelector("h3").textContent = item.title;
    card.querySelector(".meta").textContent =
      `${item.source} | score ${item.score} | ${formatTime(item.createdAt)}`;
    list.appendChild(card);
  });
}

async function refresh() {
  const health = await api("/api/health");
  setHealth(health);
  await Promise.all([
    renderRules(),
    renderHotspots(),
    renderTrends(),
    renderNotifications(),
  ]);
}

byId("ruleForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    name: byId("name").value.trim(),
    type: byId("type").value,
    query: byId("query").value.trim(),
    priority: byId("priority").value,
  };

  try {
    await api("/api/rules", { method: "POST", body: JSON.stringify(payload) });
    event.target.reset();
    await refresh();
    alert("规则已创建");
  } catch (error) {
    alert(error.message);
  }
});

byId("scanBtn").addEventListener("click", async () => {
  try {
    const result = await api("/api/scan", { method: "POST" });
    await refresh();
    alert(`巡查完成，新事件 ${result.data.newEvents} 条`);
  } catch (error) {
    alert(error.message);
  }
});

refresh();
setInterval(refresh, 20000);
