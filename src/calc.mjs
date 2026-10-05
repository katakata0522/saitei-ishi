export function contribution(row, state, now) {
  const choice = state?.choice ?? row.defaultChoice ?? "unset";
  const closed = Boolean(row.endsAt) && now.getTime() > Date.parse(row.endsAt);
  const notStarted = Boolean(row.startsAt) && now.getTime() < Date.parse(row.startsAt);
  const empty = { minimum: 0, conditional: 0, estimate: 0, active: false, closed, notStarted };

  if (row.bucket === "reference") return empty;
  if (closed || notStarted || choice !== "todo") return empty;

  if (row.mode === "perDay") {
    const days = Math.max(0, Math.floor(Number(state?.days) || 0));
    return { minimum: 0, conditional: days, estimate: 0, active: days > 0, closed, notStarted };
  }

  const orbs = row.orbs;
  if (row.bucket === "minimum") {
    return { minimum: orbs, conditional: 0, estimate: 0, active: true, closed, notStarted };
  }
  if (row.bucket === "conditional") {
    return { minimum: 0, conditional: orbs, estimate: 0, active: true, closed, notStarted };
  }
  if (row.bucket === "estimate") {
    return { minimum: 0, conditional: 0, estimate: orbs, active: true, closed, notStarted };
  }
  return empty;
}

export function summarize(rows, states, now) {
  return rows.reduce(
    (acc, row) => {
      const part = contribution(row, states[row.id], now);
      acc.minimum += part.minimum;
      acc.conditional += part.conditional;
      acc.estimate += part.estimate;
      return acc;
    },
    { minimum: 0, conditional: 0, estimate: 0 },
  );
}

export function totals(summary) {
  return {
    minimum: summary.minimum,
    withConditions: summary.minimum + summary.conditional,
    withEstimate: summary.minimum + summary.conditional + summary.estimate,
  };
}
