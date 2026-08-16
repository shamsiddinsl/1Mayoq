// ============================================
// 1Mayoq — App logic (MVP)
// Hozircha localStorage bilan ishlaydi.
// Firebase to'liq ulanganda saqlash Firestore'ga o'tkaziladi
// (bu joylar "// FIREBASE:" izohi bilan belgilangan).
// ============================================

const STORAGE_KEY = "1mayoq_tasks";
let selectedCategory = "useful";
let weeklyChart = null;
let viewingDate = todayKeyNow();
let editingId = null;
let chartMode = "week"; // "week" | "month"
let chartAnchor = todayKeyNow(); // qaysi hafta/oy ko'rsatilayotganini belgilaydi

// Vaqt zonasidan mustaqil, mahalliy sana kalitini olish (UTC siljishisiz)
function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayKeyNow() {
  return toDateKey(new Date());
}

function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d); // mahalliy vaqt, soat 00:00
}

// ---------- Sana yordamchilari ----------
function todayKey() {
  return viewingDate;
}

function last7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(toDateKey(d));
  }
  return days;
}

// ---------- Saqlash (localStorage, MVP uchun) ----------
function loadAllTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveAllTasks(all) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  // FIREBASE: bu yerda Firestore'ga yozish qo'shiladi (users/{uid}/tasks)
}

function getTodayTasks() {
  const all = loadAllTasks();
  return all[todayKey()] || [];
}

function addTask(task) {
  const all = loadAllTasks();
  const key = todayKey();
  if (!all[key]) all[key] = [];
  all[key].push(task);
  saveAllTasks(all);
}

function updateTask(id, updates) {
  const all = loadAllTasks();
  const key = todayKey();
  const tasks = all[key] || [];
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx !== -1) {
    tasks[idx] = { ...tasks[idx], ...updates };
    saveAllTasks(all);
  }
}

function startEdit(id) {
  const task = getTodayTasks().find((t) => t.id === id);
  if (!task) return;
  editingId = id;
  document.getElementById("taskTitle").value = task.title;
  document.getElementById("taskStart").value = task.start;
  document.getElementById("taskEnd").value = task.end;
  document.querySelectorAll(".cat-btn").forEach((b) => b.classList.remove("active"));
  document.querySelector(`.cat-btn[data-cat="${task.category}"]`).classList.add("active");
  selectedCategory = task.category;
  document.getElementById("submitBtn").textContent = "Yangilash";
  document.getElementById("cancelEdit").hidden = false;
  document.getElementById("taskTitle").focus();
}

function cancelEdit() {
  editingId = null;
  document.getElementById("taskForm").reset();
  document.querySelectorAll(".cat-btn").forEach((b) => b.classList.remove("active"));
  document.querySelector('.cat-btn[data-cat="useful"]').classList.add("active");
  selectedCategory = "useful";
  document.getElementById("submitBtn").textContent = "Qo'shish";
  document.getElementById("cancelEdit").hidden = true;
}

function deleteTask(id) {
  const all = loadAllTasks();
  const key = todayKey();
  all[key] = (all[key] || []).filter((t) => t.id !== id);
  saveAllTasks(all);
}

// ---------- Vaqt hisoblash ----------
function durationHours(start, end) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60; // yarim tundan o'tgan holat
  return mins / 60;
}

function summarize(tasks) {
  const sum = { useful: 0, useless: 0, neutral: 0 };
  tasks.forEach((t) => {
    sum[t.category] += durationHours(t.start, t.end);
  });
  const total = sum.useful + sum.useless + sum.neutral;
  const pct = total > 0 ? Math.round((sum.useful / total) * 100) : null;
  return { ...sum, total, pct };
}

// ---------- Render: hero / gauge ----------
function renderHero() {
  const tasks = getTodayTasks();
  const { useful, useless, total, pct } = summarize(tasks);
  const headline = document.getElementById("heroHeadline");
  const sub = document.getElementById("heroSub");
  const gaugePercent = document.getElementById("gaugePercent");
  const gaugeFill = document.getElementById("gaugeFill");
  const isToday = viewingDate === todayKeyNow();
  const dayWord = isToday ? "Kuningiz" : "Bu kun";

  if (total === 0) {
    headline.textContent = isToday ? "Kuningiz hali boshlanmadi" : "Bu kunga vazifa yo'q";
    sub.textContent = "Birinchi vazifani qo'shing — mayoq yona boshlaydi.";
    gaugePercent.textContent = "—";
    gaugeFill.style.strokeDashoffset = 628;
    gaugeFill.style.stroke = "var(--neutral)";
    return;
  }

  gaugePercent.textContent = pct + "%";
  const offset = 628 - (628 * pct) / 100;
  gaugeFill.style.strokeDashoffset = offset;
  gaugeFill.style.stroke = pct >= 50 ? "var(--beam)" : "var(--useless)";

  if (pct >= 70) {
    headline.textContent = "Mayoq yorqin yonmoqda";
    sub.textContent = `${dayWord} ${useful.toFixed(1)} soat foydali ishga ketdi. Shu yo'ldan davom eting.`;
  } else if (pct >= 40) {
    headline.textContent = "Yorug'lik xira, lekin bor";
    sub.textContent = `Foydali: ${useful.toFixed(1)}s · Foydasiz: ${useless.toFixed(1)}s. Muvozanatni yaxshilash mumkin.`;
  } else {
    headline.textContent = isToday ? "Bugun tuman qalin" : "O'sha kuni tuman qalin bo'lgan";
    sub.textContent = `Foydasiz vaqt (${useless.toFixed(1)}s) foydali vaqtdan (${useful.toFixed(1)}s) ko'p.`;
  }
}

// ---------- Render: task list ----------
function renderTaskList() {
  const tasks = getTodayTasks().sort((a, b) => a.start.localeCompare(b.start));
  const list = document.getElementById("taskList");
  const count = document.getElementById("taskCount");
  count.textContent = `${tasks.length} ta`;

  list.innerHTML = "";
  if (tasks.length === 0) {
    list.innerHTML = `
      <li class="empty-state" id="emptyState">
        <span class="empty-glyph">○</span>
        <p>Hali vazifa yo'q. Mayoq kutmoqda.</p>
      </li>`;
    return;
  }

  const catLabels = { useful: "Foydali", useless: "Foydasiz", neutral: "Neytral" };

  tasks.forEach((t) => {
    const li = document.createElement("li");
    li.className = `task-item ${t.category}`;
    li.innerHTML = `
      <span class="task-time">${t.start}–${t.end}</span>
      <span class="task-name">${escapeHtml(t.title)}</span>
      <span class="task-tag ${t.category}">${catLabels[t.category]}</span>
      <button class="task-edit" aria-label="Tahrirlash" data-id="${t.id}">✎</button>
      <button class="task-delete" aria-label="O'chirish" data-id="${t.id}">✕</button>
    `;
    list.appendChild(li);
  });

  list.querySelectorAll(".task-edit").forEach((btn) => {
    btn.addEventListener("click", () => startEdit(btn.dataset.id));
  });

  list.querySelectorAll(".task-delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.id === editingId) cancelEdit();
      deleteTask(btn.dataset.id);
      renderAll();
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Hafta/oy oralig'ini hisoblash ----------
function getWeekDays(anchorKey) {
  const anchor = parseDateKey(anchorKey);
  const dow = (anchor.getDay() + 6) % 7; // 0=Dushanba
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - dow);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(toDateKey(d));
  }
  return days;
}

function getMonthDays(anchorKey) {
  const anchor = parseDateKey(anchorKey);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(toDateKey(new Date(year, month, i)));
  }
  return days;
}

const WEEKDAY_SHORT = ["Dush", "Sesh", "Chor", "Pay", "Jum", "Shan", "Yak"];
const MONTH_NAMES = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"];

function renderChartRange() {
  const el = document.getElementById("chartRange");
  const anchor = parseDateKey(chartAnchor);
  if (chartMode === "week") {
    const days = getWeekDays(chartAnchor);
    const start = parseDateKey(days[0]);
    const end = parseDateKey(days[6]);
    el.textContent = `${start.getDate()}–${end.getDate()} ${MONTH_NAMES[end.getMonth()]}`;
  } else {
    el.textContent = `${MONTH_NAMES[anchor.getMonth()]} ${anchor.getFullYear()}`;
  }
}

function shiftChart(dir) {
  const d = parseDateKey(chartAnchor);
  if (chartMode === "week") {
    d.setDate(d.getDate() + dir * 7);
  } else {
    d.setMonth(d.getMonth() + dir);
  }
  chartAnchor = toDateKey(d);
  renderChartRange();
  renderChart();
}

// ---------- Render: grafik (hafta yoki oy) ----------
function renderChart() {
  const all = loadAllTasks();
  const days = chartMode === "week" ? getWeekDays(chartAnchor) : getMonthDays(chartAnchor);

  const usefulData = [];
  const uselessData = [];
  const neutralData = [];
  const labels = days.map((dayKey) => {
    const d = parseDateKey(dayKey);
    return chartMode === "week" ? WEEKDAY_SHORT[(d.getDay() + 6) % 7] : String(d.getDate());
  });

  days.forEach((day) => {
    const tasks = all[day] || [];
    const { useful, useless, neutral } = summarize(tasks);
    usefulData.push(+useful.toFixed(2));
    uselessData.push(+useless.toFixed(2));
    neutralData.push(+neutral.toFixed(2));
  });

  const ctx = document.getElementById("weeklyChart");
  if (weeklyChart) weeklyChart.destroy();

  weeklyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Foydali", data: usefulData, backgroundColor: "#4FD1AE", borderRadius: 3 },
        { label: "Neytral", data: neutralData, backgroundColor: "#7C8CA6", borderRadius: 3 },
        { label: "Foydasiz", data: uselessData, backgroundColor: "#E8664F", borderRadius: 3 },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "#A9B6C9", font: { family: "Manrope" } } },
      },
      scales: {
        x: { stacked: true, ticks: { color: "#647289", maxRotation: 0, autoSkip: chartMode === "month" }, grid: { color: "#223247" } },
        y: { stacked: true, ticks: { color: "#647289" }, grid: { color: "#223247" }, title: { display: true, text: "soat", color: "#647289" } },
      },
    },
  });
}

document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    chartMode = btn.dataset.mode;
    renderChartRange();
    renderChart();
  });
});
document.getElementById("chartPrev").addEventListener("click", () => shiftChart(-1));
document.getElementById("chartNext").addEventListener("click", () => shiftChart(1));

// ---------- Render: sana ----------
function renderHeaderDate() {
  const input = document.getElementById("headerDate");
  input.value = viewingDate;
}

function shiftDate(days) {
  const d = parseDateKey(viewingDate);
  d.setDate(d.getDate() + days);
  viewingDate = toDateKey(d);
  cancelEdit();
  renderHeaderDate();
  renderAll();
}

document.getElementById("prevDay").addEventListener("click", () => shiftDate(-1));
document.getElementById("nextDay").addEventListener("click", () => shiftDate(1));
document.getElementById("headerDate").addEventListener("change", (e) => {
  viewingDate = e.target.value;
  cancelEdit();
  renderAll();
});
document.getElementById("cancelEdit").addEventListener("click", cancelEdit);

// ---------- Umumiy render ----------
function renderAll() {
  renderHero();
  renderTaskList();
  renderChart();
}

// ---------- Form hodisalari ----------
document.querySelectorAll(".cat-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".cat-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedCategory = btn.dataset.cat;
  });
});

document.getElementById("taskForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = document.getElementById("taskTitle").value.trim();
  const start = document.getElementById("taskStart").value;
  const end = document.getElementById("taskEnd").value;
  if (!title || !start || !end) return;

  if (editingId) {
    updateTask(editingId, { title, start, end, category: selectedCategory });
  } else {
    addTask({
      id: crypto.randomUUID(),
      title,
      start,
      end,
      category: selectedCategory,
    });
  }

  cancelEdit();
  renderAll();
});

// ---------- Ishga tushirish ----------
renderHeaderDate();
renderChartRange();
renderAll();
