// calc.js -- pure math. No DOM, no storage. Everything here is deterministic
// and recomputed from the full set log, so a bad flag can never get baked in.

import { ROUTINE_EXERCISES, topOfRange } from './routine.js';

// ---------------------------------------------------------------------------
// Epley
// ---------------------------------------------------------------------------

export function e1rm(weight, reps) {
  const w = Number(weight);
  const r = Number(reps);
  if (!w || !r || r < 1) return null;
  if (r === 1) return w;
  return w * (1 + r / 30);
}

export function round1(n) {
  return n == null ? null : Math.round(n * 10) / 10;
}

export function fmtWeight(w) {
  if (w == null || w === '') return '–';
  const n = Number(w);
  return Number.isInteger(n) ? String(n) : String(round1(n));
}

// ---------------------------------------------------------------------------
// Load sense: for assisted movements a *lower* load is the better performance.
// ---------------------------------------------------------------------------

export function loadSenseFor(name) {
  const ex = ROUTINE_EXERCISES.get(name);
  if (ex && ex.loadSense) return ex.loadSense;
  return /assisted/i.test(name || '') ? 'assist' : 'normal';
}

// ---------------------------------------------------------------------------
// PR detection
//
// A "record" is the state of an exercise's history at a point in time.
// detectPRs compares one set against that state; advanceRecord folds the set in.
// Walking the whole log chronologically with these two gives every set its
// flags, and history and live logging share one code path.
// ---------------------------------------------------------------------------

export function blankRecord() {
  return {
    maxWeight: null,     // heaviest load ever moved for >= 1 rep
    minWeight: null,     // lightest assist ever (assist-sense lifts)
    maxE1rm: null,
    repsAtWeight: new Map(),  // weight -> most reps ever at exactly that weight
    bestSet: null,       // { weight, reps, e1rm, date }
    sessions: 0,
  };
}

// A set only counts toward records if it is a real working set with reps.
export function countsForPR(set) {
  return !set.warmup && Number(set.reps) > 0;
}

export function detectPRs(rec, set, sense = 'normal') {
  if (!countsForPR(set)) return [];
  const w = set.weight == null || set.weight === '' ? null : Number(set.weight);
  const r = Number(set.reps);
  const est = e1rm(w, r);
  const flags = [];

  // The very first time a lift is performed there is nothing to beat. Flagging
  // it would hand out a trophy for every new exercise on the routine, which is
  // noise exactly when the real PRs matter most.
  const hasHistory = rec.maxWeight != null || rec.maxE1rm != null;
  if (!hasHistory) return [];

  if (sense === 'assist') {
    // Less assist at a real rep count is the progress signal; more reps at the
    // same assist is the other. Epley on an assist load is meaningless.
    if (w != null && rec.minWeight != null && w < rec.minWeight && r >= 5) {
      flags.push('assist');
    }
  } else if (w != null && rec.maxWeight != null && w > rec.maxWeight) {
    flags.push('weight');
  }

  if (w != null) {
    const prev = rec.repsAtWeight.get(w);
    // Only a rep PR if this load has been worked before -- a brand new load
    // setting a "rep record" of its own is noise.
    if (prev != null && r > prev) flags.push('reps');
  }

  if (sense !== 'assist' && est != null && (rec.maxE1rm == null || est > rec.maxE1rm + 1e-9)) {
    flags.push('e1rm');
  }

  return flags;
}

export function advanceRecord(rec, set, date) {
  if (!countsForPR(set)) return rec;
  const w = set.weight == null || set.weight === '' ? null : Number(set.weight);
  const r = Number(set.reps);
  const est = e1rm(w, r);

  if (w != null) {
    if (rec.maxWeight == null || w > rec.maxWeight) rec.maxWeight = w;
    // A logged 0 means "no load recorded" (band assistance, bodyweight), not a
    // zero-assist record -- counting it would make the assist PR unbeatable.
    if (w > 0 && (rec.minWeight == null || w < rec.minWeight)) rec.minWeight = w;
    const prev = rec.repsAtWeight.get(w);
    if (prev == null || r > prev) rec.repsAtWeight.set(w, r);
  }
  if (est != null && (rec.maxE1rm == null || est > rec.maxE1rm)) {
    rec.maxE1rm = est;
    rec.bestSet = { weight: w, reps: r, e1rm: est, date };
  }
  return rec;
}

export const PR_LABEL = {
  weight: 'W-PR',
  reps: 'R-PR',
  e1rm: 'e1RM-PR',
  assist: 'A-PR',
};

export const PR_TITLE = {
  weight: 'Weight PR — heaviest ever on this lift',
  reps: 'Rep PR — most reps ever at this load',
  e1rm: 'e1RM PR — best estimated 1RM ever',
  assist: 'Assist PR — least assistance ever',
};

// ---------------------------------------------------------------------------
// Whole-log pass
// ---------------------------------------------------------------------------

export function sortSessions(sessions) {
  return [...sessions].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return String(a.startTime || '').localeCompare(String(b.startTime || ''));
  });
}

/**
 * Walk every session in date order and stamp prFlags on every set.
 * Mutates the sets in place and returns a Map of name -> final record.
 */
export function annotateAllPRs(sessions) {
  const records = new Map();
  for (const s of sortSessions(sessions)) {
    for (const ex of s.exercises || []) {
      const sense = loadSenseFor(ex.name);
      let rec = records.get(ex.name);
      if (!rec) { rec = blankRecord(); records.set(ex.name, rec); }
      for (const set of ex.sets || []) {
        set.prFlags = detectPRs(rec, set, sense);
        advanceRecord(rec, set, s.date);
      }
      rec.sessions += 1;
    }
  }
  return records;
}

/** The record state for one exercise, considering only history strictly before
 *  `beforeSessionId` (plus every set of that session already logged). */
export function recordFor(sessions, name, { beforeSessionId = null } = {}) {
  const rec = blankRecord();
  for (const s of sortSessions(sessions)) {
    if (beforeSessionId && s.id === beforeSessionId) break;
    for (const ex of s.exercises || []) {
      if (ex.name !== name) continue;
      rec.sessions += 1;
      for (const set of ex.sets || []) advanceRecord(rec, set, s.date);
    }
  }
  return rec;
}

// ---------------------------------------------------------------------------
// Volume & session stats
// ---------------------------------------------------------------------------

export function setVolume(set) {
  if (set.warmup) return 0;
  const w = Number(set.weight) || 0;
  const r = Number(set.reps) || 0;
  return w * r;
}

export function sessionStats(session) {
  let volume = 0;
  let working = 0;
  let warmup = 0;
  const prs = [];
  for (const ex of session.exercises || []) {
    for (const set of ex.sets || []) {
      if (set.warmup) { warmup += 1; continue; }
      working += 1;
      volume += setVolume(set);
      for (const f of set.prFlags || []) {
        prs.push({ exercise: ex.name, type: f, weight: set.weight, reps: set.reps });
      }
    }
  }
  return {
    volume: Math.round(volume),
    workingSets: working,
    warmupSets: warmup,
    prs,
    durationMin: durationMin(session),
  };
}

export function durationMin(session) {
  if (!session.startTime || !session.endTime) return null;
  const a = new Date(session.startTime).getTime();
  const b = new Date(session.endTime).getTime();
  if (!isFinite(a) || !isFinite(b) || b < a) return null;
  return Math.round((b - a) / 60000);
}

// ---------------------------------------------------------------------------
// Per-exercise series for the charts
// ---------------------------------------------------------------------------

/** One point per session containing this exercise, oldest first. */
export function exerciseSeries(sessions, name) {
  const pts = [];
  for (const s of sortSessions(sessions)) {
    const ex = (s.exercises || []).find((e) => e.name === name);
    if (!ex) continue;
    const working = (ex.sets || []).filter((x) => !x.warmup && Number(x.reps) > 0);
    if (!working.length) continue;

    let topE1rm = null;
    let bestWeight = null;
    let volume = 0;
    let hasPR = false;
    for (const set of working) {
      const est = e1rm(set.weight, set.reps);
      if (est != null && (topE1rm == null || est > topE1rm)) topE1rm = est;
      const w = set.weight == null ? null : Number(set.weight);
      if (w != null && (bestWeight == null || w > bestWeight)) bestWeight = w;
      volume += setVolume(set);
      if ((set.prFlags || []).length) hasPR = true;
    }
    pts.push({
      date: s.date,
      sessionId: s.id,
      e1rm: topE1rm == null ? null : round1(topE1rm),
      weight: bestWeight,
      volume: Math.round(volume),
      sets: working.length,
      hasPR,
    });
  }
  return pts;
}

/** Every exercise that appears anywhere in the log, with a little summary. */
export function exerciseIndex(sessions) {
  const map = new Map();
  for (const s of sortSessions(sessions)) {
    for (const ex of s.exercises || []) {
      let row = map.get(ex.name);
      if (!row) {
        row = { name: ex.name, sessions: 0, lastDate: null, bestE1rm: null, bestWeight: null };
        map.set(ex.name, row);
      }
      row.sessions += 1;
      row.lastDate = s.date;
      for (const set of ex.sets || []) {
        if (set.warmup) continue;
        const est = e1rm(set.weight, set.reps);
        if (est != null && (row.bestE1rm == null || est > row.bestE1rm)) row.bestE1rm = est;
        const w = set.weight == null ? null : Number(set.weight);
        if (w != null && (row.bestWeight == null || w > row.bestWeight)) row.bestWeight = w;
      }
    }
  }
  return [...map.values()].sort((a, b) => (a.name < b.name ? -1 : 1));
}

// ---------------------------------------------------------------------------
// Last time / progressive overload
// ---------------------------------------------------------------------------

/** The most recent session (before `excludeId`) that contains this exercise. */
export function lastPerformance(sessions, name, excludeId = null) {
  const ordered = sortSessions(sessions);
  for (let i = ordered.length - 1; i >= 0; i--) {
    const s = ordered[i];
    if (excludeId && s.id === excludeId) continue;
    const ex = (s.exercises || []).find((e) => e.name === name);
    if (!ex) continue;
    const sets = (ex.sets || []).filter((x) => Number(x.reps) > 0);
    if (!sets.length) continue;
    return { date: s.date, sessionId: s.id, sets, legacyLabel: s.legacyLabel || null };
  }
  return null;
}

/**
 * Progressive-overload prompt.
 *
 * Hard rule (spec 3): main lift + top of the rep range on the top set +
 * self-reported RIR <= 1  ->  suggest a load bump (+2.5 lb on pressing lifts
 * the user opted into via routine.smallStep, +5 lb otherwise).
 *
 * Soft copy: top of the range with no RIR logged -> a nudge, no number.
 */
export function overloadSuggestion(exMeta, last) {
  if (!last || !exMeta) return null;
  const top = topOfRange(exMeta);
  if (top == null) return null;

  const working = last.sets.filter((s) => !s.warmup);
  if (!working.length) return null;

  // The top set = the heaviest working set of that session.
  let topSet = working[0];
  for (const s of working) {
    if ((Number(s.weight) || 0) > (Number(topSet.weight) || 0)) topSet = s;
  }
  if (Number(topSet.reps) < top) return null;

  const step = exMeta.smallStep ? 2.5 : (exMeta.increment || 5);
  const rir = topSet.rir;
  const base = Number(topSet.weight);

  if (rir != null && rir <= 1 && isFinite(base)) {
    return {
      kind: 'hard',
      step,
      suggested: round1(base + step),
      text: `Last time you hit ${fmtWeight(base)} × ${topSet.reps} at RIR ${rir === 0 ? '0' : rir}. Go +${fmtWeight(step)} lb.`,
    };
  }
  return {
    kind: 'soft',
    step,
    suggested: isFinite(base) ? round1(base + step) : null,
    text: `You hit the top of the range last time (${fmtWeight(base)} × ${topSet.reps}). Consider +${fmtWeight(step)} lb.`,
  };
}

// ---------------------------------------------------------------------------
// Warmup ramp
// ---------------------------------------------------------------------------

export const RAMP_STEPS = [
  { pct: 0.40, reps: 5 },
  { pct: 0.60, reps: 3 },
  { pct: 0.75, reps: 2 },
  { pct: 0.90, reps: 1 },
];

/** Round to the nearest loadable barbell weight (5 lb jumps, 45 lb bar floor). */
export function roundToPlate(w, barWeight = 45) {
  const r = Math.round(w / 5) * 5;
  return Math.max(barWeight, r);
}

export function warmupRamp(targetWeight, { barWeight = 45 } = {}) {
  const t = Number(targetWeight);
  if (!t || t <= 0) return [];
  return RAMP_STEPS.map((s) => ({
    pct: s.pct,
    reps: s.reps,
    weight: roundToPlate(t * s.pct, barWeight),
  })).filter((s, i, arr) => i === 0 || s.weight > arr[i - 1].weight);
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

export function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function fmtDateLong(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export function daysBetween(aIso, bIso) {
  if (!aIso || !bIso) return null;
  const a = new Date(aIso + 'T00:00:00').getTime();
  const b = new Date(bIso + 'T00:00:00').getTime();
  return Math.round((b - a) / 86400000);
}
