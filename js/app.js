/**
 * 旗当番管理アプリ – メインスクリプト
 *
 * GAS_URL に Google Apps Script の Web App URL を設定すると
 * スプレッドシートからデータを取得します。
 * 空のままにするとモックデータで動作します。
 */

// ===== 当番地点の定義 =====
// ※緯度経度はGoogle Mapsで確認して微調整してください
const SPOTS = [
  {
    name: "丸金前",
    lat:  35.67751675993982,
    lng:  139.8812595709351,
    color: "#2e7d32",
  },
  {
    name: "二之江神社",
    lat:  35.67563704979277,
    lng:  139.88012863130427,
    color: "#c62828",
  },
  {
    name: "二之江第三小",
    lat:  35.67493043603786,
    lng:  139.87914094688867,
    color: "#1565c0",
  },
  {
    name: "古川親水公園トイレ",
    lat:  35.67787445938014,
    lng:  139.8832234602802,
    color: "#e65100",
  },
];

// ===== 設定 =====
const GAS_URL = "";

// ===== モックデータ =====
const MOCK_DATA = [
  // 6月
  { date: "2026-06-08", name: "田中",   class: "1年1組", spot: "丸金前" },
  { date: "2026-06-08", name: "鈴木",   class: "3年2組", spot: "二之江神社" },
  { date: "2026-06-09", name: "佐藤",   class: "2年1組", spot: "二之江第三小" },
  { date: "2026-06-09", name: "山田",   class: "4年2組", spot: "古川親水公園トイレ" },
  { date: "2026-06-10", name: "中村",   class: "5年1組", spot: "丸金前" },
  { date: "2026-06-10", name: "伊藤",   class: "6年2組", spot: "二之江神社" },
  { date: "2026-06-11", name: "小林",   class: "1年2組", spot: "二之江第三小" },
  { date: "2026-06-11", name: "加藤",   class: "2年1組", spot: "古川親水公園トイレ" },
  { date: "2026-06-12", name: "吉田",   class: "3年2組", spot: "丸金前" },
  { date: "2026-06-12", name: "渡辺",   class: "4年1組", spot: "二之江神社" },
  { date: "2026-06-15", name: "高橋",   class: "5年2組", spot: "二之江第三小" },
  { date: "2026-06-15", name: "山本",   class: "6年1組", spot: "古川親水公園トイレ" },
  { date: "2026-06-16", name: "田中",   class: "1年1組", spot: "丸金前" },
  { date: "2026-06-17", name: "松本",   class: "2年2組", spot: "丸金前" },
  { date: "2026-06-18", name: "井上",   class: "3年1組", spot: "二之江第三小" },
  { date: "2026-06-19", name: "木村",   class: "4年2組", spot: "古川親水公園トイレ" },
  { date: "2026-06-22", name: "林",     class: "5年1組", spot: "丸金前" },
  { date: "2026-06-23", name: "清水",   class: "6年2組", spot: "二之江神社" },
  { date: "2026-06-24", name: "山口",   class: "1年2組", spot: "二之江第三小" },
  { date: "2026-06-25", name: "阿部",   class: "2年1組", spot: "古川親水公園トイレ" },
  { date: "2026-06-26", name: "斉藤",   class: "3年2組", spot: "丸金前" },
  // 7月
  { date: "2026-07-01", name: "田中",   class: "1年1組", spot: "丸金前" },
  { date: "2026-07-02", name: "佐藤",   class: "2年1組", spot: "丸金前" },
  { date: "2026-07-03", name: "鈴木",   class: "3年2組", spot: "二之江第三小" },
  { date: "2026-07-06", name: "山田",   class: "4年2組", spot: "古川親水公園トイレ" },
  { date: "2026-07-07", name: "中村",   class: "5年1組", spot: "丸金前" },
  { date: "2026-07-08", name: "伊藤",   class: "6年2組", spot: "二之江神社" },
  { date: "2026-07-09", name: "高橋",   class: "1年2組", spot: "二之江第三小" },
  { date: "2026-07-10", name: "田中",   class: "1年1組", spot: "丸金前" },
];

// ===== 申請データ（デモ用・メモリ上のみ）=====
// { id: string, date: string, type: "absence"|"swap", swapDate: string, memo: string }
const requests = [];

// ===== 状態 =====
let allData = [];
let currentYear, currentMonth;
let pendingRequest = null; // モーダル開中の対象

// ===== 初期化 =====
window.addEventListener("DOMContentLoaded", async () => {
  const now = new Date();
  currentYear  = now.getFullYear();
  currentMonth = now.getMonth();

  allData = await fetchData();
  renderThisWeek();
  renderCalendar();
  renderMap();
  setupEventListeners();
});

// ===== データ取得 =====
async function fetchData() {
  if (!GAS_URL) return MOCK_DATA;
  try {
    const res = await fetch(GAS_URL);
    if (!res.ok) throw new Error("network error");
    return await res.json();
  } catch (err) {
    console.warn("GAS取得失敗。モックデータを使用します。", err);
    return MOCK_DATA;
  }
}

// ===== イベント設定 =====
function setupEventListeners() {
  document.getElementById("search-btn").addEventListener("click", handleSearch);
  document.getElementById("search-name").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSearch();
  });
  document.getElementById("prev-month").addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
  });
  document.getElementById("next-month").addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
  });

  // モーダル
  document.getElementById("modal-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById("modal-submit").addEventListener("click", submitRequest);

  // 「日程を変えたい」選択時だけ希望日を表示
  document.querySelectorAll('input[name="req-type"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      const swapSection = document.getElementById("swap-section");
      swapSection.style.display =
        document.querySelector('input[name="req-type"]:checked').value === "swap"
          ? "block"
          : "none";
    });
  });
  // 初期状態で非表示
  document.getElementById("swap-section").style.display = "none";
}

// ===== 今週の当番 =====
function renderThisWeek() {
  const { start, end } = getThisWeekRange();
  const items = allData
    .filter((d) => { const dt = new Date(d.date); return dt >= start && dt <= end; })
    .sort((a, b) => a.date.localeCompare(b.date));

  const container = document.getElementById("this-week-list");
  if (items.length === 0) {
    container.innerHTML = '<p class="no-result">今週の当番はありません。</p>';
    return;
  }
  container.innerHTML = items.map((item) => tobanItemHTML(item, false)).join("");
}

function getThisWeekRange() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// ===== マイ当番検索 =====
function handleSearch() {
  const name  = document.getElementById("search-name").value.trim();
  const cls   = document.getElementById("search-class").value;
  const container = document.getElementById("search-result");

  if (!name && !cls) {
    container.innerHTML = '<p class="no-result">苗字またはクラスを入力してください。</p>';
    return;
  }

  const items = allData
    .filter((d) => {
      const matchName  = !name || d.name.includes(name);
      const matchClass = !cls  || d.class === cls;
      return matchName && matchClass;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  if (items.length === 0) {
    container.innerHTML = `<p class="no-result">当番が見つかりませんでした。</p>`;
    return;
  }
  container.innerHTML = items.map((item) => tobanItemHTML(item, true)).join("");

  // 調整ボタンのイベント
  container.querySelectorAll(".btn-adjust").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.date, btn.dataset.name, btn.dataset.class));
  });
}

// ===== モーダル =====
function openModal(date, name, cls) {
  pendingRequest = { date, name, class: cls };

  document.getElementById("modal-target-date").textContent =
    `${formatDate(date)}　${name}（${cls}）`;
  document.getElementById("swap-date").value = "";
  document.getElementById("req-memo").value  = "";
  document.querySelector('input[name="req-type"][value="absence"]').checked = true;
  document.getElementById("swap-section").style.display = "none";

  document.getElementById("modal-overlay").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal-overlay").classList.add("hidden");
  pendingRequest = null;
}

function submitRequest() {
  if (!pendingRequest) return;

  const type     = document.querySelector('input[name="req-type"]:checked').value;
  const swapDate = document.getElementById("swap-date").value;
  const memo     = document.getElementById("req-memo").value.trim();

  requests.push({ ...pendingRequest, type, swapDate, memo, id: String(Date.now()) });

  closeModal();
  showToast();
  handleSearch(); // 一覧を再描画してバッジを表示
}

function showToast() {
  const toast = document.getElementById("toast");
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2800);
}

// ===== カレンダー =====
function renderCalendar() {
  document.getElementById("month-label").textContent =
    `${currentYear}年${currentMonth + 1}月`;

  const cal = document.getElementById("calendar");
  cal.innerHTML = "";
  cal.appendChild(buildCalHeader());
  cal.appendChild(buildCalGrid());
}

function buildCalHeader() {
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const div = document.createElement("div");
  div.className = "cal-header";
  days.forEach((d) => {
    const span = document.createElement("span");
    span.textContent = d;
    div.appendChild(span);
  });
  return div;
}

function buildCalGrid() {
  const grid = document.createElement("div");
  grid.className = "cal-grid";

  const firstDay    = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today       = new Date();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "cal-day empty";
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = toDateStr(currentYear, currentMonth, d);
    const dow     = new Date(currentYear, currentMonth, d).getDay();

    const cell = document.createElement("div");
    cell.className = "cal-day";
    if (dow === 0) cell.classList.add("sunday");
    if (dow === 6) cell.classList.add("saturday");
    if (
      d === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear  === today.getFullYear()
    ) cell.classList.add("today");

    const numSpan = document.createElement("span");
    numSpan.className = "day-num";
    numSpan.textContent = d;
    cell.appendChild(numSpan);

    allData
      .filter((x) => x.date === dateStr)
      .forEach((t) => {
        const tag = document.createElement("span");
        tag.className = "cal-toban-tag";
        tag.textContent = `${t.name}（${t.spot}）`;
        tag.title = `${t.name} ${t.class} ${t.spot}`;
        cell.appendChild(tag);
      });

    grid.appendChild(cell);
  }
  return grid;
}

// ===== 地図 =====
function renderMap() {
  const center = [35.67645, 139.88069];
  const map = L.map("map").setView(center, 18);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  SPOTS.forEach((spot) => {
    const icon = L.divIcon({
      className: "",
      html: `<div style="
        background:${spot.color};
        color:#fff;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        width:32px;height:32px;
        display:flex;align-items:center;justify-content:center;
        font-size:11px;font-weight:700;
        box-shadow:0 2px 6px rgba(0,0,0,.3);
      "><span style="transform:rotate(45deg)">${spot.name}</span></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -34],
    });

    L.marker([spot.lat, spot.lng], { icon })
      .addTo(map)
      .bindPopup(`<strong>${spot.name}</strong>`);
  });
}

// ===== ヘルパー =====
function toDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-");
  const dow = ["日", "月", "火", "水", "木", "金", "土"][new Date(dateStr).getDay()];
  return `${parseInt(m)}/${parseInt(d)}（${dow}）`;
}

function getRequest(date, name, cls) {
  return requests.find((r) => r.date === date && r.name === name && r.class === cls) || null;
}

function tobanItemHTML(item, showAdjustBtn) {
  const req = getRequest(item.date, item.name, item.class);
  const mineClass = showAdjustBtn ? " mine" : "";

  let badgeHTML = "";
  if (req) {
    const label = req.type === "absence" ? "欠席申請中" : "日程変更申請中";
    const cls   = req.type === "absence" ? "absence" : "swap";
    badgeHTML = `<span class="req-badge ${cls}">${label}</span>`;
  }

  let adjustHTML = "";
  if (showAdjustBtn) {
    if (req) {
      adjustHTML = `<button class="btn-adjust" disabled>申請済み</button>`;
    } else {
      adjustHTML = `<button class="btn-adjust"
        data-date="${item.date}"
        data-name="${item.name}"
        data-class="${item.class}">調整を申請</button>`;
    }
  }

  return `
    <div class="toban-item${mineClass}">
      <span class="date-badge">${formatDate(item.date)}</span>
      <span class="name">${item.name}</span>
      <span class="spot-badge">${item.spot}</span>
      <span class="class-info">${item.class}</span>
      ${badgeHTML}
      ${adjustHTML}
    </div>`;
}
