// Saved-state helpers. The storage key and shape are unchanged ("saitei-ishi-v1": { [rowId]: { choice, days } }).

const CHOICES = new Set(["todo", "done", "skip", "unset"]);

/** Parses the saved JSON; anything that is not a plain object becomes {} so the page cannot crash. */
export function parseState(raw) {
  if (!raw) return {};
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const clean = {};
  for (const [id, entry] of Object.entries(data)) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const next = {};
    if (CHOICES.has(entry.choice)) next.choice = entry.choice;
    if (entry.days !== undefined) next.days = clampDays(entry.days);
    clean[id] = next;
  }
  return clean;
}

export function clampDays(value) {
  return Math.max(0, Math.min(31, Math.floor(Number(value) || 0)));
}

/** Escapes text placed into innerHTML templates. */
export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
