// Body Composition Tracker — IndexedDB layer
// Single global: window.BCDB
//
// Schema (object stores):
//   workouts        keyPath 'id'          — { id, date, start, end, duration_min, name, rpe, notes, exercises[] }
//   exercise_lib    keyPath 'name'        — { name, kind, last_used, usage_count }
//   weighins        keyPath 'id'          — { id, date, weight_lb, bf_pct, waist_in, source, notes }  (reserved for later)
//   meta            keyPath 'key'         — generic key/value (settings)
//
// All timestamps are ISO YYYY-MM-DD (date) or HH:MM (time-of-day).
// IDs are crypto.randomUUID().

(function () {
  const DB_NAME = 'body-comp';
  const DB_VERSION = 1;

  let _dbPromise = null;

  function openDB() {
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = req.result;
        if (!db.objectStoreNames.contains('workouts')) {
          const s = db.createObjectStore('workouts', { keyPath: 'id' });
          s.createIndex('by_date', 'date');
        }
        if (!db.objectStoreNames.contains('exercise_lib')) {
          db.createObjectStore('exercise_lib', { keyPath: 'name' });
        }
        if (!db.objectStoreNames.contains('weighins')) {
          const s = db.createObjectStore('weighins', { keyPath: 'id' });
          s.createIndex('by_date', 'date');
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return _dbPromise;
  }

  function tx(stores, mode) {
    return openDB().then((db) => {
      const t = db.transaction(stores, mode);
      const result = {};
      stores.forEach((s) => { result[s] = t.objectStore(s); });
      result._tx = t;
      result._done = new Promise((res, rej) => {
        t.oncomplete = () => res();
        t.onerror = () => rej(t.error);
        t.onabort = () => rej(t.error || new Error('tx aborted'));
      });
      return result;
    });
  }

  function reqAsPromise(req) {
    return new Promise((res, rej) => {
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  }

  function uuid() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    // Fallback (older browsers)
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  // Epley formula
  function e1rm(weight, reps) {
    if (!weight || !reps || reps < 1) return null;
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30));
  }

  // ---------- Workouts ----------

  async function saveWorkout(workout) {
    if (!workout.id) workout.id = uuid();
    if (!workout.date) throw new Error('workout.date required');
    delete workout._repeated_from; // strip ephemeral UI hint before persisting
    workout.exercises = (workout.exercises || []).map((ex) => ({
      name: ex.name.trim(),
      kind: ex.kind || 'weighted',
      sets: (ex.sets || []).filter((s) =>
        (s.weight != null && s.reps != null) ||
        (s.reps != null && (ex.kind === 'reps' || ex.kind === 'weighted')) ||
        (s.seconds != null && ex.kind === 'time')
      ),
    })).filter((ex) => ex.name && ex.sets.length > 0);

    workout.updated_at = new Date().toISOString();

    const t = await tx(['workouts', 'exercise_lib'], 'readwrite');
    await reqAsPromise(t.workouts.put(workout));

    // Update exercise library
    for (const ex of workout.exercises) {
      const existing = await reqAsPromise(t.exercise_lib.get(ex.name));
      const entry = existing || { name: ex.name, kind: ex.kind, usage_count: 0, last_used: workout.date };
      entry.kind = ex.kind || entry.kind;
      entry.usage_count = (entry.usage_count || 0) + 1;
      if (!entry.last_used || workout.date > entry.last_used) entry.last_used = workout.date;
      await reqAsPromise(t.exercise_lib.put(entry));
    }
    await t._done;
    return workout.id;
  }

  async function getWorkout(id) {
    const t = await tx(['workouts'], 'readonly');
    return reqAsPromise(t.workouts.get(id));
  }

  async function deleteWorkout(id) {
    const t = await tx(['workouts'], 'readwrite');
    await reqAsPromise(t.workouts.delete(id));
    await t._done;
  }

  async function listWorkouts({ limit = 100, descending = true } = {}) {
    const t = await tx(['workouts'], 'readonly');
    const all = await reqAsPromise(t.workouts.getAll());
    all.sort((a, b) => {
      if (a.date === b.date) return (b.updated_at || '').localeCompare(a.updated_at || '');
      return descending ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
    });
    return all.slice(0, limit);
  }

  // ---------- Exercise library ----------

  async function getExerciseLibrary() {
    const t = await tx(['exercise_lib'], 'readonly');
    const all = await reqAsPromise(t.exercise_lib.getAll());
    all.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));
    return all;
  }

  // Return recent sessions where this exercise appears.
  // Returns array of { date, workout_id, workout_name, sets, best_e1rm } newest first.
  async function getExerciseHistory(name, limit = 5) {
    if (!name) return [];
    const all = await listWorkouts({ limit: 500, descending: true });
    const target = name.trim().toLowerCase();
    const out = [];
    for (const w of all) {
      const ex = (w.exercises || []).find((e) => (e.name || '').trim().toLowerCase() === target);
      if (!ex) continue;
      let best = null;
      for (const s of ex.sets) {
        const v = e1rm(s.weight, s.reps);
        if (v && (best == null || v > best)) best = v;
      }
      out.push({
        date: w.date,
        workout_id: w.id,
        workout_name: w.name,
        kind: ex.kind,
        sets: ex.sets,
        best_e1rm: best,
      });
      if (out.length >= limit) break;
    }
    return out;
  }

  // Build a blank-but-prefilled workout from an existing one. Caller should pass it to saveWorkout to commit.
  async function duplicateWorkout(id, { newDate } = {}) {
    const src = await getWorkout(id);
    if (!src) throw new Error('workout not found');
    return {
      // no id — will be assigned on save
      _repeated_from: src.id, // ephemeral; saveWorkout strips this before persisting
      date: newDate || new Date().toISOString().slice(0, 10),
      start: '',
      end: '',
      duration_min: null,
      name: src.name,
      rpe: '',
      notes: '',
      exercises: (src.exercises || []).map((ex) => ({
        name: ex.name,
        kind: ex.kind,
        sets: (ex.sets || []).map((s) => ({ ...s })),
      })),
    };
  }

  async function upsertExercise(name, kind) {
    const t = await tx(['exercise_lib'], 'readwrite');
    const existing = await reqAsPromise(t.exercise_lib.get(name));
    const entry = existing || { name, kind, usage_count: 0, last_used: null };
    if (kind) entry.kind = kind;
    await reqAsPromise(t.exercise_lib.put(entry));
    await t._done;
  }

  // ---------- Weigh-ins (reserved) ----------

  async function saveWeighIn(w) {
    if (!w.id) w.id = uuid();
    const t = await tx(['weighins'], 'readwrite');
    await reqAsPromise(t.weighins.put(w));
    await t._done;
    return w.id;
  }

  async function listWeighIns() {
    const t = await tx(['weighins'], 'readonly');
    const all = await reqAsPromise(t.weighins.getAll());
    all.sort((a, b) => b.date.localeCompare(a.date));
    return all;
  }

  // ---------- Settings / meta ----------

  async function getSetting(key, fallback = null) {
    const t = await tx(['meta'], 'readonly');
    const row = await reqAsPromise(t.meta.get(key));
    return row ? row.value : fallback;
  }

  async function setSetting(key, value) {
    const t = await tx(['meta'], 'readwrite');
    await reqAsPromise(t.meta.put({ key, value }));
    await t._done;
  }

  // ---------- Export / import ----------

  async function exportAll() {
    const t = await tx(['workouts', 'exercise_lib', 'weighins', 'meta'], 'readonly');
    const [workouts, exercise_lib, weighins, meta] = await Promise.all([
      reqAsPromise(t.workouts.getAll()),
      reqAsPromise(t.exercise_lib.getAll()),
      reqAsPromise(t.weighins.getAll()),
      reqAsPromise(t.meta.getAll()),
    ]);
    return {
      schema_version: 1,
      exported_at: new Date().toISOString(),
      workouts,
      exercise_lib,
      weighins,
      meta,
    };
  }

  async function importAll(payload, { mode = 'merge' } = {}) {
    if (!payload || !Array.isArray(payload.workouts)) {
      throw new Error('Invalid export payload');
    }
    const t = await tx(['workouts', 'exercise_lib', 'weighins', 'meta'], 'readwrite');
    if (mode === 'replace') {
      await reqAsPromise(t.workouts.clear());
      await reqAsPromise(t.exercise_lib.clear());
      await reqAsPromise(t.weighins.clear());
      await reqAsPromise(t.meta.clear());
    }
    for (const w of payload.workouts) await reqAsPromise(t.workouts.put(w));
    for (const e of (payload.exercise_lib || [])) await reqAsPromise(t.exercise_lib.put(e));
    for (const w of (payload.weighins || [])) await reqAsPromise(t.weighins.put(w));
    for (const m of (payload.meta || [])) await reqAsPromise(t.meta.put(m));
    await t._done;
    return {
      workouts: payload.workouts.length,
      exercise_lib: (payload.exercise_lib || []).length,
      weighins: (payload.weighins || []).length,
    };
  }

  function downloadJSON(filename, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
  }

  window.BCDB = {
    open: openDB,
    uuid,
    e1rm,
    saveWorkout, getWorkout, deleteWorkout, listWorkouts,
    getExerciseLibrary, upsertExercise, getExerciseHistory,
    duplicateWorkout,
    saveWeighIn, listWeighIns,
    getSetting, setSetting,
    exportAll, importAll, downloadJSON,
  };
})();
