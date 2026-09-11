// store.js -- localStorage persistence, one module, one key.
//
// Every mutation writes through synchronously. There is no debounce and no
// in-memory-only state, which is what makes the app survive the phone locking,
// Safari evicting the tab, and app-switching mid-set.

import { SEED } from './generated/seed.js';
import { ROUTINE, planFor, nextDay } from './routine.js';
import { annotateAllPRs, sortSessions, todayISO } from './calc.js';

export const STORAGE_KEY = 'workoutTracker.v1';
export const SCHEMA_VERSION = 1;

const listeners = new Set();
let state = null;

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

function emptyState() {
  return {
    version: SCHEMA_VERSION,
    athlete: { name: 'Bobby Magee' },
    sessions: [],
    active: null,
    settings: {
      barWeight: 45,
      seedVersion: null,
      lastBackup: null,
    },
  };
}

function seedSessions() {
  // Deep clone so the embedded seed is never mutated by PR annotation.
  return JSON.parse(JSON.stringify(SEED.sessions || []));
}

export function load() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[store] localStorage unavailable:', err);
  }

  if (!raw) {
    state = emptyState();
    state.sessions = seedSessions();
    state.settings.seedVersion = SEED.generatedAt || 'unknown';
    persist();
  } else {
    try {
      state = migrate(JSON.parse(raw));
    } catch (err) {
      console.error('[store] corrupt state, starting fresh:', err);
      state = emptyState();
      state.sessions = seedSessions();
      state.settings.seedVersion = SEED.generatedAt || 'unknown';
      persist();
    }
  }

  annotateAllPRs(sessionsWithActive());
  return state;
}

function migrate(s) {
  if (!s || typeof s !== 'object') throw new Error('not an object');
  const base = emptyState();
  const out = {
    ...base,
    ...s,
    athlete: { ...base.athlete, ...(s.athlete || {}) },
    settings: { ...base.settings, ...(s.settings || {}) },
  };
  out.version = SCHEMA_VERSION;
  if (!Array.isArray(out.sessions)) out.sessions = [];
  return out;
}

export function getState() {
  if (!state) load();
  return state;
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    // Quota or private-mode failure. Loud, because silent data loss at the gym
    // is the worst possible failure for this app.
    console.error('[store] SAVE FAILED', err);
    window.dispatchEvent(new CustomEvent('wt:save-error', { detail: err }));
  }
}

export function commit() {
  // The active session has to be in the pass too, or sets logged during a
  // workout never get their trophy until the session is finished.
  annotateAllPRs(sessionsWithActive());
  persist();
  for (const fn of listeners) fn(state);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

export function allSessions() {
  return getState().sessions;
}

/** Completed sessions plus the in-progress one, for PR/"last time" lookups. */
export function sessionsWithActive() {
  const s = getState();
  return s.active ? [...s.sessions, s.active] : s.sessions;
}

export function getSession(id) {
  return getState().sessions.find((s) => s.id === id) || null;
}

export function lastLoggedDay() {
  const app = sortSessions(getState().sessions).filter((s) => s.day);
  return app.length ? app[app.length - 1] : null;
}

export function suggestedDay() {
  const last = lastLoggedDay();
  return nextDay(last ? last.day : null);
}

export function activeSession() {
  return getState().active;
}

// ---------------------------------------------------------------------------
// Session lifecycle
// ---------------------------------------------------------------------------

function makeId(date, day) {
  const base = `${date}-${day}`;
  const existing = getState().sessions.filter((s) => s.id === base || s.id.startsWith(base + '-'));
  return existing.length ? `${base}-${existing.length + 1}` : base;
}

export function startSession(day) {
  const plan = planFor(day);
  if (!plan) throw new Error('unknown day ' + day);
  const date = todayISO();
  const s = {
    id: makeId(date, day),
    date,
    day,
    title: plan.title,
    source: 'app',
    startTime: new Date().toISOString(),
    endTime: null,
    warmupCompleted: false,
    warmupChecks: [],
    notes: '',
    exercises: plan.exercises.map((ex, i) => ({
      name: ex.name,
      slot: i,
      sets: [],
    })),
    cursor: 0,
  };
  getState().active = s;
  commit();
  return s;
}

export function updateActive(mutator) {
  const s = getState();
  if (!s.active) return null;
  mutator(s.active);
  commit();
  return s.active;
}

export function discardActive() {
  getState().active = null;
  commit();
}

export function finishActive() {
  const s = getState();
  if (!s.active) return null;
  const done = s.active;
  done.endTime = new Date().toISOString();
  // Drop exercises that were never touched so the history stays honest.
  done.exercises = done.exercises.filter((e) => (e.sets || []).length > 0);
  delete done.cursor;
  s.sessions.push(done);
  s.active = null;
  commit();
  return done;
}

export function deleteSession(id) {
  const s = getState();
  s.sessions = s.sessions.filter((x) => x.id !== id);
  commit();
}

// ---------------------------------------------------------------------------
// Set logging
// ---------------------------------------------------------------------------

export function logSet(slot, { weight, reps, rir = null, warmup = false }) {
  const s = getState();
  if (!s.active) return null;
  const ex = s.active.exercises.find((e) => e.slot === slot);
  if (!ex) return null;
  const set = {
    setNum: ex.sets.length + 1,
    weight: weight === '' || weight == null ? null : Number(weight),
    reps: Number(reps),
    rir: rir == null || rir === '' ? null : Number(rir),
    warmup: !!warmup,
    prFlags: [],
    timestamp: new Date().toISOString(),
  };
  ex.sets.push(set);
  commit();
  return set;
}

export function deleteSet(slot, index) {
  const s = getState();
  if (!s.active) return;
  const ex = s.active.exercises.find((e) => e.slot === slot);
  if (!ex || !ex.sets[index]) return;
  ex.sets.splice(index, 1);
  ex.sets.forEach((set, i) => { set.setNum = i + 1; });
  commit();
}

export function renameActiveExercise(slot, name) {
  updateActive((a) => {
    const ex = a.exercises.find((e) => e.slot === slot);
    if (ex) ex.name = name;
  });
}

export function setActiveCursor(i) {
  updateActive((a) => { a.cursor = i; });
}

export function setActiveNotes(text) {
  updateActive((a) => { a.notes = text; });
}

export function setSessionNotes(id, text) {
  const s = getSession(id);
  if (!s) return;
  s.notes = text;
  commit();
}

export function toggleWarmup(index) {
  updateActive((a) => {
    a.warmupChecks = a.warmupChecks || [];
    a.warmupChecks[index] = !a.warmupChecks[index];
  });
}

export function markWarmupDone() {
  updateActive((a) => { a.warmupCompleted = true; });
}

// ---------------------------------------------------------------------------
// Export / import
// ---------------------------------------------------------------------------

export function exportPayload() {
  const s = getState();
  return {
    schema: SCHEMA_VERSION,
    app: 'workout-tracker',
    exportedAt: new Date().toISOString(),
    athlete: s.athlete,
    routine: ROUTINE,
    sessions: s.sessions,
    active: s.active,
    settings: s.settings,
  };
}

export function exportCSV() {
  const rows = [[
    'date', 'day', 'session_id', 'exercise', 'set', 'weight_lb', 'reps',
    'rir', 'warmup', 'e1rm', 'volume_lb', 'pr_flags',
  ]];
  for (const s of sortSessions(getState().sessions)) {
    for (const ex of s.exercises || []) {
      for (const set of ex.sets || []) {
        const w = Number(set.weight) || 0;
        const r = Number(set.reps) || 0;
        const est = r >= 1 && w ? Math.round(w * (1 + r / 30) * 10) / 10 : '';
        rows.push([
          s.date, s.day || s.legacyLabel || '', s.id, ex.name, set.setNum,
          set.weight ?? '', set.reps ?? '', set.rir ?? '',
          set.warmup ? '1' : '0', est, set.warmup ? 0 : Math.round(w * r),
          (set.prFlags || []).join('|'),
        ]);
      }
    }
  }
  return rows
    .map((r) => r.map((c) => {
      const v = String(c ?? '');
      return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    }).join(','))
    .join('\n');
}

export function importPayload(payload, { mode = 'merge' } = {}) {
  if (!payload || !Array.isArray(payload.sessions)) {
    throw new Error('Not a workout tracker export (no sessions array).');
  }
  const s = getState();
  if (mode === 'replace') {
    s.sessions = [];
  }
  const byId = new Map(s.sessions.map((x) => [x.id, x]));
  let added = 0;
  let replaced = 0;
  for (const inc of payload.sessions) {
    if (!inc || !inc.id || !inc.date) continue;
    if (byId.has(inc.id)) { replaced += 1; } else { added += 1; }
    byId.set(inc.id, inc);
  }
  s.sessions = sortSessions([...byId.values()]);
  if (payload.settings) s.settings = { ...s.settings, ...payload.settings };
  commit();
  return { added, replaced, total: s.sessions.length };
}

export function markBackedUp() {
  getState().settings.lastBackup = new Date().toISOString();
  commit();
}

/** Re-apply the shipped seed history without touching sessions logged here. */
export function reseed() {
  return importPayload({ sessions: seedSessions() }, { mode: 'merge' });
}

export function wipeAll() {
  state = emptyState();
  state.sessions = seedSessions();
  state.settings.seedVersion = SEED.generatedAt || 'unknown';
  commit();
}

export const SEED_INFO = {
  generatedAt: SEED.generatedAt,
  source: SEED.source,
  cutoff: SEED.cutoff,
  stats: SEED.stats,
  renamed: SEED.renamed,
};
