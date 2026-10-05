import { CHECKED_ON, GAMES, ROWS, WAITING_GAMES } from "./data.mjs";
import { contribution, summarize, totals } from "./calc.mjs";

const STORAGE_KEY = "saitei-ishi-v1";
const game = GAMES[0];
const rows = ROWS.filter((item) => item.game === game.id);
const store = { state: loadState() };

const $ = (id) => document.getElementById(id);

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store.state));
}

function rowState(row) {
  return store.state[row.id] ?? {};
}

function choiceOf(row) {
  return rowState(row).choice ?? row.defaultChoice ?? "unset";
}

function formatWhen(iso, now) {
  if (!iso) return "";
  const diff = Date.parse(iso) - now.getTime();
  if (diff < 0) return "期間終了";
  const hours = Math.floor(diff / 3600000);
  if (hours < 48) return `残り ${hours} 時間`;
  return `残り ${Math.floor(hours / 24)} 日`;
}

function paintNumbers(now) {
  const view = totals(summarize(rows, store.state, now));
  $("minimum").textContent = String(view.minimum);
  $("with-conditions").textContent = String(view.withConditions);
  $("with-estimate").textContent = String(view.withEstimate);
}

function choiceButtons(row) {
  if (row.mode === "perDay" || row.bucket === "reference") return "";
  const choice = choiceOf(row);
  const options = [
    ["todo", "まだ取る"],
    ["done", "もう取った"],
    ["skip", "入れない"],
  ];
  return `<div class="choices" role="group" aria-label="${row.title}の扱い">
    ${options
      .map(
        ([value, label]) =>
          `<button type="button" data-choice="${value}" aria-pressed="${choice === value}">${label}</button>`,
      )
      .join("")}
  </div>`;
}

function daysField(row) {
  if (row.mode !== "perDay") return "";
  const days = Math.max(0, Math.floor(Number(rowState(row).days) || 0));
  return `<label class="days">在庫で作れる日数
    <input type="number" min="0" max="31" step="1" inputmode="numeric" value="${days}" aria-label="かけらでオーブを作れる日数">
  </label>`;
}

function links(row) {
  const extra = row.extraSourceUrl
    ? ` / <a href="${row.extraSourceUrl}">${row.extraSourceLabel}</a>`
    : "";
  return `<a href="${row.sourceUrl}">${row.sourceLabel}</a>${extra}`;
}

function statusText(row, now) {
  const part = contribution(row, { ...rowState(row), choice: choiceOf(row) }, now);
  const counted = part.minimum + part.conditional + part.estimate;
  if (part.closed) return "期間終了";
  if (part.notStarted) return "まだ始まっていない";
  if (counted > 0) return `いまの合計に ${counted} 個入っている`;
  return "いまの最低には入っていない";
}

function renderRow(row, now) {
  const amount = row.mode === "perDay" ? "1日 1" : String(row.orbs);
  return `<article class="row" data-id="${row.id}" data-bucket="${row.bucket}">
    <div class="row-top">
      <h3>${row.title}</h3>
      <p class="orbs">${amount}<span>個</span></p>
    </div>
    <p class="window">${row.windowLabel}${row.endsAt ? ` ・ ${formatWhen(row.endsAt, now)}` : ""}</p>
    <p class="note">${row.note}</p>
    <p class="meta">${links(row)} ・ 確認 ${CHECKED_ON}</p>
    <p class="status">${statusText(row, now)}</p>
    ${daysField(row)}
    ${choiceButtons(row)}
  </article>`;
}

function renderLists(now) {
  const fill = (id, bucket) => {
    $(id).innerHTML = rows
      .filter((row) => row.bucket === bucket)
      .map((row) => renderRow(row, now))
      .join("");
  };
  fill("minimum-list", "minimum");
  fill("conditional-list", "conditional");
  fill("estimate-list", "estimate");
  fill("reference-list", "reference");
}

function refreshStatuses(now) {
  for (const row of rows) {
    const node = document.querySelector(`[data-id="${row.id}"] .status`);
    if (node) node.textContent = statusText(row, now);
    const choice = choiceOf(row);
    document.querySelectorAll(`[data-id="${row.id}"] [data-choice]`).forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.choice === choice));
    });
  }
}

function render(now) {
  $("checked-on").textContent = CHECKED_ON;
  $("waiting").textContent = WAITING_GAMES.join("、");
  paintNumbers(now);
  renderLists(now);
}

const now = new Date();
render(now);

document.body.addEventListener("click", (event) => {
  const button = event.target.closest("[data-choice]");
  if (!button) return;
  const id = button.closest("[data-id]").dataset.id;
  const row = rows.find((item) => item.id === id);
  store.state[id] = { ...rowState(row), choice: button.dataset.choice };
  saveState();
  paintNumbers(now);
  refreshStatuses(now);
});

document.body.addEventListener("input", (event) => {
  const input = event.target.closest("input[type='number']");
  if (!input) return;
  const id = input.closest("[data-id]").dataset.id;
  const days = Math.max(0, Math.min(31, Math.floor(Number(input.value) || 0)));
  store.state[id] = { choice: days > 0 ? "todo" : "unset", days };
  saveState();
  paintNumbers(now);
  refreshStatuses(now);
});

$("reset").addEventListener("click", () => {
  store.state = {};
  localStorage.removeItem(STORAGE_KEY);
  render(now);
});
