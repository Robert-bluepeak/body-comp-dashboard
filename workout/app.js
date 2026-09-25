/* Workout Tracker -- bundled by build.py. Edit src/, not this file. */
(function () {
"use strict";

/* ---- js/dom.js ---- */
var __m_js_dom_js = (function () {
// dom.js -- the only place that touches document directly, besides views.

function h(tag, attrs, ...children) {
  const parts = tag.split(/(?=[.#])/);
  const el = document.createElement(parts[0] || 'div');
  for (const p of parts.slice(1)) {
    if (p[0] === '.') el.classList.add(p.slice(1));
    else if (p[0] === '#') el.id = p.slice(1);
  }
  if (attrs && (typeof attrs !== 'object' || Array.isArray(attrs) || attrs instanceof Node)) {
    children.unshift(attrs);
    attrs = null;
  }
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className += (el.className ? ' ' : '') + v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else if (k in el && k !== 'list' && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  add(el, children);
  return el;
}

function add(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false || c === '') continue;
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

const svg = (tag, attrs = {}, ...children) => {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false || c === '') continue;
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

function mount(el, ...children) {
  clear(el);
  add(el, children);
  return el;
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

let toastTimer = null;

function toast(message, { tone = 'info', ms = 2600 } = {}) {
  let host = $('#toast-host');
  if (!host) {
    host = h('div#toast-host');
    document.body.appendChild(host);
  }
  clear(host);
  host.appendChild(h('div', { class: `toast toast-${tone}`, role: 'status' }, message));
  host.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => host.classList.remove('show'), ms);
}

// ---------------------------------------------------------------------------
// Bottom sheet (used for notes, confirms, pickers)
// ---------------------------------------------------------------------------

function sheet({ title, body, actions = [] }) {
  const overlay = h('div.sheet-overlay', {
    onclick: (e) => { if (e.target === overlay) close(); },
  });
  const close = () => {
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 180);
  };
  const panel = h('div.sheet',
    h('div.sheet-grip'),
    title ? h('h2.sheet-title', title) : null,
    h('div.sheet-body', body),
    actions.length
      ? h('div.sheet-actions', actions.map((a) =>
          h('button', {
            class: `btn ${a.variant || 'btn-ghost'}`,
            type: 'button',
            onclick: () => { const r = a.onClick ? a.onClick() : true; if (r !== false) close(); },
          }, a.label)))
      : null
  );
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));
  return { close, overlay, panel };
}

function confirmSheet(title, message, confirmLabel = 'Confirm') {
  return new Promise((resolve) => {
    let settled = false;
    const done = (v) => { if (!settled) { settled = true; resolve(v); } };
    const s = sheet({
      title,
      body: h('p.sheet-text', message),
      actions: [
        { label: 'Cancel', variant: 'btn-ghost', onClick: () => done(false) },
        { label: confirmLabel, variant: 'btn-danger', onClick: () => done(true) },
      ],
    });
    s.overlay.addEventListener('click', (e) => { if (e.target === s.overlay) done(false); });
  });
}

// ---------------------------------------------------------------------------
// Download
// ---------------------------------------------------------------------------

function download(filename, text, mime = 'application/json') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 0);
}

function haptic(ms = 12) {
  if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (_) { /* ignore */ } }
}
  return { h: h, clear: clear, mount: mount, toast: toast, sheet: sheet, confirmSheet: confirmSheet, download: download, haptic: haptic, svg: svg, $: $, $$: $$ };
})();

/* ---- js/generated/seed.js ---- */
var __m_js_generated_seed_js = (function () {
// GENERATED by build.py from src/data/seed.json -- do not edit.
const SEED = {"schema":1,"generatedAt":"2026-09-10T22:19:24","source":"Body Composition Tracker.xlsx :: Workout Log","cutoff":"2026-08-01","stats":{"sessions":14,"sets":284,"workingSets":233,"skippedRows":0},"renamed":{"Band Assisted Pull Up":"Band-Assisted Pull-up","Barbell Back Squat":"Back Squat","Barbell Bench Press":"Barbell Bench Press","Barbell Deadlift":"Barbell Deadlift","Barbell Overhead Press":"Standing Barbell OHP","Cable Rope Standing Overhead Tricep Extension":"Rope Overhead Tricep Extension","Cable Straight Bar Tricep Pushdown":"Cable Tricep Pushdown","Close Grip Lat Pulldown":"Close-Grip Lat Pulldown","Dumbbell Incline Bench Press":"DB Incline Bench Press","Dumbbell Incline Bicep Curl":"DB Incline Curl","Dumbbell Incline Row":"Chest-Supported DB Row","Dumbbell Lateral Raise":"DB Lateral Raise","Dumbbell Tricep Extension":"Overhead Tricep Extension","Lever Squat Machine — BSS":"Bulgarian Split Squat (lever)","Machine Assisted Pull Up":"Assisted Pull-up"},"sessions":[{"id":"seed-2026-08-03","date":"2026-08-03","day":null,"legacyLabel":null,"source":"xlsx","warmupCompleted":null,"exercises":[{"name":"Back Squat","sourceName":"Barbell Back Squat","superset":false,"sets":[{"setNum":1,"weight":45,"reps":10,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":2,"weight":135,"reps":5,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":3,"weight":185,"reps":5,"rir":null,"rpe":null,"notes":"Working top set; first squat session since 5/12 (83-day gap); re-entry load below 5/12 top of 215","warmup":false},{"setNum":4,"weight":155,"reps":10,"rir":null,"rpe":null,"notes":"Back-off working set","warmup":false},{"setNum":5,"weight":155,"reps":8,"rir":null,"rpe":null,"notes":"Back-off working set; fatigue endpoint","warmup":false}]},{"name":"DB Incline Bench Press","sourceName":"Dumbbell Incline Bench Press","superset":false,"sets":[{"setNum":1,"weight":40,"reps":10,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":2,"weight":65,"reps":5,"rir":null,"rpe":null,"notes":"Working top; matches 5/21 top load (65 lb); reps 5 vs 5/21 top of 12 — re-entry rep drop after 74-day gap","warmup":false},{"setNum":3,"weight":55,"reps":6,"rir":null,"rpe":null,"notes":"Working back-off","warmup":false}]},{"name":"Wide Grip Lat Pulldown","sourceName":"Wide Grip Lat Pulldown","superset":false,"sets":[{"setNum":1,"weight":70,"reps":8,"rir":null,"rpe":null,"notes":"Warmup; new Kalos naming variant (vs prior \"Lat Pulldown\" / \"Neutral Grip Lat Pulldown\")","warmup":true},{"setNum":2,"weight":85,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 113","warmup":false},{"setNum":3,"weight":85,"reps":7,"rir":null,"rpe":null,"notes":"Working; e1RM 105","warmup":false}]},{"name":"Seated Hamstring Curl Machine","sourceName":"Seated Hamstring Curl Machine","superset":false,"sets":[{"setNum":1,"weight":60,"reps":8,"rir":null,"rpe":null,"notes":"Warmup; first \"Seated\" (not \"Prone Lying\") hamstring curl session since 4/2 — different machine per Kalos label","warmup":true},{"setNum":2,"weight":85,"reps":8,"rir":null,"rpe":null,"notes":"Working; e1RM 108","warmup":false},{"setNum":3,"weight":85,"reps":7,"rir":null,"rpe":null,"notes":"Working","warmup":false},{"setNum":4,"weight":85,"reps":7,"rir":null,"rpe":null,"notes":"Working","warmup":false}]},{"name":"Chest-Supported DB Row","sourceName":"Dumbbell Incline Row","superset":false,"sets":[{"setNum":1,"weight":27.5,"reps":10,"rir":null,"rpe":null,"notes":"New exercise baseline; working","warmup":false},{"setNum":2,"weight":27.5,"reps":8,"rir":null,"rpe":null,"notes":"Working","warmup":false}]},{"name":"Dumbbell Seated Back Supported Shoulder Press","sourceName":"Dumbbell Seated Back Supported Shoulder Press","superset":false,"sets":[{"setNum":1,"weight":27.5,"reps":10,"rir":null,"rpe":null,"notes":"New Kalos naming variant vs prior \"Dumbbell Seated Shoulder Press\" / \"Dumbbell Seated Overhead Press\"; working baseline","warmup":false},{"setNum":2,"weight":27.5,"reps":10,"rir":null,"rpe":null,"notes":"Working","warmup":false}]},{"name":"Rope Overhead Tricep Extension","sourceName":"Cable Rope Standing Overhead Tricep Extension","superset":true,"sets":[{"setNum":1,"weight":35,"reps":8,"rir":null,"rpe":null,"notes":"Superset w/ Cable Bicep Curl; new Kalos naming (combines Standing + Overhead labels)","warmup":false},{"setNum":2,"weight":35,"reps":7,"rir":null,"rpe":null,"notes":"Working","warmup":false}]},{"name":"Cable Bicep Curl","sourceName":"Cable Bicep Curl","superset":true,"sets":[{"setNum":1,"weight":30,"reps":9,"rir":null,"rpe":null,"notes":"Superset w/ Cable Rope Overhead Tricep Extension; new exercise (vs prior \"Dumbbell Bicep Curl\" and \"Cable Single Arm Standing Bicep Curl\")","warmup":false},{"setNum":2,"weight":30,"reps":9,"rir":null,"rpe":null,"notes":"Working","warmup":false}]}],"notes":""},{"id":"seed-2026-08-05","date":"2026-08-05","day":null,"legacyLabel":null,"source":"xlsx","warmupCompleted":null,"exercises":[{"name":"Barbell Bench Press","sourceName":"Barbell Bench Press","superset":false,"sets":[{"setNum":1,"weight":45,"reps":8,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":2,"weight":95,"reps":5,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":3,"weight":135,"reps":7,"rir":null,"rpe":null,"notes":"Working top set; first BB Bench since 5/31 (66-day gap); re-entry load — 5/31 top was 145×12 (e1RM 203)","warmup":false},{"setNum":4,"weight":125,"reps":6,"rir":null,"rpe":null,"notes":"Working back-off","warmup":false},{"setNum":5,"weight":125,"reps":5,"rir":null,"rpe":null,"notes":"Working back-off; fatigue endpoint","warmup":false}]},{"name":"DB Kickstand RDL w/ Wall","sourceName":"DB Kickstand RDL w/ Wall","superset":false,"sets":[{"setNum":1,"weight":35,"reps":10,"rir":null,"rpe":null,"notes":"New exercise baseline; unilateral hinge with wall support; per-side load 35 lb; working","warmup":false},{"setNum":2,"weight":35,"reps":10,"rir":null,"rpe":null,"notes":"Working","warmup":false}]},{"name":"Band-Assisted Pull-up","sourceName":"Band Assisted Pull Up","superset":false,"sets":[{"setNum":1,"weight":0,"reps":12,"rir":null,"rpe":null,"notes":"Bodyweight; new Kalos naming variant (vs prior 'Machine Assisted Pull Up' — band-assisted rig, no assist weight logged); working","warmup":false},{"setNum":2,"weight":0,"reps":8,"rir":null,"rpe":null,"notes":"Bodyweight; working","warmup":false}]},{"name":"Seated Leg Extension Machine","sourceName":"Seated Leg Extension Machine","superset":false,"sets":[{"setNum":1,"weight":75,"reps":10,"rir":null,"rpe":null,"notes":"New Kalos naming variant (vs prior 'Single Leg Seated Leg Extension Machine' — bilateral not unilateral); working; e1RM 100","warmup":false},{"setNum":2,"weight":80,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 107","warmup":false}]},{"name":"Seated Row Machine","sourceName":"Seated Row Machine","superset":false,"sets":[{"setNum":1,"weight":43,"reps":9,"rir":null,"rpe":null,"notes":"Working; second Seated Row Machine session (prior 5/7, 5/21); load 43 lb per-side or per Kalos label; e1RM 56","warmup":false},{"setNum":2,"weight":43,"reps":6,"rir":null,"rpe":null,"notes":"Working","warmup":false}]},{"name":"DB Lateral Raise","sourceName":"Dumbbell Lateral Raise","superset":false,"sets":[{"setNum":1,"weight":15,"reps":12,"rir":null,"rpe":null,"notes":"Working; first DB Lateral Raise since 6/20 (46-day gap); 6/20 top load 20×12","warmup":false},{"setNum":2,"weight":15,"reps":9,"rir":null,"rpe":null,"notes":"Working","warmup":false}]},{"name":"Cable Tricep Pushdown","sourceName":"Cable Straight Bar Tricep Pushdown","superset":true,"sets":[{"setNum":1,"weight":45,"reps":10,"rir":null,"rpe":null,"notes":"SUPERSET w/ Alternating Dumbbell Bicep Curl; new Kalos naming variant (vs prior 'Cable Bar Tricep Pushdown' / 'Cable Rope Tricep Pushdown'); working","warmup":false},{"setNum":2,"weight":45,"reps":9,"rir":null,"rpe":null,"notes":"Working","warmup":false}]},{"name":"Alternating Dumbbell Bicep Curl","sourceName":"Alternating Dumbbell Bicep Curl","superset":true,"sets":[{"setNum":1,"weight":25,"reps":8,"rir":null,"rpe":null,"notes":"SUPERSET w/ Cable Straight Bar Tricep Pushdown; return to 'Alt DB Bicep Curl' naming (last appeared 3/31); working","warmup":false},{"setNum":2,"weight":25,"reps":8,"rir":null,"rpe":null,"notes":"Working","warmup":false}]}],"notes":""},{"id":"seed-2026-08-08","date":"2026-08-08","day":null,"legacyLabel":null,"source":"xlsx","warmupCompleted":null,"exercises":[{"name":"Barbell Deadlift","sourceName":"Barbell Deadlift","superset":false,"sets":[{"setNum":1,"weight":135,"reps":8,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":2,"weight":185,"reps":5,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":3,"weight":205,"reps":5,"rir":null,"rpe":null,"notes":"Working top set; first Deadlift since 4/29 (101-day gap); re-entry load — 4/29 top was 220×10 (Weight PR); Kalos e1RM 239","warmup":false},{"setNum":4,"weight":155,"reps":10,"rir":null,"rpe":null,"notes":"Working back-off; Kalos e1RM 207","warmup":false}]},{"name":"Standing Barbell OHP","sourceName":"Barbell Overhead Press","superset":false,"sets":[{"setNum":1,"weight":45,"reps":10,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":2,"weight":75,"reps":9,"rir":null,"rpe":null,"notes":"Working; first OHP since 6/20 (49-day gap); load matched 6/20 top (75×10) at 9 reps; Kalos e1RM 98","warmup":false},{"setNum":3,"weight":75,"reps":8,"rir":null,"rpe":null,"notes":"Working; Kalos e1RM 95","warmup":false}]},{"name":"Dumbbell Bulgarian Split Squat","sourceName":"Dumbbell Bulgarian Split Squat","superset":false,"sets":[{"setNum":1,"weight":50,"reps":10,"rir":null,"rpe":null,"notes":"Working; load matched 4/29 PR (50×12); reps 12→10 vs pre-gap; Kalos e1RM 67","warmup":false},{"setNum":2,"weight":50,"reps":10,"rir":null,"rpe":null,"notes":"Working; Kalos e1RM 67","warmup":false}]},{"name":"Chest Fly Machine","sourceName":"Chest Fly Machine","superset":false,"sets":[{"setNum":1,"weight":50,"reps":10,"rir":null,"rpe":null,"notes":"Warmup; new Kalos naming variant (vs prior \"Dumbbell Chest Fly\" / \"Cable Standing Chest Fly\")","warmup":true},{"setNum":2,"weight":70,"reps":10,"rir":null,"rpe":null,"notes":"Working; Kalos e1RM 93","warmup":false},{"setNum":3,"weight":70,"reps":10,"rir":null,"rpe":null,"notes":"Working; Kalos e1RM 93","warmup":false}]},{"name":"Close-Grip Lat Pulldown","sourceName":"Close Grip Lat Pulldown","superset":false,"sets":[{"setNum":1,"weight":85,"reps":10,"rir":null,"rpe":null,"notes":"Working; new Kalos naming variant (vs prior \"Wide Grip Lat Pulldown\" / \"Neutral Grip Lat Pulldown\"); Kalos e1RM 113","warmup":false},{"setNum":2,"weight":90,"reps":10,"rir":null,"rpe":null,"notes":"Working; Kalos e1RM 120","warmup":false}]},{"name":"Cable Wide Grip Seated Row","sourceName":"Cable Wide Grip Seated Row","superset":false,"sets":[{"setNum":1,"weight":90,"reps":10,"rir":null,"rpe":null,"notes":"Working; new Kalos naming variant (vs prior \"Cable Seated Row\" / \"Seated Row Machine\"); Kalos e1RM 120","warmup":false},{"setNum":2,"weight":90,"reps":8,"rir":null,"rpe":null,"notes":"Working; Kalos e1RM 114","warmup":false}]},{"name":"Lying Dumbbell Tricep Extension","sourceName":"Lying Dumbbell Tricep Extension","superset":true,"sets":[{"setNum":1,"weight":50,"reps":10,"rir":null,"rpe":null,"notes":"SUPERSET w/ Dumbbell Incline Bicep Curl; new exercise / new Kalos naming variant (skullcrusher pattern); Kalos e1RM 67","warmup":false},{"setNum":2,"weight":60,"reps":10,"rir":null,"rpe":null,"notes":"SUPERSET; working; Kalos e1RM 80","warmup":false}]},{"name":"DB Incline Curl","sourceName":"Dumbbell Incline Bicep Curl","superset":true,"sets":[{"setNum":1,"weight":20,"reps":10,"rir":null,"rpe":null,"notes":"SUPERSET w/ Lying Dumbbell Tricep Extension; new Kalos naming variant (vs prior \"Dumbbell Bicep Curl\"); Kalos e1RM 27","warmup":false},{"setNum":2,"weight":22.5,"reps":10,"rir":null,"rpe":null,"notes":"SUPERSET; working; Kalos e1RM 30","warmup":false}]}],"notes":""},{"id":"seed-2026-08-10","date":"2026-08-10","day":null,"legacyLabel":null,"source":"xlsx","warmupCompleted":null,"exercises":[{"name":"Back Squat","sourceName":"Barbell Back Squat","superset":false,"sets":[{"setNum":1,"weight":45,"reps":10,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":2,"weight":135,"reps":5,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":3,"weight":155,"reps":5,"rir":null,"rpe":null,"notes":"Warmup ramp","warmup":true},{"setNum":4,"weight":185,"reps":5,"rir":null,"rpe":null,"notes":"Working top; matches 8/3 top (185×5, e1RM 216); load flat, no gain vs FB A #1","warmup":false},{"setNum":5,"weight":155,"reps":10,"rir":null,"rpe":null,"notes":"Back-off working; e1RM 207 — up from 8/3 back-off 155×10 (207) — matched, then improved rep quality","warmup":false},{"setNum":6,"weight":155,"reps":10,"rir":null,"rpe":null,"notes":"Back-off working; e1RM 207 — 2nd rep-matched back-off (vs 8/3 second back-off 155×8) = +2 reps at same load","warmup":false}]},{"name":"DB Incline Bench Press","sourceName":"Dumbbell Incline Bench Press","superset":false,"sets":[{"setNum":1,"weight":40,"reps":8,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":2,"weight":55,"reps":10,"rir":null,"rpe":null,"notes":"Working top; e1RM 73; different loading vs 8/3 (65×5, e1RM 76) — higher volume, lighter top","warmup":false},{"setNum":3,"weight":55,"reps":8,"rir":null,"rpe":null,"notes":"Working; e1RM 70","warmup":false}]},{"name":"Wide Grip Lat Pulldown","sourceName":"Wide Grip Lat Pulldown","superset":false,"sets":[{"setNum":1,"weight":85,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 113 — matches 8/3 top; skipped warmup this session vs 8/3 (70×8)","warmup":true},{"setNum":2,"weight":85,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 113; +3 reps at same load vs 8/3 second set (85×7)","warmup":false}]},{"name":"Seated Hamstring Curl Machine","sourceName":"Seated Hamstring Curl Machine","superset":false,"sets":[{"setNum":1,"weight":85,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 113 (Weight PR — up from 8/3 top 85×8, e1RM 108); +2 reps at same load","warmup":false},{"setNum":2,"weight":85,"reps":9,"rir":null,"rpe":null,"notes":"Working; e1RM 111; skipped warmup and reduced set count 4→2 vs 8/3","warmup":true}]},{"name":"Chest-Supported DB Row","sourceName":"Dumbbell Incline Row","superset":false,"sets":[{"setNum":1,"weight":27.5,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 37 — matches 8/3 top; second FB A appearance","warmup":false},{"setNum":2,"weight":27.5,"reps":6,"rir":null,"rpe":null,"notes":"Working; e1RM 33; reps 6 vs 8/3 second set (8) — mild rep drop on set 2","warmup":false}]},{"name":"Dumbbell Seated Back Supported Shoulder Press","sourceName":"Dumbbell Seated Back Supported Shoulder Press","superset":false,"sets":[{"setNum":1,"weight":32.5,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 43 — Weight PR vs 8/3 (27.5×10, e1RM 37); +5 lb load / same reps = +16% e1RM","warmup":false},{"setNum":2,"weight":32.5,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 43 — 2nd set matched at PR load","warmup":false}]},{"name":"Rope Overhead Tricep Extension","sourceName":"Cable Rope Standing Overhead Tricep Extension","superset":true,"sets":[{"setNum":1,"weight":35,"reps":11,"rir":null,"rpe":null,"notes":"Superset w/ Cable Bicep Curl; e1RM 48 (Rep PR — up from 8/3 top 35×8, e1RM 44); +3 reps at same load","warmup":false},{"setNum":2,"weight":35,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 47","warmup":false}]},{"name":"Cable Bicep Curl","sourceName":"Cable Bicep Curl","superset":true,"sets":[{"setNum":1,"weight":30,"reps":12,"rir":null,"rpe":null,"notes":"Superset w/ Cable Rope Overhead Tricep Ext; e1RM 42 (Rep PR — up from 8/3 top 30×9, e1RM 39); +3 reps at same load","warmup":false},{"setNum":2,"weight":30,"reps":12,"rir":null,"rpe":null,"notes":"Working; e1RM 42 — 2nd set matched at PR reps","warmup":false}]}],"notes":""},{"id":"seed-2026-08-12","date":"2026-08-12","day":null,"legacyLabel":"FB B round 2","source":"xlsx","warmupCompleted":null,"exercises":[{"name":"Barbell Bench Press","sourceName":"Barbell Bench Press","superset":false,"sets":[{"setNum":1,"weight":45,"reps":10,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":2,"weight":95,"reps":5,"rir":null,"rpe":null,"notes":"Warmup ramp","warmup":true},{"setNum":3,"weight":145,"reps":5,"rir":null,"rpe":null,"notes":"Working top; e1RM 169 (Weight PR — up from 8/5 top 135×7 e1RM 167, +1.2%); FB B round 2","warmup":false},{"setNum":4,"weight":115,"reps":10,"rir":null,"rpe":null,"notes":"Working back-off; e1RM 153 (vs 8/5 back-off 125×6 e1RM 150, +2%); +4 reps at 10 lb lighter","warmup":false},{"setNum":5,"weight":115,"reps":9,"rir":null,"rpe":null,"notes":"Working back-off; e1RM 150 (vs 8/5 second back-off 125×5 e1RM 146, +3%); +4 reps","warmup":false}]},{"name":"DB Kickstand RDL w/ Wall","sourceName":"DB Kickstand RDL w/ Wall","superset":false,"sets":[{"setNum":1,"weight":45,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 60 — Weight PR up from 8/5 (35×10 e1RM 47), +28%","warmup":false},{"setNum":2,"weight":45,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 60 — 2nd set matched at PR load","warmup":false}]},{"name":"Band-Assisted Pull-up","sourceName":"Band Assisted Pull Up","superset":false,"sets":[{"setNum":1,"weight":0,"reps":12,"rir":null,"rpe":null,"notes":"Bodyweight; working; matches 8/5 top (12 reps)","warmup":false},{"setNum":2,"weight":0,"reps":12,"rir":null,"rpe":null,"notes":"Bodyweight; working; Rep PR set 2 — +4 reps vs 8/5 (8)","warmup":false}]},{"name":"Seated Leg Extension Machine","sourceName":"Seated Leg Extension Machine","superset":false,"sets":[{"setNum":1,"weight":85,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 113 — Weight PR up from 8/5 top 80×10 e1RM 107, +6%","warmup":false},{"setNum":2,"weight":90,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 120 — Weight PR set 2 (+10 lb vs 8/5 top)","warmup":false}]},{"name":"Seated Row Machine","sourceName":"Seated Row Machine","superset":false,"sets":[{"setNum":1,"weight":43,"reps":11,"rir":null,"rpe":null,"notes":"Working; e1RM 59 — Rep PR up from 8/5 top 43×9 e1RM 56, +5%; +2 reps at same load","warmup":false},{"setNum":2,"weight":43,"reps":7,"rir":null,"rpe":null,"notes":"Working; e1RM 53 — matches 8/5 second set (43×6 e1RM 52)","warmup":false}]},{"name":"DB Lateral Raise","sourceName":"Dumbbell Lateral Raise","superset":false,"sets":[{"setNum":1,"weight":17.5,"reps":12,"rir":null,"rpe":null,"notes":"Working; e1RM 25 — Weight PR up from 8/5 (15×12 e1RM 21), +19%","warmup":false},{"setNum":2,"weight":17.5,"reps":9,"rir":null,"rpe":null,"notes":"Working; e1RM 23 — set 2 at PR load","warmup":false}]},{"name":"Cable Tricep Pushdown","sourceName":"Cable Straight Bar Tricep Pushdown","superset":true,"sets":[{"setNum":1,"weight":50,"reps":10,"rir":null,"rpe":null,"notes":"SUPERSET w/ Alt DB Bicep Curl; e1RM 67 — Weight PR up from 8/5 (45×10 e1RM 60), +12%","warmup":false},{"setNum":2,"weight":50,"reps":10,"rir":null,"rpe":null,"notes":"SUPERSET; working; e1RM 67 — 2nd set matched at PR load","warmup":false}]},{"name":"Alternating Dumbbell Bicep Curl","sourceName":"Alternating Dumbbell Bicep Curl","superset":true,"sets":[{"setNum":1,"weight":25,"reps":10,"rir":null,"rpe":null,"notes":"SUPERSET w/ Cable Straight Bar Tri Pushdown; e1RM 33 — Rep PR up from 8/5 (25×8 e1RM 32); +2 reps at same load","warmup":false},{"setNum":2,"weight":25,"reps":10,"rir":null,"rpe":null,"notes":"SUPERSET; working; e1RM 33 — 2nd set matched at Rep PR","warmup":false}]}],"notes":""},{"id":"seed-2026-08-14","date":"2026-08-14","day":null,"legacyLabel":"FB C round 2","source":"xlsx","warmupCompleted":null,"exercises":[{"name":"Barbell Deadlift","sourceName":"Barbell Deadlift","superset":false,"sets":[{"setNum":1,"weight":135,"reps":10,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":2,"weight":185,"reps":5,"rir":null,"rpe":null,"notes":"Warmup ramp","warmup":true},{"setNum":3,"weight":215,"reps":5,"rir":null,"rpe":null,"notes":"Working top; e1RM 251 (Weight PR — up from 8/8 top 205×5 e1RM 239, +5%); FB C round 2","warmup":false},{"setNum":4,"weight":165,"reps":10,"rir":null,"rpe":null,"notes":"Working back-off; e1RM 220 (Weight PR — up from 8/8 back-off 155×10 e1RM 207, +6%); +10 lb at same reps","warmup":false}]},{"name":"Standing Barbell OHP","sourceName":"Barbell Overhead Press","superset":false,"sets":[{"setNum":1,"weight":65,"reps":10,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":2,"weight":85,"reps":9,"rir":null,"rpe":null,"notes":"Working top; e1RM 111 (Weight PR — up from 8/8 top 75×9 e1RM 98, +13%); +10 lb at same reps","warmup":false},{"setNum":3,"weight":85,"reps":6,"rir":null,"rpe":null,"notes":"Working; e1RM 102 (Weight PR — up from 8/8 75×8 e1RM 95, +7%)","warmup":false}]},{"name":"Dumbbell Bulgarian Split Squat","sourceName":"Dumbbell Bulgarian Split Squat","superset":false,"sets":[{"setNum":1,"weight":55,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 73 (Weight PR — up from 8/8 top 50×10 e1RM 67, +9%); +5 lb at same reps","warmup":false},{"setNum":2,"weight":55,"reps":8,"rir":null,"rpe":null,"notes":"Working; e1RM 70 (Weight PR — 8/8 set 2 was 50×10 e1RM 67)","warmup":false}]},{"name":"Chest Fly Machine","sourceName":"Chest Fly Machine","superset":false,"sets":[{"setNum":1,"weight":80,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 107 (Weight PR — up from 8/8 top 70×10 e1RM 93, +15%); +10 lb at same reps; skipped warmup vs 8/8","warmup":true},{"setNum":2,"weight":85,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 113 (Weight PR — set 2 heavier; +21% vs 8/8 top)","warmup":false}]},{"name":"Close-Grip Lat Pulldown","sourceName":"Close Grip Lat Pulldown","superset":false,"sets":[{"setNum":1,"weight":95,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 127 (Weight PR — up from 8/8 top 90×10 e1RM 120, +6%); +5 lb at same reps","warmup":false},{"setNum":2,"weight":95,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 127 — 2nd set matched at PR load","warmup":false}]},{"name":"Cable Wide Grip Seated Row","sourceName":"Cable Wide Grip Seated Row","superset":false,"sets":[{"setNum":1,"weight":90,"reps":7,"rir":null,"rpe":null,"notes":"Working; e1RM 111 — !! RECOVERY ALERT vs 8/8 top 90×10 e1RM 120, -8%; likely late-session fatigue (7th exercise, after DL top)","warmup":false},{"setNum":2,"weight":90,"reps":6,"rir":null,"rpe":null,"notes":"Working; e1RM 108 vs 8/8 set 2 90×8 e1RM 114, -5%; fatigue signal continues","warmup":false}]},{"name":"Lying Dumbbell Tricep Extension","sourceName":"Lying Dumbbell Tricep Extension","superset":true,"sets":[{"setNum":1,"weight":60,"reps":10,"rir":null,"rpe":null,"notes":"SUPERSET w/ DB Incline Bicep Curl; e1RM 80 — matches 8/8 top (60×10)","warmup":false},{"setNum":2,"weight":60,"reps":10,"rir":null,"rpe":null,"notes":"SUPERSET; e1RM 80 — 2nd set matched top","warmup":false}]},{"name":"DB Incline Curl","sourceName":"Dumbbell Incline Bicep Curl","superset":true,"sets":[{"setNum":1,"weight":27.5,"reps":10,"rir":null,"rpe":null,"notes":"SUPERSET w/ Lying DB Tricep Ext; e1RM 37 (Weight PR — up from 8/8 top 22.5×10 e1RM 30, +23%); +5 lb at same reps","warmup":false},{"setNum":2,"weight":27.5,"reps":8,"rir":null,"rpe":null,"notes":"SUPERSET; e1RM 35 (Weight PR — vs 8/8 set 1 20×10 e1RM 27, +30%)","warmup":false}]}],"notes":""},{"id":"seed-2026-08-17","date":"2026-08-17","day":null,"legacyLabel":null,"source":"xlsx","warmupCompleted":null,"exercises":[{"name":"Back Squat","sourceName":"Barbell Back Squat","superset":false,"sets":[{"setNum":1,"weight":45,"reps":10,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":2,"weight":135,"reps":5,"rir":null,"rpe":null,"notes":"Warmup ramp","warmup":true},{"setNum":3,"weight":185,"reps":2,"rir":null,"rpe":null,"notes":"Warmup ramp","warmup":true},{"setNum":4,"weight":195,"reps":5,"rir":null,"rpe":null,"notes":"Working top; e1RM 228 (Weight PR — up from 8/10 top 185×5 e1RM 216, +5.6%); +10 lb at same reps","warmup":false},{"setNum":5,"weight":165,"reps":10,"rir":null,"rpe":null,"notes":"Working back-off; e1RM 220 (Weight PR — up from 8/10 back-off 155×10 e1RM 207, +6.3%); +10 lb at same reps","warmup":false},{"setNum":6,"weight":165,"reps":10,"rir":null,"rpe":null,"notes":"Working back-off; e1RM 220 — 2nd set matched at PR load","warmup":false}]},{"name":"DB Incline Bench Press","sourceName":"Dumbbell Incline Bench Press","superset":false,"sets":[{"setNum":1,"weight":40,"reps":8,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":2,"weight":60,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 80 (Weight PR — up from 8/10 top 55×10 e1RM 73, +9.6%); +5 lb at same reps","warmup":false},{"setNum":3,"weight":60,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 80 — 2nd set matched at PR load (vs 8/10 set 2 55×8 e1RM 70, +14%)","warmup":false}]},{"name":"Wide Grip Lat Pulldown","sourceName":"Wide Grip Lat Pulldown","superset":false,"sets":[{"setNum":1,"weight":60,"reps":8,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":2,"weight":90,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 120 (Weight PR — up from 8/10 top 85×10 e1RM 113, +6.2%); +5 lb at same reps","warmup":false},{"setNum":3,"weight":90,"reps":9,"rir":null,"rpe":null,"notes":"Working; e1RM 117 (Weight PR — vs 8/10 set 2 85×10 e1RM 113, +3.3%)","warmup":false}]},{"name":"Seated Hamstring Curl Machine","sourceName":"Seated Hamstring Curl Machine","superset":false,"sets":[{"setNum":1,"weight":90,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 120 (Weight PR — up from 8/10 top 85×10 e1RM 113, +6.2%); +5 lb at same reps","warmup":false},{"setNum":2,"weight":95,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 127 (Weight PR — set 2 heavier still; +12% vs 8/10 top; matches historical 4/2 peak load 95×12=133 e1RM within Recomp Phase 5)","warmup":false}]},{"name":"Chest-Supported DB Row","sourceName":"Dumbbell Incline Row","superset":false,"sets":[{"setNum":1,"weight":30,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 40 (Weight PR — up from 8/10 top 27.5×10 e1RM 37, +8.1%); +2.5 lb at same reps","warmup":false},{"setNum":2,"weight":30,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 40 — 2nd set matched at PR load (vs 8/10 set 2 27.5×6 e1RM 33, +21%)","warmup":false}]},{"name":"Dumbbell Seated Back Supported Shoulder Press","sourceName":"Dumbbell Seated Back Supported Shoulder Press","superset":false,"sets":[{"setNum":1,"weight":37.5,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 50 (Weight PR — up from 8/10 top 32.5×10 e1RM 43, +16.3%); +5 lb at same reps","warmup":false},{"setNum":2,"weight":37.5,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 50 — 2nd set matched at PR load","warmup":false}]},{"name":"Rope Overhead Tricep Extension","sourceName":"Cable Rope Standing Overhead Tricep Extension","superset":true,"sets":[{"setNum":1,"weight":35,"reps":12,"rir":null,"rpe":null,"notes":"SUPERSET w/ Cable Bicep Curl; e1RM 49 (Rep PR — up from 8/10 top 35×11 e1RM 48, +2.1%); matched weight, +1 rep","warmup":false},{"setNum":2,"weight":35,"reps":12,"rir":null,"rpe":null,"notes":"SUPERSET; e1RM 49 — 2nd set matched Rep PR (vs 8/10 set 2 35×10 e1RM 47, +5%)","warmup":false}]},{"name":"Cable Bicep Curl","sourceName":"Cable Bicep Curl","superset":true,"sets":[{"setNum":1,"weight":35,"reps":12,"rir":null,"rpe":null,"notes":"SUPERSET w/ Cable Rope Standing OH Tri Ext; e1RM 49 (Weight PR — up from 8/10 top 30×12 e1RM 42, +16.7%); +5 lb at same reps","warmup":false},{"setNum":2,"weight":35,"reps":12,"rir":null,"rpe":null,"notes":"SUPERSET; e1RM 49 — 2nd set matched at PR load","warmup":false}]}],"notes":""},{"id":"seed-2026-08-19","date":"2026-08-19","day":null,"legacyLabel":null,"source":"xlsx","warmupCompleted":null,"exercises":[{"name":"Barbell Bench Press","sourceName":"Barbell Bench Press","superset":false,"sets":[{"setNum":1,"weight":45,"reps":8,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":2,"weight":135,"reps":3,"rir":null,"rpe":null,"notes":"Warmup ramp","warmup":true},{"setNum":3,"weight":150,"reps":5,"rir":null,"rpe":null,"notes":"Working top; e1RM 175 (Weight PR — up from 8/12 top 145×5 e1RM 169, +3.6%); +5 lb at same reps","warmup":false},{"setNum":4,"weight":120,"reps":10,"rir":null,"rpe":null,"notes":"Working back-off; e1RM 160","warmup":false},{"setNum":5,"weight":120,"reps":9,"rir":null,"rpe":null,"notes":"Working back-off; e1RM 156","warmup":false}]},{"name":"DB Kickstand RDL w/ Wall","sourceName":"DB Kickstand RDL w/ Wall","superset":false,"sets":[{"setNum":1,"weight":50,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 67 (Weight PR — up from 8/12 top 45×10 e1RM 60, +11%); +5 lb at same reps","warmup":false},{"setNum":2,"weight":50,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 67 — 2nd set matched at PR load","warmup":false}]},{"name":"Assisted Pull-up","sourceName":"Machine Assisted Pull Up","superset":false,"sets":[{"setNum":1,"weight":80,"reps":12,"rir":null,"rpe":null,"notes":"Working; e1RM 112 — new exercise variant (was \"Band Assisted Pull Up\" 8/5, 8/12); reps only prior","warmup":false},{"setNum":2,"weight":75,"reps":9,"rir":null,"rpe":null,"notes":"Working; e1RM 98 — assist decreased (harder) from set 1","warmup":false}]},{"name":"Seated Leg Extension Machine","sourceName":"Seated Leg Extension Machine","superset":false,"sets":[{"setNum":1,"weight":95,"reps":12,"rir":null,"rpe":null,"notes":"Working; e1RM 133 (Weight PR — up from 8/12 top 80×10 e1RM 107, +24%); +15 lb","warmup":false},{"setNum":2,"weight":100,"reps":14,"rir":null,"rpe":null,"notes":"Working; e1RM 147 (Weight PR — set 2 heavier still; +23% vs 8/12 set 2 90×10 e1RM 120)","warmup":false}]},{"name":"Seated Row Machine","sourceName":"Seated Row Machine","superset":false,"sets":[{"setNum":1,"weight":53,"reps":11,"rir":null,"rpe":null,"notes":"Working; e1RM 72 (Weight PR — up from 8/12 top 43×11 e1RM 56, +29%); +10 lb at same reps","warmup":false},{"setNum":2,"weight":53,"reps":6,"rir":null,"rpe":null,"notes":"Working; e1RM 64 — reps drop at PR load, still +14% e1RM vs 8/12 set 2 43×9 e1RM 56","warmup":false}]},{"name":"DB Lateral Raise","sourceName":"Dumbbell Lateral Raise","superset":false,"sets":[{"setNum":1,"weight":20,"reps":12,"rir":null,"rpe":null,"notes":"Working; e1RM 28 (Weight PR — up from 8/12 top 17.5×12 e1RM 24, +14%); +2.5 lb at same reps","warmup":false},{"setNum":2,"weight":20,"reps":9,"rir":null,"rpe":null,"notes":"Working; e1RM 26 — matched 8/12 set 2 reps (17.5×9) at higher load","warmup":false}]},{"name":"Cable Tricep Pushdown","sourceName":"Cable Straight Bar Tricep Pushdown","superset":true,"sets":[{"setNum":1,"weight":55,"reps":12,"rir":null,"rpe":null,"notes":"SUPERSET w/ Alt DB Bicep Curl; e1RM 77 (Weight PR — up from 8/12 top 50×10 e1RM 67, +15%); +5 lb, +2 reps","warmup":false},{"setNum":2,"weight":60,"reps":8,"rir":null,"rpe":null,"notes":"SUPERSET; e1RM 76 (Weight PR — +5 lb again, set 2 heavier than set 1)","warmup":false}]},{"name":"Alternating Dumbbell Bicep Curl","sourceName":"Alternating Dumbbell Bicep Curl","superset":true,"sets":[{"setNum":1,"weight":30,"reps":7,"rir":null,"rpe":null,"notes":"SUPERSET w/ Cable Straight Bar Tri Pushdown; e1RM 37 (Weight PR — up from 8/12 top 25×10 e1RM 33, +12%); +5 lb at lower reps","warmup":false},{"setNum":2,"weight":30,"reps":7,"rir":null,"rpe":null,"notes":"SUPERSET; e1RM 37 — 2nd set matched at PR load","warmup":false}]}],"notes":""},{"id":"seed-2026-08-22","date":"2026-08-22","day":null,"legacyLabel":"FB C round 3","source":"xlsx","warmupCompleted":null,"exercises":[{"name":"Barbell Deadlift","sourceName":"Barbell Deadlift","superset":false,"sets":[{"setNum":1,"weight":135,"reps":8,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":2,"weight":185,"reps":3,"rir":null,"rpe":null,"notes":"Warmup ramp","warmup":true},{"setNum":3,"weight":225,"reps":5,"rir":null,"rpe":null,"notes":"Working top; e1RM 263 (Weight PR — up from 8/14 top 215×5 e1RM 251, +4.8%); +10 lb at same reps; FB C round 3","warmup":false},{"setNum":4,"weight":185,"reps":10,"rir":null,"rpe":null,"notes":"Working back-off; e1RM 247 (Weight PR — up from 8/14 back-off 165×10 e1RM 220, +12.3%); +20 lb at same reps","warmup":false}]},{"name":"Standing Barbell OHP","sourceName":"Barbell Overhead Press","superset":false,"sets":[{"setNum":1,"weight":45,"reps":8,"rir":null,"rpe":null,"notes":"Warmup (empty bar)","warmup":true},{"setNum":2,"weight":90,"reps":9,"rir":null,"rpe":null,"notes":"Working top; e1RM 117 (Weight PR — up from 8/14 top 85×9 e1RM 111, +5.4%); +5 lb at same reps","warmup":false},{"setNum":3,"weight":90,"reps":6,"rir":null,"rpe":null,"notes":"Working; e1RM 108 (Weight PR — up from 8/14 85×6 e1RM 102, +5.9%)","warmup":false}]},{"name":"Dumbbell Bulgarian Split Squat","sourceName":"Dumbbell Bulgarian Split Squat","superset":false,"sets":[{"setNum":1,"weight":60,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 80 (Weight PR — up from 8/14 top 55×10 e1RM 73, +9.6%); +5 lb at same reps","warmup":false},{"setNum":2,"weight":60,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 80 — matched PR load; +2 reps vs 8/14 set 2 (55×8)","warmup":false}]},{"name":"Chest Fly Machine","sourceName":"Chest Fly Machine","superset":false,"sets":[{"setNum":1,"weight":90,"reps":15,"rir":null,"rpe":null,"notes":"Working; e1RM 135 (Rep+Weight PR — vs 8/14 top 85×10 e1RM 113, +19%); +5 lb, +5 reps","warmup":false},{"setNum":2,"weight":105,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 140 (Weight PR — set 2 heavier; +24% vs 8/14 top e1RM 113)","warmup":false}]},{"name":"Close-Grip Lat Pulldown","sourceName":"Close Grip Lat Pulldown","superset":false,"sets":[{"setNum":1,"weight":105,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 140 (Weight PR — up from 8/14 top 95×10 e1RM 127, +10%); +10 lb at same reps","warmup":false},{"setNum":2,"weight":110,"reps":7,"rir":null,"rpe":null,"notes":"Working; e1RM 136 (Weight PR — set 2 heavier; +7% vs 8/14 top e1RM 127)","warmup":false}]},{"name":"Cable Wide Grip Seated Row","sourceName":"Cable Wide Grip Seated Row","superset":false,"sets":[{"setNum":1,"weight":90,"reps":9,"rir":null,"rpe":null,"notes":"Working; e1RM 117 (Rep PR — matched 8/14 load, +2 reps top set; +5.4% vs 8/14 top e1RM 111); recovers from 8/14 late-session dip","warmup":false},{"setNum":2,"weight":90,"reps":7,"rir":null,"rpe":null,"notes":"Working; e1RM 111 (Rep PR — vs 8/14 set 2 90×6 e1RM 108, +2.8%)","warmup":false}]},{"name":"Lying Dumbbell Tricep Extension","sourceName":"Lying Dumbbell Tricep Extension","superset":true,"sets":[{"setNum":1,"weight":70,"reps":10,"rir":null,"rpe":null,"notes":"SUPERSET w/ DB Incline Bicep Curl; e1RM 93 (Weight PR — up from 8/14 top 60×10 e1RM 80, +16.3%); +10 lb at same reps","warmup":false},{"setNum":2,"weight":70,"reps":8,"rir":null,"rpe":null,"notes":"SUPERSET; e1RM 89 (Weight PR — vs 8/14 set 2 60×10 e1RM 80; +11%)","warmup":false}]},{"name":"DB Incline Curl","sourceName":"Dumbbell Incline Bicep Curl","superset":true,"sets":[{"setNum":1,"weight":30,"reps":10,"rir":null,"rpe":null,"notes":"SUPERSET w/ Lying DB Tricep Ext; e1RM 40 (Weight PR — up from 8/14 top 27.5×10 e1RM 37, +8.1%); +2.5 lb at same reps","warmup":false},{"setNum":2,"weight":30,"reps":8,"rir":null,"rpe":null,"notes":"SUPERSET; e1RM 38 (Weight PR — vs 8/14 set 2 27.5×8 e1RM 35, +8.6%)","warmup":false}]}],"notes":""},{"id":"seed-2026-08-26","date":"2026-08-26","day":null,"legacyLabel":"FB B round 3","source":"xlsx","warmupCompleted":null,"exercises":[{"name":"Dumbbell Bench Press","sourceName":"Dumbbell Bench Press","superset":false,"sets":[{"setNum":1,"weight":45,"reps":10,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":2,"weight":65,"reps":4,"rir":null,"rpe":null,"notes":"Warmup ramp","warmup":true},{"setNum":3,"weight":80,"reps":5,"rir":null,"rpe":null,"notes":"Working top; e1RM 93 (Weight PR — up from 5/4 top 65x12 e1RM 91, +2.2%); +15 lb at lower reps; first DB Bench since 5/4 (114-day gap); FB B round 3","warmup":false},{"setNum":4,"weight":55,"reps":10,"rir":null,"rpe":null,"notes":"Working back-off; e1RM 73","warmup":false},{"setNum":5,"weight":55,"reps":7,"rir":null,"rpe":null,"notes":"Working back-off; e1RM 68","warmup":false}]},{"name":"Barbell Romanian Deadlift","sourceName":"Barbell Romanian Deadlift","superset":false,"sets":[{"setNum":1,"weight":95,"reps":10,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":2,"weight":145,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 193","warmup":false},{"setNum":3,"weight":165,"reps":10,"rir":null,"rpe":null,"notes":"Working top; e1RM 220 — first Barbell RDL since 5/9 (109-day gap); prior top 5/9 185x12 e1RM 259, below prior peak after layoff","warmup":false}]},{"name":"Assisted Pull-up","sourceName":"Machine Assisted Pull Up","superset":false,"sets":[{"setNum":1,"weight":80,"reps":9,"rir":null,"rpe":null,"notes":"Working; e1RM 104 — assist load matched 8/19 (80), reps down from 12 to 9 (harder relative to prior); exclude from deload flag (assist-machine per feedback)","warmup":false},{"setNum":2,"weight":80,"reps":5,"rir":null,"rpe":null,"notes":"Working; e1RM 93 — fatigue set at same assist","warmup":false}]},{"name":"Seated Leg Extension Machine","sourceName":"Seated Leg Extension Machine","superset":false,"sets":[{"setNum":1,"weight":110,"reps":12,"rir":null,"rpe":null,"notes":"Working; e1RM 154 (Weight PR — up from 8/19 top 95x12 e1RM 133, +16%); +15 lb at same reps","warmup":false},{"setNum":2,"weight":110,"reps":9,"rir":null,"rpe":null,"notes":"Working; e1RM 143 — matched PR load; -1 rep vs 8/19 set 2 (100x14)","warmup":false}]},{"name":"Seated Row Machine","sourceName":"Seated Row Machine","superset":false,"sets":[{"setNum":1,"weight":53,"reps":12,"rir":null,"rpe":null,"notes":"Working; e1RM 74 (Rep PR — up from 8/19 top 53x11 e1RM 72, +2.8%); +1 rep at PR load","warmup":false},{"setNum":2,"weight":55.5,"reps":7,"rir":null,"rpe":null,"notes":"Working; e1RM 68 (Weight PR — set 2 heavier than 8/19 set 2 53x6 e1RM 64, +6%); +2.5 lb","warmup":false}]},{"name":"DB Lateral Raise","sourceName":"Dumbbell Lateral Raise","superset":false,"sets":[{"setNum":1,"weight":22.5,"reps":9,"rir":null,"rpe":null,"notes":"Working; e1RM 29 (Weight PR — up from 8/19 top 20x12 e1RM 28, +3.6%); +2.5 lb at lower reps","warmup":false},{"setNum":2,"weight":22.5,"reps":7,"rir":null,"rpe":null,"notes":"Working; e1RM 28 — matched PR load","warmup":false}]},{"name":"Cable Tricep Pushdown","sourceName":"Cable Straight Bar Tricep Pushdown","superset":true,"sets":[{"setNum":1,"weight":60,"reps":10,"rir":null,"rpe":null,"notes":"SUPERSET w/ Alt DB Bicep Curl; e1RM 80 (Weight PR — up from 8/19 top 55x12 e1RM 77, +3.9%); +5 lb at lower reps","warmup":false},{"setNum":2,"weight":60,"reps":8,"rir":null,"rpe":null,"notes":"SUPERSET; e1RM 76 — matched 8/19 set 2 (60x8 e1RM 76)","warmup":false}]},{"name":"Alternating Dumbbell Bicep Curl","sourceName":"Alternating Dumbbell Bicep Curl","superset":true,"sets":[{"setNum":1,"weight":30,"reps":8,"rir":null,"rpe":null,"notes":"SUPERSET w/ Cable Straight Bar Tri Pushdown; e1RM 38 (Rep PR — up from 8/19 top 30x7 e1RM 37, +2.7%); +1 rep at PR load","warmup":false},{"setNum":2,"weight":30,"reps":8,"rir":null,"rpe":null,"notes":"SUPERSET; e1RM 38 — matched Rep PR","warmup":false}]}],"notes":""},{"id":"seed-2026-09-01","date":"2026-09-01","day":null,"legacyLabel":"FB A round 4","source":"xlsx","warmupCompleted":null,"exercises":[{"name":"Back Squat","sourceName":"Barbell Back Squat","superset":false,"sets":[{"setNum":1,"weight":45,"reps":8,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":2,"weight":135,"reps":5,"rir":null,"rpe":null,"notes":"Warmup ramp","warmup":true},{"setNum":3,"weight":205,"reps":5,"rir":null,"rpe":null,"notes":"Working top; e1RM 239 (Weight PR — up from 8/17 top 195×5 e1RM 228, +4.8%); +10 lb at same reps; FB A round 4","warmup":false},{"setNum":4,"weight":185,"reps":10,"rir":null,"rpe":null,"notes":"Working back-off; e1RM 247 (Weight PR — up from 8/17 back-off 165×10 e1RM 220, +12.3%); +20 lb at same reps","warmup":false},{"setNum":5,"weight":185,"reps":10,"rir":null,"rpe":null,"notes":"Working back-off; e1RM 247 — 2nd set matched at PR load","warmup":false}]},{"name":"DB Incline Bench Press","sourceName":"Dumbbell Incline Bench Press","superset":false,"sets":[{"setNum":1,"weight":45,"reps":8,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":2,"weight":65,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 87 (Weight PR — up from 8/17 top 60×10 e1RM 80, +8.75%); +5 lb at same reps","warmup":false},{"setNum":3,"weight":65,"reps":5,"rir":null,"rpe":null,"notes":"Working; e1RM 76 — reps drop at PR load","warmup":false}]},{"name":"Wide Grip Lat Pulldown","sourceName":"Wide Grip Lat Pulldown","superset":false,"sets":[{"setNum":1,"weight":95,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 127 (Weight PR — up from 8/17 top 90×10 e1RM 120, +5.8%); +5 lb at same reps","warmup":false},{"setNum":2,"weight":100,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 133 (Weight PR — set 2 heavier; +10 lb / +10.8% vs 8/17 top)","warmup":false}]},{"name":"Seated Hamstring Curl Machine","sourceName":"Seated Hamstring Curl Machine","superset":false,"sets":[{"setNum":1,"weight":100,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 133 (Weight PR — up from 8/17 top 90×10 e1RM 120, +10.8%); +10 lb at same reps","warmup":false},{"setNum":2,"weight":110,"reps":9,"rir":null,"rpe":null,"notes":"Working; e1RM 143 (Weight PR — set 2 heavier still; +15 lb vs 8/17 set 2 95×10 e1RM 127, +12.6%)","warmup":false}]},{"name":"Chest-Supported DB Row","sourceName":"Dumbbell Incline Row","superset":false,"sets":[{"setNum":1,"weight":40,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 53 (Weight PR — up from 8/17 top 30×10 e1RM 40, +32.5%); +10 lb at same reps","warmup":false},{"setNum":2,"weight":40,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 53 — 2nd set matched at PR load","warmup":false}]},{"name":"Dumbbell Seated Back Supported Shoulder Press","sourceName":"Dumbbell Seated Back Supported Shoulder Press","superset":false,"sets":[{"setNum":1,"weight":45,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 60 (Weight PR — up from 8/17 top 37.5×10 e1RM 50, +20%); +7.5 lb at same reps","warmup":false},{"setNum":2,"weight":45,"reps":8,"rir":null,"rpe":null,"notes":"Working; e1RM 57 (Weight PR — set 2 vs 8/17 set 2 37.5×10 e1RM 50, +14%)","warmup":false}]},{"name":"Rope Overhead Tricep Extension","sourceName":"Cable Rope Standing Overhead Tricep Extension","superset":true,"sets":[{"setNum":1,"weight":37,"reps":9,"rir":null,"rpe":null,"notes":"SUPERSET w/ Cable Bicep Curl; e1RM 48 — load PR at 37 lb (+2 lb vs 8/17); e1RM flat vs 8/17 top 35×12 e1RM 49 (-2%) — trade reps for load","warmup":false},{"setNum":2,"weight":37,"reps":9,"rir":null,"rpe":null,"notes":"SUPERSET; e1RM 48 — 2nd set matched at PR load","warmup":false}]},{"name":"Cable Bicep Curl","sourceName":"Cable Bicep Curl","superset":true,"sets":[{"setNum":1,"weight":37,"reps":12,"rir":null,"rpe":null,"notes":"SUPERSET w/ Cable Rope Standing OH Tri Ext; e1RM 52 (Weight PR — up from 8/17 top 35×12 e1RM 49, +6.1%); +2 lb at same reps","warmup":false},{"setNum":2,"weight":37,"reps":12,"rir":null,"rpe":null,"notes":"SUPERSET; e1RM 52 — 2nd set matched at PR load","warmup":false}]}],"notes":""},{"id":"seed-2026-09-05","date":"2026-09-05","day":null,"legacyLabel":null,"source":"xlsx","warmupCompleted":null,"exercises":[{"name":"Barbell Bench Press","sourceName":"Barbell Bench Press","superset":false,"sets":[{"setNum":1,"weight":135,"reps":5,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":2,"weight":155,"reps":5,"rir":null,"rpe":null,"notes":"Working top; e1RM 181 (Weight PR — up from 8/19 top 150×5 e1RM 175, +3.4%); +5 lb at same reps","warmup":false},{"setNum":3,"weight":125,"reps":10,"rir":null,"rpe":null,"notes":"Working back-off; e1RM 167 (vs 8/19 back-off 120×10 e1RM 160, +4.4%); +5 lb same reps","warmup":false},{"setNum":4,"weight":125,"reps":9,"rir":null,"rpe":null,"notes":"Working back-off; e1RM 163 (vs 8/19 set 5 120×9 e1RM 156, +4.5%)","warmup":false}]},{"name":"Barbell Romanian Deadlift","sourceName":"Barbell Romanian Deadlift","superset":false,"sets":[{"setNum":1,"weight":135,"reps":5,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":2,"weight":185,"reps":10,"rir":null,"rpe":null,"notes":"Working top; e1RM 247 (Weight PR — up from 8/26 top 165×10 e1RM 220, +12.3%); +20 lb same reps","warmup":false},{"setNum":3,"weight":185,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 247 — matched PR load and reps set 2","warmup":false}]},{"name":"Assisted Pull-up","sourceName":"Machine Assisted Pull Up","superset":false,"sets":[{"setNum":1,"weight":80,"reps":12,"rir":null,"rpe":null,"notes":"Working; e1RM 112 — matched 8/19 top (80×12), assist same load, reps recovered vs 8/26 (80×9 e1RM 104, +8%)","warmup":false},{"setNum":2,"weight":75,"reps":12,"rir":null,"rpe":null,"notes":"Working; e1RM 105 — assist decreased (harder) vs 8/26 set 2 (80×5 e1RM 93, +13%); also +3 reps vs 8/19 set 2 (75×9 e1RM 98, +7%)","warmup":false}]},{"name":"Seated Leg Extension Machine","sourceName":"Seated Leg Extension Machine","superset":false,"sets":[{"setNum":1,"weight":115,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 153 — Weight PR load 115 lb (+5 lb vs 8/26 top 110×12 e1RM 154, essentially flat e1RM -0.6%)","warmup":false},{"setNum":2,"weight":115,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 153 — matched PR load set 2; +6 lb vs 8/26 set 2 110×9 e1RM 143 (+7%)","warmup":false}]},{"name":"Seated Row Machine","sourceName":"Seated Row Machine","superset":false,"sets":[{"setNum":1,"weight":58,"reps":10,"rir":null,"rpe":null,"notes":"Working; e1RM 77 (Weight PR — up from 8/26 top 53×12 e1RM 74, +4.1%); +5 lb at similar reps","warmup":false},{"setNum":2,"weight":58,"reps":7,"rir":null,"rpe":null,"notes":"Working; e1RM 72 — Weight PR set 2 vs 8/26 set 2 55.5×7 e1RM 68 (+5.9%)","warmup":false}]},{"name":"DB Lateral Raise","sourceName":"Dumbbell Lateral Raise","superset":false,"sets":[{"setNum":1,"weight":22.5,"reps":12,"rir":null,"rpe":null,"notes":"Working; e1RM 31 (Rep PR — up from 8/26 top 22.5×9 e1RM 29, +6.9%); matched PR load, +3 reps","warmup":false},{"setNum":2,"weight":22.5,"reps":9,"rir":null,"rpe":null,"notes":"Working; e1RM 29 — matched 8/26 top set (22.5×9)","warmup":false}]},{"name":"Cable Tricep Pushdown","sourceName":"Cable Straight Bar Tricep Pushdown","superset":true,"sets":[{"setNum":1,"weight":60,"reps":10,"rir":null,"rpe":null,"notes":"SUPERSET w/ Alt DB Bicep Curl; e1RM 80 — matched 8/26 top (60×10 e1RM 80)","warmup":false},{"setNum":2,"weight":60,"reps":10,"rir":null,"rpe":null,"notes":"SUPERSET; e1RM 80 — Rep PR set 2 vs 8/26 set 2 60×8 e1RM 76 (+5.3%); matched top load and reps","warmup":false}]},{"name":"Alternating Dumbbell Bicep Curl","sourceName":"Alternating Dumbbell Bicep Curl","superset":true,"sets":[{"setNum":1,"weight":30,"reps":9,"rir":null,"rpe":null,"notes":"SUPERSET w/ Cable Straight Bar Tri Pushdown; e1RM 39 (Rep PR — up from 8/26 top 30×8 e1RM 38, +2.6%); matched PR load +1 rep","warmup":false},{"setNum":2,"weight":30,"reps":8,"rir":null,"rpe":null,"notes":"SUPERSET; e1RM 38 — matched 8/26 Rep PR","warmup":false}]}],"notes":""},{"id":"seed-2026-09-07","date":"2026-09-07","day":null,"legacyLabel":null,"source":"xlsx","warmupCompleted":null,"exercises":[{"name":"Back Squat","sourceName":"Barbell Back Squat","superset":false,"sets":[{"setNum":1,"weight":135,"reps":8,"rir":null,"rpe":null,"notes":"","warmup":true},{"setNum":2,"weight":185,"reps":3,"rir":null,"rpe":null,"notes":"","warmup":true},{"setNum":3,"weight":215,"reps":5,"rir":null,"rpe":null,"notes":"","warmup":false},{"setNum":4,"weight":195,"reps":10,"rir":null,"rpe":null,"notes":"PR","warmup":false},{"setNum":5,"weight":195,"reps":10,"rir":null,"rpe":null,"notes":"","warmup":false}]},{"name":"DB Incline Bench Press","sourceName":"Dumbbell Incline Bench Press","superset":false,"sets":[{"setNum":1,"weight":45,"reps":8,"rir":null,"rpe":null,"notes":"","warmup":true},{"setNum":2,"weight":65,"reps":10,"rir":null,"rpe":null,"notes":"","warmup":false},{"setNum":3,"weight":65,"reps":7,"rir":null,"rpe":null,"notes":"","warmup":false}]},{"name":"Wide Grip Lat Pulldown","sourceName":"Wide Grip Lat Pulldown","superset":false,"sets":[{"setNum":1,"weight":105,"reps":10,"rir":null,"rpe":null,"notes":"PR","warmup":false},{"setNum":2,"weight":105,"reps":10,"rir":null,"rpe":null,"notes":"","warmup":false}]},{"name":"Seated Hamstring Curl Machine","sourceName":"Seated Hamstring Curl Machine","superset":false,"sets":[{"setNum":1,"weight":110,"reps":11,"rir":null,"rpe":null,"notes":"PR","warmup":false},{"setNum":2,"weight":110,"reps":10,"rir":null,"rpe":null,"notes":"","warmup":false}]},{"name":"Chest-Supported DB Row","sourceName":"Dumbbell Incline Row","superset":false,"sets":[{"setNum":1,"weight":45,"reps":10,"rir":null,"rpe":null,"notes":"PR","warmup":false},{"setNum":2,"weight":45,"reps":10,"rir":null,"rpe":null,"notes":"","warmup":false}]},{"name":"Dumbbell Seated Back Supported Shoulder Press","sourceName":"Dumbbell Seated Back Supported Shoulder Press","superset":false,"sets":[{"setNum":1,"weight":55,"reps":9,"rir":null,"rpe":null,"notes":"PR","warmup":false},{"setNum":2,"weight":55,"reps":4,"rir":null,"rpe":null,"notes":"","warmup":false},{"setNum":3,"weight":32.5,"reps":8,"rir":null,"rpe":null,"notes":"","warmup":false}]},{"name":"Rope Overhead Tricep Extension","sourceName":"Cable Rope Standing Overhead Tricep Extension","superset":true,"sets":[{"setNum":1,"weight":40,"reps":10,"rir":null,"rpe":null,"notes":"PR (superset)","warmup":false},{"setNum":2,"weight":40,"reps":8,"rir":null,"rpe":null,"notes":"superset","warmup":false}]},{"name":"Cable Bicep Curl","sourceName":"Cable Bicep Curl","superset":true,"sets":[{"setNum":1,"weight":40,"reps":12,"rir":null,"rpe":null,"notes":"PR (superset)","warmup":false},{"setNum":2,"weight":40,"reps":10,"rir":null,"rpe":null,"notes":"superset","warmup":false}]}],"notes":""},{"id":"seed-2026-09-10","date":"2026-09-10","day":null,"legacyLabel":"FB C round 4","source":"xlsx","warmupCompleted":null,"exercises":[{"name":"Barbell Deadlift","sourceName":"Barbell Deadlift","superset":false,"sets":[{"setNum":1,"weight":135,"reps":5,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":2,"weight":165,"reps":3,"rir":null,"rpe":null,"notes":"Warmup ramp","warmup":true},{"setNum":3,"weight":195,"reps":2,"rir":null,"rpe":null,"notes":"Warmup ramp","warmup":true},{"setNum":4,"weight":220,"reps":1,"rir":null,"rpe":null,"notes":"Warmup single","warmup":true},{"setNum":5,"weight":235,"reps":5,"rir":null,"rpe":null,"notes":"Working top; e1RM 274.2 (Weight PR — up from 8/22 top 225×5 e1RM 263, +4.4%); +10 lb at same reps; FB C round 4","warmup":false},{"setNum":6,"weight":190,"reps":10,"rir":null,"rpe":null,"notes":"Working back-off; e1RM 253.3 (Weight PR — up from 8/22 back-off 185×10 e1RM 247, +2.6%); +5 lb at same reps","warmup":false}]},{"name":"Standing Barbell OHP","sourceName":"Barbell Overhead Press","superset":false,"sets":[{"setNum":1,"weight":45,"reps":10,"rir":null,"rpe":null,"notes":"Warmup (empty bar)","warmup":true},{"setNum":2,"weight":65,"reps":5,"rir":null,"rpe":null,"notes":"Warmup ramp","warmup":true},{"setNum":3,"weight":95,"reps":8,"rir":null,"rpe":null,"notes":"Working top; e1RM 120.3 (Weight PR — up from 8/22 top 90×9 e1RM 117, +2.9%); +5 lb, -1 rep","warmup":false},{"setNum":4,"weight":95,"reps":6,"rir":null,"rpe":null,"notes":"Working; e1RM 114.0 (Weight PR — up from 8/22 set 2 90×6 e1RM 108, +5.6%)","warmup":false}]},{"name":"Bulgarian Split Squat (lever)","sourceName":"Lever Squat Machine — BSS","superset":false,"sets":[{"setNum":1,"weight":130,"reps":10,"rir":null,"rpe":null,"notes":"Working; NEW baseline exercise (plate-loaded lever squat machine for Bulgarian Split Squats); replaces DB BSS in FB C — lever geometry means plate load ≠ true resistance, progression tracked independently","warmup":false},{"setNum":2,"weight":130,"reps":10,"rir":null,"rpe":null,"notes":"Working; matched set 1 — try 140 lb next round if 130×10 felt like DB 60s did","warmup":false}]},{"name":"Chest Fly Machine","sourceName":"Chest Fly Machine","superset":false,"sets":[{"setNum":1,"weight":110,"reps":12,"rir":null,"rpe":null,"notes":"Working top; e1RM 154.0 (Weight PR — up from 8/22 set 2 105×10 e1RM 140, +10%)","warmup":false},{"setNum":2,"weight":110,"reps":9,"rir":null,"rpe":null,"notes":"Working; e1RM 143.0 (Weight PR — vs 8/22 top 90×15 e1RM 135, +4.4%; matched set 1 load)","warmup":false}]},{"name":"Close-Grip Lat Pulldown","sourceName":"Close Grip Lat Pulldown","superset":false,"sets":[{"setNum":1,"weight":80,"reps":8,"rir":null,"rpe":null,"notes":"Warmup","warmup":true},{"setNum":2,"weight":110,"reps":10,"rir":null,"rpe":null,"notes":"Working top; e1RM 146.7 (Weight PR — up from 8/22 top 105×10 e1RM 140, +4.8%); +5 lb at same reps","warmup":false},{"setNum":3,"weight":110,"reps":8,"rir":null,"rpe":null,"notes":"Working; e1RM 139.3 (Weight PR — vs 8/22 set 2 110×7 e1RM 136, +2.4%)","warmup":false}]},{"name":"Cable Wide Grip Seated Row","sourceName":"Cable Wide Grip Seated Row","superset":false,"sets":[{"setNum":1,"weight":90,"reps":10,"rir":null,"rpe":null,"notes":"Working top; e1RM 120.0 (Rep PR — vs 8/22 top 90×9 e1RM 117, +2.6%); matched load, +1 rep; no late-session fade despite heavier DL","warmup":false},{"setNum":2,"weight":90,"reps":7,"rir":null,"rpe":null,"notes":"Working; e1RM 111.0 — matched 8/22 set 2 (90×7)","warmup":false}]},{"name":"Overhead Tricep Extension","sourceName":"Dumbbell Tricep Extension","superset":true,"sets":[{"setNum":1,"weight":30,"reps":12,"rir":null,"rpe":null,"notes":"SUPERSET w/ DB Incline Curl; Working; e1RM 42.0 — NEW baseline (per-arm DB extension); EZ-bar-to-DB conversion; 12 clean reps → try 35 lb next round","warmup":false},{"setNum":2,"weight":30,"reps":12,"rir":null,"rpe":null,"notes":"SUPERSET; e1RM 42.0 — matched set 1","warmup":false}]},{"name":"DB Incline Curl","sourceName":"Dumbbell Incline Bicep Curl","superset":true,"sets":[{"setNum":1,"weight":30,"reps":10,"rir":null,"rpe":null,"notes":"SUPERSET w/ DB Tricep Ext; Working; e1RM 40.0 (Weight PR — up from 8/22 top 30×10 e1RM 40 matched; PR vs 8/14 top 27.5×10 e1RM 37, +9%)","warmup":false},{"setNum":2,"weight":30,"reps":9,"rir":null,"rpe":null,"notes":"SUPERSET; e1RM 39.0 (Rep PR — vs 8/22 set 2 30×8 e1RM 38, +2.6%, +1 rep at matched PR load)","warmup":false}]}],"notes":""}]};
  return { SEED: SEED };
})();

/* ---- js/routine.js ---- */
var __m_js_routine_js = (function () {
// routine.js -- the 3-day full-body rotation, encoded as data.
//
// Rotation: A -> rest -> B -> rest -> C -> rest -> rest
//
// Exercise fields
//   name           canonical name; must match the seed data's canonical names
//                  so PR history carries over (see tools/make_seed.py ALIASES)
//   sets           planned working sets
//   repRange       [n] for a fixed target, [lo, hi] for a range
//   type           'main' | 'accessory' | 'superset'
//   supersetGroup  id linking paired exercises; they are prompted alternately
//   notes          coaching cue, shown under the exercise name
//   unilateral     true -> the set prompt reads "per side"
//   alternatives   swap options, picked per session
//   rest           default rest-timer seconds after each set
//   increment      +/- step on the weight stepper (lb)
//   smallStep      true -> progressive overload suggests +2.5 lb, not +5
//   ramp           true -> offer the warmup ramp calculator
//   loadSense      'normal' (more weight is better) | 'assist' (less is better)

const WARMUP = [
  { name: 'Dead bug', prescription: '2 × 8 / side' },
  { name: 'Bird dog', prescription: '2 × 8 / side' },
  { name: 'Half-kneeling hip-flexor stretch', prescription: '30s / side' },
];

const ROUTINE = {
  A: {
    day: 'A',
    title: 'Squat + Bench',
    exercises: [
      {
        name: 'Back Squat',
        sets: 3, repRange: [5], type: 'main',
        rest: 180, increment: 5, ramp: true,
      },
      {
        name: 'Barbell Hip Thrust',
        sets: 3, repRange: [8], type: 'main',
        notes: 'Glute priority. Chin tucked, ribs down.',
        rest: 150, increment: 10, ramp: true,
      },
      {
        name: 'Barbell Bench Press',
        sets: 3, repRange: [6], type: 'main',
        rest: 180, increment: 5, smallStep: true, ramp: true,
      },
      {
        name: 'Chest-Supported DB Row',
        sets: 3, repRange: [10], type: 'accessory',
        notes: 'Upper-back thickness. Pause a beat at the top.',
        rest: 90, increment: 5,
      },
      {
        name: 'DB Lateral Raise',
        sets: 2, repRange: [12], type: 'accessory',
        rest: 60, increment: 2.5,
      },
      {
        name: 'Face Pull',
        sets: 2, repRange: [15], type: 'accessory',
        notes: 'Rear delts + external rotation. High elbows.',
        rest: 60, increment: 5,
      },
      {
        name: 'DB Incline Curl',
        sets: 1, repRange: [10], type: 'superset', supersetGroup: 'A-arms',
        rest: 0, increment: 2.5,
      },
      {
        name: 'Overhead Tricep Extension',
        sets: 1, repRange: [10], type: 'superset', supersetGroup: 'A-arms',
        rest: 60, increment: 5,
      },
    ],
  },

  B: {
    day: 'B',
    title: 'Deadlift + Vertical',
    exercises: [
      {
        name: 'Barbell Deadlift',
        sets: 3, repRange: [5], type: 'main',
        rest: 180, increment: 10, ramp: true,
      },
      {
        name: 'Standing Barbell OHP',
        sets: 3, repRange: [6], type: 'main',
        rest: 180, increment: 5, smallStep: true, ramp: true,
      },
      {
        name: 'Assisted Pull-up',
        sets: 3, repRange: [6, 10], type: 'main',
        notes: 'Log the assist load. Less assist = progress.',
        alternatives: ['Assisted Pull-up', 'Weighted Pull-up', 'Bodyweight Pull-up'],
        rest: 150, increment: 5, loadSense: 'assist',
      },
      {
        name: 'DB Incline Bench Press',
        sets: 3, repRange: [10], type: 'accessory',
        notes: 'Upper-pec priority.',
        rest: 90, increment: 5,
      },
      {
        name: 'Bulgarian Split Squat (lever)',
        sets: 3, repRange: [10], type: 'accessory', unilateral: true,
        alternatives: ['Bulgarian Split Squat (lever)', 'Dumbbell Bulgarian Split Squat'],
        rest: 90, increment: 10,
      },
      {
        name: 'Rear-Delt Fly',
        sets: 2, repRange: [15], type: 'accessory',
        rest: 60, increment: 5,
      },
      {
        name: 'EZ-Bar Curl',
        sets: 1, repRange: [10], type: 'superset', supersetGroup: 'B-arms',
        rest: 0, increment: 5,
      },
      {
        name: 'Cable Tricep Pushdown',
        sets: 1, repRange: [12], type: 'superset', supersetGroup: 'B-arms',
        rest: 60, increment: 5,
      },
    ],
  },

  C: {
    day: 'C',
    title: 'Hip Thrust + Incline',
    exercises: [
      {
        name: 'Barbell Hip Thrust',
        sets: 4, repRange: [6, 8], type: 'main',
        notes: 'Heaviest hip thrust of the week.',
        rest: 180, increment: 10, ramp: true,
      },
      {
        // Replaced Front Squat on 2026-09-25: front-rack position wrecks Bobby's wrists.
        name: 'Leg Press',
        sets: 3, repRange: [10], type: 'main',
        rest: 150, increment: 10,
      },
      {
        name: 'Incline Barbell Bench Press',
        sets: 3, repRange: [6, 8], type: 'main',
        notes: 'Upper-pec priority.',
        rest: 180, increment: 5, smallStep: true, ramp: true,
      },
      {
        name: 'One-Arm DB Row',
        sets: 3, repRange: [10], type: 'accessory', unilateral: true,
        rest: 90, increment: 5,
      },
      {
        name: 'Close-Grip Lat Pulldown',
        sets: 2, repRange: [10], type: 'accessory',
        rest: 60, increment: 5,
      },
      {
        name: 'DB Shrug',
        sets: 2, repRange: [10], type: 'accessory',
        notes: 'Upper-back thickness. Hold the top for one second.',
        rest: 60, increment: 5,
      },
      {
        name: 'Hammer Curl',
        sets: 1, repRange: [10], type: 'superset', supersetGroup: 'C-arms',
        rest: 0, increment: 2.5,
      },
      {
        name: 'Rope Overhead Tricep Extension',
        sets: 1, repRange: [12], type: 'superset', supersetGroup: 'C-arms',
        rest: 60, increment: 5,
      },
    ],
  },
};

const DAY_ORDER = ['A', 'B', 'C'];

// Main lifts that get the warmup ramp calculator, keyed by canonical name.
const RAMP_LIFTS = new Set(
  DAY_ORDER.flatMap((d) => ROUTINE[d].exercises.filter((e) => e.ramp).map((e) => e.name))
);

// Every exercise the active session picker can offer, including alternatives.
const ROUTINE_EXERCISES = (() => {
  const out = new Map();
  for (const d of DAY_ORDER) {
    for (const ex of ROUTINE[d].exercises) {
      if (!out.has(ex.name)) out.set(ex.name, ex);
      for (const alt of ex.alternatives || []) {
        if (!out.has(alt)) out.set(alt, { ...ex, name: alt });
      }
    }
  }
  return out;
})();

function planFor(day) {
  return ROUTINE[day] || null;
}

// Which day comes next given the last completed day letter.
function nextDay(lastDay) {
  if (!lastDay) return 'A';
  const i = DAY_ORDER.indexOf(lastDay);
  if (i < 0) return 'A';
  return DAY_ORDER[(i + 1) % DAY_ORDER.length];
}

function repTarget(ex) {
  const r = ex.repRange || [];
  if (r.length === 0) return '';
  if (r.length === 1) return String(r[0]);
  return `${r[0]}–${r[1]}`;
}

function topOfRange(ex) {
  const r = ex.repRange || [];
  return r.length ? r[r.length - 1] : null;
}
  return { planFor: planFor, nextDay: nextDay, repTarget: repTarget, topOfRange: topOfRange, WARMUP: WARMUP, ROUTINE: ROUTINE, DAY_ORDER: DAY_ORDER, RAMP_LIFTS: RAMP_LIFTS, ROUTINE_EXERCISES: ROUTINE_EXERCISES };
})();

/* ---- js/calc.js ---- */
var __m_js_calc_js = (function () {
  var { ROUTINE_EXERCISES, topOfRange } = __m_js_routine_js;
// calc.js -- pure math. No DOM, no storage. Everything here is deterministic
// and recomputed from the full set log, so a bad flag can never get baked in.


// ---------------------------------------------------------------------------
// Epley
// ---------------------------------------------------------------------------

function e1rm(weight, reps) {
  const w = Number(weight);
  const r = Number(reps);
  if (!w || !r || r < 1) return null;
  if (r === 1) return w;
  return w * (1 + r / 30);
}

function round1(n) {
  return n == null ? null : Math.round(n * 10) / 10;
}

function fmtWeight(w) {
  if (w == null || w === '') return '–';
  const n = Number(w);
  return Number.isInteger(n) ? String(n) : String(round1(n));
}

// ---------------------------------------------------------------------------
// Load sense: for assisted movements a *lower* load is the better performance.
// ---------------------------------------------------------------------------

function loadSenseFor(name) {
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

function blankRecord() {
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
function countsForPR(set) {
  return !set.warmup && Number(set.reps) > 0;
}

function detectPRs(rec, set, sense = 'normal') {
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

function advanceRecord(rec, set, date) {
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

const PR_LABEL = {
  weight: 'W-PR',
  reps: 'R-PR',
  e1rm: 'e1RM-PR',
  assist: 'A-PR',
};

const PR_TITLE = {
  weight: 'Weight PR — heaviest ever on this lift',
  reps: 'Rep PR — most reps ever at this load',
  e1rm: 'e1RM PR — best estimated 1RM ever',
  assist: 'Assist PR — least assistance ever',
};

// ---------------------------------------------------------------------------
// Whole-log pass
// ---------------------------------------------------------------------------

function sortSessions(sessions) {
  return [...sessions].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return String(a.startTime || '').localeCompare(String(b.startTime || ''));
  });
}

/**
 * Walk every session in date order and stamp prFlags on every set.
 * Mutates the sets in place and returns a Map of name -> final record.
 */
function annotateAllPRs(sessions) {
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
function recordFor(sessions, name, { beforeSessionId = null } = {}) {
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

function setVolume(set) {
  if (set.warmup) return 0;
  const w = Number(set.weight) || 0;
  const r = Number(set.reps) || 0;
  return w * r;
}

function sessionStats(session) {
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

function durationMin(session) {
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
function exerciseSeries(sessions, name) {
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
function exerciseIndex(sessions) {
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
function lastPerformance(sessions, name, excludeId = null) {
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
function overloadSuggestion(exMeta, last) {
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

const RAMP_STEPS = [
  { pct: 0.40, reps: 5 },
  { pct: 0.60, reps: 3 },
  { pct: 0.75, reps: 2 },
  { pct: 0.90, reps: 1 },
];

/** Round to the nearest loadable barbell weight (5 lb jumps, 45 lb bar floor). */
function roundToPlate(w, barWeight = 45) {
  const r = Math.round(w / 5) * 5;
  return Math.max(barWeight, r);
}

function warmupRamp(targetWeight, { barWeight = 45 } = {}) {
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

function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function fmtDateLong(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function daysBetween(aIso, bIso) {
  if (!aIso || !bIso) return null;
  const a = new Date(aIso + 'T00:00:00').getTime();
  const b = new Date(bIso + 'T00:00:00').getTime();
  return Math.round((b - a) / 86400000);
}
  return { e1rm: e1rm, round1: round1, fmtWeight: fmtWeight, loadSenseFor: loadSenseFor, blankRecord: blankRecord, countsForPR: countsForPR, detectPRs: detectPRs, advanceRecord: advanceRecord, sortSessions: sortSessions, annotateAllPRs: annotateAllPRs, recordFor: recordFor, setVolume: setVolume, sessionStats: sessionStats, durationMin: durationMin, exerciseSeries: exerciseSeries, exerciseIndex: exerciseIndex, lastPerformance: lastPerformance, overloadSuggestion: overloadSuggestion, roundToPlate: roundToPlate, warmupRamp: warmupRamp, todayISO: todayISO, fmtDate: fmtDate, fmtDateLong: fmtDateLong, daysBetween: daysBetween, PR_LABEL: PR_LABEL, PR_TITLE: PR_TITLE, RAMP_STEPS: RAMP_STEPS };
})();

/* ---- js/store.js ---- */
var __m_js_store_js = (function () {
  var { SEED } = __m_js_generated_seed_js;
  var { ROUTINE, planFor, nextDay } = __m_js_routine_js;
  var { annotateAllPRs, sortSessions, todayISO } = __m_js_calc_js;
// store.js -- localStorage persistence, one module, one key.
//
// Every mutation writes through synchronously. There is no debounce and no
// in-memory-only state, which is what makes the app survive the phone locking,
// Safari evicting the tab, and app-switching mid-set.


const STORAGE_KEY = 'workoutTracker.v1';
const SCHEMA_VERSION = 1;

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

function load() {
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

function getState() {
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

function commit() {
  // The active session has to be in the pass too, or sets logged during a
  // workout never get their trophy until the session is finished.
  annotateAllPRs(sessionsWithActive());
  persist();
  for (const fn of listeners) fn(state);
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

function allSessions() {
  return getState().sessions;
}

/** Completed sessions plus the in-progress one, for PR/"last time" lookups. */
function sessionsWithActive() {
  const s = getState();
  return s.active ? [...s.sessions, s.active] : s.sessions;
}

function getSession(id) {
  return getState().sessions.find((s) => s.id === id) || null;
}

function lastLoggedDay() {
  const app = sortSessions(getState().sessions).filter((s) => s.day);
  return app.length ? app[app.length - 1] : null;
}

function suggestedDay() {
  const last = lastLoggedDay();
  return nextDay(last ? last.day : null);
}

function activeSession() {
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

function startSession(day) {
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

function updateActive(mutator) {
  const s = getState();
  if (!s.active) return null;
  mutator(s.active);
  commit();
  return s.active;
}

function discardActive() {
  getState().active = null;
  commit();
}

function finishActive() {
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

function deleteSession(id) {
  const s = getState();
  s.sessions = s.sessions.filter((x) => x.id !== id);
  commit();
}

// ---------------------------------------------------------------------------
// Set logging
// ---------------------------------------------------------------------------

function logSet(slot, { weight, reps, rir = null, warmup = false }) {
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

function deleteSet(slot, index) {
  const s = getState();
  if (!s.active) return;
  const ex = s.active.exercises.find((e) => e.slot === slot);
  if (!ex || !ex.sets[index]) return;
  ex.sets.splice(index, 1);
  ex.sets.forEach((set, i) => { set.setNum = i + 1; });
  commit();
}

function renameActiveExercise(slot, name) {
  updateActive((a) => {
    const ex = a.exercises.find((e) => e.slot === slot);
    if (ex) ex.name = name;
  });
}

function setActiveCursor(i) {
  updateActive((a) => { a.cursor = i; });
}

function setActiveNotes(text) {
  updateActive((a) => { a.notes = text; });
}

function setSessionNotes(id, text) {
  const s = getSession(id);
  if (!s) return;
  s.notes = text;
  commit();
}

function toggleWarmup(index) {
  updateActive((a) => {
    a.warmupChecks = a.warmupChecks || [];
    a.warmupChecks[index] = !a.warmupChecks[index];
  });
}

function markWarmupDone() {
  updateActive((a) => { a.warmupCompleted = true; });
}

// ---------------------------------------------------------------------------
// Export / import
// ---------------------------------------------------------------------------

function exportPayload() {
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

function exportCSV() {
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

function importPayload(payload, { mode = 'merge' } = {}) {
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

function markBackedUp() {
  getState().settings.lastBackup = new Date().toISOString();
  commit();
}

/** Re-apply the shipped seed history without touching sessions logged here. */
function reseed() {
  return importPayload({ sessions: seedSessions() }, { mode: 'merge' });
}

function wipeAll() {
  state = emptyState();
  state.sessions = seedSessions();
  state.settings.seedVersion = SEED.generatedAt || 'unknown';
  commit();
}

const SEED_INFO = {
  generatedAt: SEED.generatedAt,
  source: SEED.source,
  cutoff: SEED.cutoff,
  stats: SEED.stats,
  renamed: SEED.renamed,
};
  return { load: load, getState: getState, commit: commit, subscribe: subscribe, allSessions: allSessions, sessionsWithActive: sessionsWithActive, getSession: getSession, lastLoggedDay: lastLoggedDay, suggestedDay: suggestedDay, activeSession: activeSession, startSession: startSession, updateActive: updateActive, discardActive: discardActive, finishActive: finishActive, deleteSession: deleteSession, logSet: logSet, deleteSet: deleteSet, renameActiveExercise: renameActiveExercise, setActiveCursor: setActiveCursor, setActiveNotes: setActiveNotes, setSessionNotes: setSessionNotes, toggleWarmup: toggleWarmup, markWarmupDone: markWarmupDone, exportPayload: exportPayload, exportCSV: exportCSV, importPayload: importPayload, markBackedUp: markBackedUp, reseed: reseed, wipeAll: wipeAll, STORAGE_KEY: STORAGE_KEY, SCHEMA_VERSION: SCHEMA_VERSION, SEED_INFO: SEED_INFO };
})();

/* ---- js/views/home.js ---- */
var __m_js_views_home_js = (function () {
  var { h, mount, confirmSheet } = __m_js_dom_js;
  var { ROUTINE, DAY_ORDER, planFor } = __m_js_routine_js;
  var store = __m_js_store_js;
  var { sessionStats, sortSessions, fmtDateLong, fmtDate, daysBetween, todayISO } = __m_js_calc_js;
// views/home.js -- three big buttons and enough context to know which one.


function renderHome(root, { onStart, onOpenSession, onResume }) {
  const state = store.getState();
  const active = store.activeSession();
  const logged = sortSessions(state.sessions.filter((s) => s.day));
  const all = sortSessions(state.sessions);
  const last = all[all.length - 1] || null;
  const suggested = store.suggestedDay();

  mount(root,
    h('header.home-header',
      h('h1.home-title', 'Workout'),
      h('p.home-sub', `${state.athlete.name} · ${fmtDateLong(todayISO())}`)
    ),

    active ? resumeCard(active, onResume) : null,

    h('section.day-picker',
      h('div.section-head',
        h('h2.section-title', 'Start a session'),
        h('span.section-hint', logged.length
          ? `Next in rotation: Day ${suggested}`
          : 'Fresh rotation — start with Day A')
      ),
      DAY_ORDER.map((d) => dayButton(d, d === suggested, active, onStart))
    ),

    h('section.home-stats',
      statTile('Sessions logged', String(logged.length),
        logged.length ? `since ${fmtDate(logged[0].date)}` : 'none in this app yet'),
      statTile('History imported', String(state.sessions.length - logged.length),
        store.SEED_INFO.cutoff ? `from ${fmtDate(store.SEED_INFO.cutoff)}` : 'full log'),
      statTile('Rest days', last ? String(Math.max(0, daysBetween(last.date, todayISO()))) : '–',
        last ? `since ${fmtDate(last.date)}` : 'no sessions')
    ),

    last ? lastSessionCard(last, onOpenSession) : null
  );
}

function dayButton(day, isNext, active, onStart) {
  const plan = ROUTINE[day];
  const count = plan.exercises.length;
  return h('button', {
    class: `day-btn${isNext ? ' next' : ''}`,
    type: 'button',
    onclick: async () => {
      if (active) {
        const go = await confirmSheet(
          'A session is already running',
          `Day ${active.day} started ${fmtDate(active.date)}. Starting Day ${day} discards it.`,
          `Discard and start ${day}`
        );
        if (!go) return;
        store.discardActive();
      }
      onStart(day);
    },
  },
    h('span.day-letter', day),
    h('span.day-body',
      h('span.day-name', plan.title),
      h('span.day-detail', `${count} exercises · ${plan.exercises.reduce((n, e) => n + e.sets, 0)} working sets`)
    ),
    isNext ? h('span.day-flag', 'Next') : null
  );
}

function resumeCard(active, onResume) {
  const st = sessionStats(active);
  return h('div.card.resume-card',
    h('div.resume-head',
      h('span.resume-flag', 'In progress'),
      h('span.resume-when', fmtDate(active.date))
    ),
    h('h2.resume-title', `Day ${active.day} — ${planFor(active.day).title}`),
    h('p.resume-detail', `${st.workingSets} sets logged · ${st.volume.toLocaleString()} lb`),
    h('button.btn.btn-primary.btn-block', { type: 'button', onclick: onResume }, 'Resume session')
  );
}

function statTile(label, value, sub) {
  return h('div.stat-tile',
    h('span.stat-label', label),
    h('span.stat-value', value),
    h('span.stat-sub', sub)
  );
}

function lastSessionCard(s, onOpenSession) {
  const st = sessionStats(s);
  return h('button.card.last-session', { type: 'button', onclick: () => onOpenSession(s.id) },
    h('div.ls-head',
      h('span.ls-title', s.day ? `Day ${s.day}` : (s.legacyLabel || 'Session')),
      h('span.ls-date', fmtDate(s.date))
    ),
    h('div.ls-stats',
      h('span', `${st.workingSets} sets`),
      h('span', `${st.volume.toLocaleString()} lb`),
      st.prs.length ? h('span.ls-pr', `${st.prs.length} PR${st.prs.length > 1 ? 's' : ''}`) : null,
      st.durationMin ? h('span', `${st.durationMin} min`) : null
    ),
    h('span.ls-go', 'View →')
  );
}
  return { renderHome: renderHome };
})();

/* ---- js/views/session.js ---- */
var __m_js_views_session_js = (function () {
  var { h, mount, clear, toast, sheet, confirmSheet, haptic } = __m_js_dom_js;
  var { planFor, repTarget, WARMUP } = __m_js_routine_js;
  var store = __m_js_store_js;
  var { e1rm, round1, fmtWeight, fmtDate, loadSenseFor, recordFor, lastPerformance, overloadSuggestion, warmupRamp, sessionStats, PR_LABEL, PR_TITLE } = __m_js_calc_js;
// views/session.js -- the screen you actually stand in front of a barbell with.
//
// Design constraints from the spec: portrait iPhone, one thumb, low light,
// no misclicks. So: one station on screen at a time, every control >= 44px,
// steppers next to the number inputs so the keyboard is optional, and a single
// full-width "Log set" button that never moves.


let tickTimer = null;

// ---------------------------------------------------------------------------
// Stations: consecutive exercises sharing a supersetGroup are one station.
// ---------------------------------------------------------------------------

function stationsFor(day) {
  const plan = planFor(day);
  if (!plan) return [];
  const out = [];
  plan.exercises.forEach((ex, i) => {
    const prev = out[out.length - 1];
    if (ex.supersetGroup && prev && prev.group === ex.supersetGroup) {
      prev.slots.push(i);
    } else {
      out.push({ group: ex.supersetGroup || null, slots: [i] });
    }
  });
  return out;
}

function metaFor(day, slot) {
  return planFor(day).exercises[slot];
}

function plannedSets(meta) {
  return meta.sets || 1;
}

function loggedWorking(exRec) {
  return (exRec.sets || []).filter((s) => !s.warmup).length;
}

/** Within a station, whoever has logged fewest working sets goes next. */
function activeSlot(active, station) {
  let best = station.slots[0];
  let bestN = Infinity;
  for (const slot of station.slots) {
    const rec = active.exercises.find((e) => e.slot === slot);
    const n = rec ? loggedWorking(rec) : 0;
    if (n < bestN) { bestN = n; best = slot; }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Rest timer -- stored as an absolute timestamp so locking the phone, switching
// apps, or reloading the page all keep the same countdown.
// ---------------------------------------------------------------------------

function startRest(seconds) {
  if (!seconds) return;
  store.updateActive((a) => {
    a.restUntil = new Date(Date.now() + seconds * 1000).toISOString();
    a.restLength = seconds;
  });
}

function clearRest() {
  store.updateActive((a) => { a.restUntil = null; });
}

function restRemaining(active) {
  if (!active || !active.restUntil) return null;
  const ms = new Date(active.restUntil).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 1000) : 0;
}

function mmss(s) {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function restBar(active, rerender) {
  const left = restRemaining(active);
  if (left == null) return null;
  const total = active.restLength || 120;
  const pct = Math.max(0, Math.min(1, left / total));
  const done = left === 0;

  return h('div', { class: `rest-bar${done ? ' rest-done' : ''}` },
    h('div.rest-fill', { style: { width: (pct * 100).toFixed(1) + '%' } }),
    h('div.rest-row',
      h('span.rest-label', done ? 'Rest complete' : 'Rest'),
      h('span.rest-clock', done ? 'Go' : mmss(left)),
      h('div.rest-actions',
        h('button.btn-chip', {
          type: 'button',
          onclick: () => {
            store.updateActive((a) => {
              const base = Math.max(0, restRemaining(a) || 0);
              a.restUntil = new Date(Date.now() + (base + 30) * 1000).toISOString();
              a.restLength = (a.restLength || 120) + 30;
            });
            rerender();
          },
        }, '+30s'),
        h('button.btn-chip', {
          type: 'button',
          onclick: () => { clearRest(); rerender(); },
        }, done ? 'Dismiss' : 'Skip')
      )
    )
  );
}

// ---------------------------------------------------------------------------
// Sub-renderers
// ---------------------------------------------------------------------------

function prBadges(flags) {
  if (!flags || !flags.length) return null;
  return h('span.pr-badges', flags.map((f) =>
    h('span', { class: `pr-badge pr-${f}`, title: PR_TITLE[f] },
      h('span.pr-trophy', '\u{1F3C6}'), PR_LABEL[f])));
}

function setRow(set, i, { onDelete } = {}) {
  const est = set.warmup ? null : e1rm(set.weight, set.reps);
  return h('div', { class: `set-row${set.warmup ? ' set-warmup' : ''}` },
    h('span.set-num', set.warmup ? 'W' : set.setNum),
    h('span.set-load', `${fmtWeight(set.weight)} × ${set.reps}`),
    set.rir != null ? h('span.set-rir', `RIR ${set.rir}`) : null,
    est ? h('span.set-e1rm', `e1RM ${Math.round(est)}`) : null,
    prBadges(set.prFlags),
    onDelete
      ? h('button.set-del', { type: 'button', 'aria-label': 'Delete set', onclick: () => onDelete(i) }, '×')
      : null
  );
}

function lastTimePanel(name, activeId) {
  const last = lastPerformance(store.sessionsWithActive(), name, activeId);
  if (!last) {
    return h('div.last-panel.last-empty', 'No history for this lift yet — today sets the baseline.');
  }
  const working = last.sets.filter((s) => !s.warmup);
  const shown = working.length ? working : last.sets;
  return h('div.last-panel',
    h('div.last-head',
      h('span.last-title', 'Last time'),
      h('span.last-date', fmtDate(last.date) + (last.legacyLabel ? ` · ${last.legacyLabel}` : ''))
    ),
    h('div.last-sets', shown.map((s) =>
      h('span.last-set', `${fmtWeight(s.weight)}×${s.reps}`)))
  );
}

function recordPanel(name) {
  const sense = loadSenseFor(name);
  const rec = recordFor(store.sessionsWithActive(), name);
  if (!rec.bestSet && rec.maxWeight == null) return null;
  return h('div.record-panel',
    sense === 'assist'
      ? h('span', h('b', 'Least assist '), fmtWeight(rec.minWeight) + ' lb')
      : h('span', h('b', 'Best '), rec.bestSet
          ? `${fmtWeight(rec.bestSet.weight)}×${rec.bestSet.reps} · e1RM ${round1(rec.bestSet.e1rm)}`
          : `${fmtWeight(rec.maxWeight)} lb`),
    rec.maxWeight != null && sense !== 'assist'
      ? h('span', h('b', 'Top load '), `${fmtWeight(rec.maxWeight)} lb`)
      : null
  );
}

// ---------------------------------------------------------------------------
// The input row
// ---------------------------------------------------------------------------

function numberField({ label, value, step, min, mode, id, onChange }) {
  const input = h('input', {
    class: 'num-input', id, type: 'text', inputmode: mode, size: 4,
    value: value == null ? '' : String(value),
    autocomplete: 'off', autocorrect: 'off', spellcheck: false,
    onfocus: (e) => e.target.select(),
    oninput: () => onChange(input.value),
  });
  const bump = (dir) => {
    const cur = parseFloat(input.value);
    const base = isFinite(cur) ? cur : 0;
    const next = Math.max(min, Math.round((base + dir * step) * 100) / 100);
    input.value = String(next);
    onChange(input.value);
    haptic();
  };
  return {
    input,
    node: h('div.num-field',
      h('label.num-label', { for: id }, label),
      h('div.num-row',
        h('button.num-btn', { type: 'button', 'aria-label': `Decrease ${label}`, onclick: () => bump(-1) }, '−'),
        input,
        h('button.num-btn', { type: 'button', 'aria-label': `Increase ${label}`, onclick: () => bump(1) }, '+')
      )
    ),
  };
}

// ---------------------------------------------------------------------------
// Main render
// ---------------------------------------------------------------------------

function renderSession(root, { onFinish }) {
  const draft = { weight: null, reps: null, rir: null, warmup: false, slot: null };

  function rerender() {
    const active = store.activeSession();
    if (!active) { onFinish(); return; }
    mount(root, build(active));
  }

  function build(active) {
    const stations = stationsFor(active.day);
    const idx = Math.max(0, Math.min(stations.length - 1, active.cursor || 0));
    const station = stations[idx];
    const slot = activeSlot(active, station);
    const meta = metaFor(active.day, slot);
    const exRec = active.exercises.find((e) => e.slot === slot);
    const name = exRec.name;

    // Reset the draft when the focused exercise changes.
    if (draft.slot !== slot) {
      draft.slot = slot;
      draft.rir = null;
      draft.warmup = false;
      const last = lastPerformance(store.sessionsWithActive(), name, active.id);
      const nth = loggedWorking(exRec);
      const lastWorking = last ? last.sets.filter((s) => !s.warmup) : [];
      const prior = lastWorking[Math.min(nth, Math.max(0, lastWorking.length - 1))];
      const prevThisSession = (exRec.sets || []).filter((s) => !s.warmup).slice(-1)[0];
      draft.weight = prevThisSession ? prevThisSession.weight
        : (prior ? prior.weight : null);
      draft.reps = meta.repRange ? meta.repRange[0] : 8;
    }

    const warmupPhase = !active.warmupCompleted;

    return h('div.session-view',
      sessionHeader(active, stations, idx),
      warmupPhase
        ? warmupBlock(active, rerender)
        : h('div',
            stationBody(active, station, slot, meta, exRec, idx, stations.length),
            restBar(active, rerender)
          )
    );
  }

  function sessionHeader(active, stations, idx) {
    const st = sessionStats(active);
    return h('header.session-header',
      h('div.session-header-row',
        h('div',
          h('h1.session-title', `Day ${active.day}`),
          h('p.session-sub', planFor(active.day).title)
        ),
        h('button.btn.btn-ghost.btn-sm', {
          type: 'button',
          onclick: () => endMenu(active),
        }, 'End')
      ),
      h('div.session-meta',
        h('span', `${st.workingSets} sets`),
        h('span', `${st.volume.toLocaleString()} lb`),
        st.prs.length ? h('span.meta-pr', `${st.prs.length} PR${st.prs.length > 1 ? 's' : ''}`) : null,
        h('span', elapsed(active))
      ),
      active.warmupCompleted
        ? h('div.station-dots', stations.map((s, i) =>
            h('button', {
              class: `dot-btn${i === idx ? ' current' : ''}${stationDone(active, s) ? ' done' : ''}`,
              type: 'button',
              'aria-label': `Station ${i + 1}`,
              onclick: () => { store.setActiveCursor(i); rerender(); },
            })))
        : null
    );
  }

  function stationDone(active, station) {
    return station.slots.every((slot) => {
      const rec = active.exercises.find((e) => e.slot === slot);
      return rec && loggedWorking(rec) >= plannedSets(metaFor(active.day, slot));
    });
  }

  function elapsed(active) {
    const ms = Date.now() - new Date(active.startTime).getTime();
    const min = Math.floor(ms / 60000);
    return min < 60 ? `${min} min` : `${Math.floor(min / 60)}h ${min % 60}m`;
  }

  // -- warmup ---------------------------------------------------------------

  function warmupBlock(active, rerender) {
    const checks = active.warmupChecks || [];
    return h('div.card.warmup-card',
      h('h2.card-title', 'Warmup'),
      h('p.card-sub', 'Tap each when it is done. No weight, no reps.'),
      h('ul.warmup-list', WARMUP.map((w, i) =>
        h('li',
          h('button', {
            class: `check-row${checks[i] ? ' checked' : ''}`,
            type: 'button',
            onclick: () => { store.toggleWarmup(i); haptic(); rerender(); },
          },
            h('span.check-box', checks[i] ? '✓' : ''),
            h('span.check-text', h('b', w.name), h('span.check-sub', w.prescription))
          ))
      )),
      h('button.btn.btn-primary.btn-block', {
        type: 'button',
        onclick: () => { store.markWarmupDone(); rerender(); },
      }, checks.filter(Boolean).length === WARMUP.length ? 'Start lifting' : 'Skip to lifting')
    );
  }

  // -- station --------------------------------------------------------------

  function stationBody(active, station, slot, meta, exRec, idx, total) {
    const cards = station.slots.map((s) => {
      const m = metaFor(active.day, s);
      const rec = active.exercises.find((e) => e.slot === s);
      return exerciseCard(active, m, rec, s === slot);
    });

    return h('div',
      station.slots.length > 1
        ? h('p.superset-flag', 'Superset — alternate between the two, rest after the pair')
        : null,
      cards,
      inputPanel(active, meta, exRec, slot),
      h('div.station-nav',
        h('button.btn.btn-ghost', {
          type: 'button', disabled: idx === 0,
          onclick: () => { store.setActiveCursor(idx - 1); rerender(); },
        }, '← Prev'),
        h('span.station-count', `${idx + 1} / ${total}`),
        h('button.btn.btn-ghost', {
          type: 'button', disabled: idx >= total - 1,
          onclick: () => { store.setActiveCursor(idx + 1); rerender(); },
        }, 'Next →')
      )
    );
  }

  function exerciseCard(active, meta, exRec, isActive) {
    const name = exRec.name;
    const done = loggedWorking(exRec);
    const target = plannedSets(meta);
    const alts = meta.alternatives || [];

    return h('div', { class: `card exercise-card${isActive ? ' active' : ''}` },
      h('div.exercise-head',
        h('div',
          alts.length > 1
            ? h('button.exercise-name.swappable', {
                type: 'button',
                onclick: () => pickAlternative(active, exRec, alts),
              }, name, h('span.swap-hint', '⇄'))
            : h('h2.exercise-name', name),
          meta.notes ? h('p.exercise-note', meta.notes) : null
        ),
        h('div.exercise-target',
          h('span.target-sets', `${done}/${target}`),
          h('span.target-reps', `× ${repTarget(meta)}${meta.unilateral ? ' /side' : ''}`)
        )
      ),
      isActive ? overloadBanner(meta, name, active.id) : null,
      isActive ? lastTimePanel(name, active.id) : null,
      isActive ? recordPanel(name) : null,
      (exRec.sets || []).length
        ? h('div.set-list', exRec.sets.map((s, i) =>
            setRow(s, i, {
              onDelete: async (j) => {
                if (await confirmSheet('Delete set?', `${fmtWeight(s.weight)} × ${s.reps} will be removed.`, 'Delete')) {
                  store.deleteSet(exRec.slot, j);
                  rerender();
                }
              },
            })))
        : null
    );
  }

  function overloadBanner(meta, name, activeId) {
    const last = lastPerformance(store.sessionsWithActive(), name, activeId);
    const s = overloadSuggestion(meta, last);
    if (!s) return null;
    return h('div', { class: `overload${s.kind === 'hard' ? ' overload-hard' : ''}` },
      h('span.overload-icon', s.kind === 'hard' ? '↑' : '○'),
      h('span.overload-text', s.text),
      s.suggested != null
        ? h('button.btn-chip', {
            type: 'button',
            onclick: () => { draft.weight = s.suggested; rerender(); },
          }, `Use ${fmtWeight(s.suggested)}`)
        : null
    );
  }

  function pickAlternative(active, exRec, alts) {
    sheet({
      title: 'Swap exercise',
      body: h('div.pick-list', alts.map((a) =>
        h('button', {
          class: `pick-row${a === exRec.name ? ' picked' : ''}`,
          type: 'button',
          onclick: () => {
            store.renameActiveExercise(exRec.slot, a);
            draft.slot = null;
            rerender();
            document.querySelector('.sheet-overlay')?.click();
          },
        }, a))),
      actions: [{ label: 'Close' }],
    });
  }

  // -- input ----------------------------------------------------------------

  function inputPanel(active, meta, exRec, slot) {
    const sense = loadSenseFor(exRec.name);
    const weightField = numberField({
      label: sense === 'assist' ? 'Assist (lb)' : 'Weight (lb)',
      id: 'f-weight', value: draft.weight, step: meta.increment || 5, min: 0,
      mode: 'decimal', onChange: (v) => { draft.weight = v; },
    });
    const repsField = numberField({
      label: meta.unilateral ? 'Reps / side' : 'Reps',
      id: 'f-reps', value: draft.reps, step: 1, min: 0,
      mode: 'numeric', onChange: (v) => { draft.reps = v; },
    });

    const rirChip = (v, label) => h('button', {
      class: `rir-chip${draft.rir === v ? ' on' : ''}`,
      type: 'button',
      onclick: (e) => {
        draft.rir = draft.rir === v ? null : v;
        [...e.target.parentNode.children].forEach((c) => c.classList.remove('on'));
        if (draft.rir === v) e.target.classList.add('on');
        haptic();
      },
    }, label);

    return h('div.input-panel',
      h('div.num-grid', weightField.node, repsField.node),
      h('div.rir-row',
        h('span.rir-label', 'RIR'),
        h('div.rir-chips', rirChip(0, '0'), rirChip(1, '1'), rirChip(2, '2'), rirChip(3, '3+')),
        h('label.warmup-toggle',
          h('input', {
            type: 'checkbox', checked: draft.warmup,
            onchange: (e) => { draft.warmup = e.target.checked; },
          }),
          'Warmup set'
        )
      ),
      h('button.btn.btn-primary.btn-log', {
        type: 'button',
        onclick: () => doLog(active, meta, exRec, slot),
      }, 'Log set'),
      meta.ramp
        ? h('button.btn.btn-ghost.btn-block.btn-sm', {
            type: 'button',
            onclick: () => rampSheet(meta, exRec, slot),
          }, 'Warmup ramp calculator')
        : null
    );
  }

  function doLog(active, meta, exRec, slot) {
    const reps = parseInt(draft.reps, 10);
    if (!isFinite(reps) || reps <= 0) {
      toast('Enter reps first', { tone: 'warn' });
      return;
    }
    const weightRaw = draft.weight === '' || draft.weight == null ? null : parseFloat(draft.weight);
    const weight = isFinite(weightRaw) ? weightRaw : null;

    const set = store.logSet(slot, { weight, reps, rir: draft.rir, warmup: draft.warmup });
    haptic(18);

    if (set && set.prFlags && set.prFlags.length) {
      toast(`${set.prFlags.map((f) => PR_LABEL[f]).join(' + ')} — ${fmtWeight(weight)} × ${reps}`, { tone: 'pr', ms: 3400 });
      haptic(60);
    }

    if (!draft.warmup) {
      const stations = stationsFor(active.day);
      const station = stations[active.cursor || 0];
      const isSupersetLead = station.slots.length > 1 && slot !== station.slots[station.slots.length - 1];
      startRest(isSupersetLead ? 0 : (meta.rest || 90));
    }

    draft.rir = null;
    draft.warmup = false;
    draft.slot = null;  // recompute prefill for whoever is next
    rerender();
  }

  function rampSheet(meta, exRec, slot) {
    const target = parseFloat(draft.weight);
    const body = h('div');
    const render = (t) => {
      const ramp = warmupRamp(t);
      mount(body,
        h('p.sheet-text', ramp.length
          ? `Ramp to ${fmtWeight(t)} lb. Tap a row to log it as a warmup set.`
          : 'Enter a working weight above first.'),
        h('div.ramp-list', ramp.map((r) =>
          h('button.ramp-row', {
            type: 'button',
            onclick: () => {
              store.logSet(slot, { weight: r.weight, reps: r.reps, warmup: true });
              toast(`Logged warmup ${fmtWeight(r.weight)} × ${r.reps}`);
              rerender();
            },
          },
            h('span.ramp-pct', `${Math.round(r.pct * 100)}%`),
            h('span.ramp-load', `${fmtWeight(r.weight)} × ${r.reps}`)
          ))),
        h('p.sheet-note', 'Rounded to the nearest 5 lb, floored at the 45 lb bar.')
      );
    };
    render(isFinite(target) ? target : 0);
    sheet({ title: `${exRec.name} — warmup ramp`, body, actions: [{ label: 'Done' }] });
  }

  // -- ending ---------------------------------------------------------------

  function endMenu(active) {
    const notes = h('textarea.notes-input', {
      rows: 3,
      placeholder: 'Sleep, recovery, how it felt, cardio same-day…',
      value: active.notes || '',
      oninput: (e) => store.setActiveNotes(e.target.value),
    });
    sheet({
      title: 'End session',
      body: h('div', h('label.field-label', 'Session notes'), notes),
      actions: [
        { label: 'Keep going', variant: 'btn-ghost' },
        {
          label: 'Discard',
          variant: 'btn-danger',
          onClick: async () => {
            if (await confirmSheet('Discard session?', 'Every set logged today will be deleted. This cannot be undone.', 'Discard')) {
              store.discardActive();
              onFinish();
            }
            return true;
          },
        },
        {
          label: 'Finish',
          variant: 'btn-primary',
          onClick: () => { const done = store.finishActive(); onFinish(done); },
        },
      ],
    });
  }

  // -- lifecycle ------------------------------------------------------------

  rerender();
  clearInterval(tickTimer);
  tickTimer = setInterval(() => {
    const a = store.activeSession();
    if (!a) return;
    const bar = root.querySelector('.rest-bar');
    const left = restRemaining(a);
    if (left == null) return;
    if (!bar) { rerender(); return; }
    const clock = bar.querySelector('.rest-clock');
    const fill = bar.querySelector('.rest-fill');
    const label = bar.querySelector('.rest-label');
    if (left === 0) {
      if (!bar.classList.contains('rest-done')) { haptic(140); }
      bar.classList.add('rest-done');
      if (clock) clock.textContent = 'Go';
      if (label) label.textContent = 'Rest complete';
      if (fill) fill.style.width = '0%';
    } else {
      if (clock) clock.textContent = mmss(left);
      if (fill) fill.style.width = ((left / (a.restLength || 120)) * 100).toFixed(1) + '%';
    }
  }, 1000);

  return () => clearInterval(tickTimer);
}
  return { stationsFor: stationsFor, renderSession: renderSession };
})();

/* ---- js/charts.js ---- */
var __m_js_charts_js = (function () {
  var { h, svg, clear } = __m_js_dom_js;
  var { fmtDate } = __m_js_calc_js;
// charts.js -- hand-rolled inline SVG charts.
//
// No chart library on purpose: this app has to work with the phone in airplane
// mode, and a CDN script is the one thing a service worker can silently fail to
// have. Everything here is one file, ~200 lines, and renders from a plain array.
//
// House rules followed (see the dataviz reference):
//   * one y-scale per plot, never two
//   * single series -> no legend; the card title names what is plotted
//   * 2px line, >=8px end markers with a 2px surface ring
//   * bars capped at 24px with a 4px rounded cap and a 2px gap between them
//   * hairline solid gridlines one step off the surface, never dashed
//   * exactly one direct label (the latest value); the axis and the tooltip
//     carry the rest, and every chart ships with a table-view twin
//   * text wears text tokens, never the series color


const W = 320;
const H = 148;
const PAD = { top: 14, right: 46, bottom: 22, left: 34 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

function niceTicks(min, max, count = 3) {
  if (!isFinite(min) || !isFinite(max)) return [0, 1];
  if (min === max) return [min];
  const span = max - min;
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const out = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) {
    out.push(Math.round(v * 100) / 100);
  }
  return out.length ? out : [min, max];
}

function scales(values, { zeroBased = false } = {}) {
  const clean = values.filter((v) => v != null && isFinite(v));
  if (!clean.length) return null;
  let min = Math.min(...clean);
  let max = Math.max(...clean);
  if (zeroBased) min = 0;
  if (min === max) { min = zeroBased ? 0 : min * 0.95; max = max * 1.05 || 1; }
  else if (!zeroBased) {
    const pad = (max - min) * 0.15;
    min -= pad; max += pad;
  }
  return { min, max };
}

function frame(ticks, sc, xLabels) {
  const y = (v) => PAD.top + PLOT_H - ((v - sc.min) / (sc.max - sc.min)) * PLOT_H;
  const parts = [];
  for (const t of ticks) {
    const yy = y(t);
    if (yy < PAD.top - 1 || yy > PAD.top + PLOT_H + 1) continue;
    parts.push(svg('line', {
      class: 'grid', x1: PAD.left, x2: PAD.left + PLOT_W, y1: yy, y2: yy,
    }));
    parts.push(svg('text', {
      class: 'tick', x: PAD.left - 6, y: yy + 3.5, 'text-anchor': 'end',
    }, compact(t)));
  }
  for (const l of xLabels) {
    parts.push(svg('text', {
      class: 'tick', x: l.x, y: H - 6, 'text-anchor': l.anchor || 'middle',
    }, l.text));
  }
  return parts;
}

function compact(n) {
  const v = Number(n);
  if (Math.abs(v) >= 10000) return (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + 'k';
  if (Math.abs(v) >= 1000) return v.toLocaleString();
  return String(Math.round(v * 10) / 10);
}

function xLabelsFor(points, xOf) {
  if (!points.length) return [];
  const out = [{ x: xOf(0), text: fmtDate(points[0].date), anchor: 'start' }];
  if (points.length > 2) {
    const mid = Math.floor((points.length - 1) / 2);
    out.push({ x: xOf(mid), text: fmtDate(points[mid].date) });
  }
  if (points.length > 1) {
    out.push({ x: xOf(points.length - 1), text: fmtDate(points[points.length - 1].date), anchor: 'end' });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Tooltip / hover layer
// ---------------------------------------------------------------------------

function attachHover(card, root, points, positions, describe) {
  if (!points.length) return;
  const tip = h('div.chart-tip', { hidden: true });
  card.appendChild(tip);

  const cursor = svg('line', { class: 'cursor', y1: PAD.top, y2: PAD.top + PLOT_H, x1: 0, x2: 0, opacity: 0 });
  root.appendChild(cursor);

  const nearest = (clientX) => {
    const box = root.getBoundingClientRect();
    const vx = ((clientX - box.left) / box.width) * W;
    let best = 0;
    let bestD = Infinity;
    positions.forEach((p, i) => {
      const d = Math.abs(p.x - vx);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  };

  const show = (e) => {
    const i = nearest(e.clientX);
    const p = positions[i];
    cursor.setAttribute('x1', p.x);
    cursor.setAttribute('x2', p.x);
    cursor.setAttribute('opacity', 1);
    tip.hidden = false;
    clear(tip);
    tip.appendChild(h('div.chart-tip-date', fmtDate(points[i].date)));
    tip.appendChild(h('div.chart-tip-value', describe(points[i])));
    const box = root.getBoundingClientRect();
    const left = (p.x / W) * box.width;
    tip.style.left = Math.max(4, Math.min(box.width - 4, left)) + 'px';
  };
  const hide = () => { tip.hidden = true; cursor.setAttribute('opacity', 0); };

  root.addEventListener('pointerdown', show);
  root.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'mouse') show(e); });
  root.addEventListener('pointerleave', hide);
  root.addEventListener('pointerup', () => setTimeout(hide, 2200));
}

// ---------------------------------------------------------------------------
// Public: line chart
// ---------------------------------------------------------------------------

/**
 * @param points  [{ date, hasPR }, ...] oldest first
 * @param value   (point) => number | null
 */
function lineChart(points, value, { title, sub, unit = '', describe } = {}) {
  const card = h('div.chart-card');
  card.appendChild(h('div.chart-head',
    h('h3.chart-title', title),
    sub ? h('p.chart-sub', sub) : null
  ));

  const vals = points.map(value);
  const sc = scales(vals);
  if (!sc || vals.filter((v) => v != null).length < 2) {
    card.appendChild(h('p.chart-empty',
      vals.filter((v) => v != null).length === 1
        ? 'One session logged — a second one draws the trend.'
        : 'No data yet.'));
    return card;
  }

  const xOf = (i) => points.length === 1
    ? PAD.left + PLOT_W / 2
    : PAD.left + (i / (points.length - 1)) * PLOT_W;
  const yOf = (v) => PAD.top + PLOT_H - ((v - sc.min) / (sc.max - sc.min)) * PLOT_H;

  const ticks = niceTicks(sc.min, sc.max, 3);
  const root = svg('svg', {
    class: 'chart', viewBox: `0 0 ${W} ${H}`,
    role: 'img', 'aria-label': `${title}: ${compact(vals[0])} to ${compact(vals[vals.length - 1])} ${unit}`,
  });

  frame(ticks, sc, xLabelsFor(points, xOf)).forEach((p) => root.appendChild(p));

  const positions = points.map((p, i) => ({ x: xOf(i), y: vals[i] == null ? null : yOf(vals[i]) }));
  const drawn = positions.filter((p) => p.y != null);

  // Area wash at ~10% under the line.
  const areaD = `M ${drawn[0].x} ${PAD.top + PLOT_H} `
    + drawn.map((p) => `L ${p.x} ${p.y}`).join(' ')
    + ` L ${drawn[drawn.length - 1].x} ${PAD.top + PLOT_H} Z`;
  root.appendChild(svg('path', { class: 'area', d: areaD }));
  root.appendChild(svg('path', {
    class: 'line', d: 'M ' + drawn.map((p) => `${p.x} ${p.y}`).join(' L '),
  }));

  // Markers: PR sessions get the status hue, everything else the series hue.
  positions.forEach((p, i) => {
    if (p.y == null) return;
    const isLast = i === positions.length - 1;
    const pr = points[i].hasPR;
    if (!pr && !isLast && points.length > 12) return; // keep dense series clean
    root.appendChild(svg('circle', {
      class: `dot${pr ? ' dot-pr' : ''}${isLast ? ' dot-last' : ''}`,
      cx: p.x, cy: p.y, r: isLast ? 4.5 : 3.5,
    }));
  });

  // Exactly one direct label: the latest value.
  const last = drawn[drawn.length - 1];
  const lastVal = vals[vals.length - 1];
  root.appendChild(svg('text', {
    class: 'endlabel', x: Math.min(last.x + 8, W - 4), y: Math.max(PAD.top + 4, Math.min(last.y + 4, H - PAD.bottom)),
  }, compact(lastVal) + (unit ? ' ' + unit : '')));

  card.appendChild(root);
  attachHover(card, root, points, positions,
    describe || ((p) => `${compact(value(p))} ${unit}`.trim()));
  return card;
}

// ---------------------------------------------------------------------------
// Public: bar chart
// ---------------------------------------------------------------------------

function barChart(points, value, { title, sub, unit = '', describe } = {}) {
  const card = h('div.chart-card');
  card.appendChild(h('div.chart-head',
    h('h3.chart-title', title),
    sub ? h('p.chart-sub', sub) : null
  ));

  const vals = points.map(value);
  const sc = scales(vals, { zeroBased: true });
  if (!sc || !vals.filter((v) => v != null).length) {
    card.appendChild(h('p.chart-empty', 'No data yet.'));
    return card;
  }

  const band = PLOT_W / Math.max(points.length, 1);
  const GAP = 2;
  const barW = Math.min(24, Math.max(3, band - GAP));
  const xOf = (i) => PAD.left + band * i + band / 2;
  const yOf = (v) => PAD.top + PLOT_H - ((v - sc.min) / (sc.max - sc.min)) * PLOT_H;

  const ticks = niceTicks(sc.min, sc.max, 2);
  const root = svg('svg', {
    class: 'chart', viewBox: `0 0 ${W} ${H}`,
    role: 'img', 'aria-label': `${title}, ${points.length} sessions`,
  });
  frame(ticks, sc, xLabelsFor(points, xOf)).forEach((p) => root.appendChild(p));

  const baseline = PAD.top + PLOT_H;
  points.forEach((p, i) => {
    const v = vals[i];
    if (v == null) return;
    const y = yOf(v);
    const height = Math.max(1.5, baseline - y);
    const r = Math.min(4, barW / 2, height);
    const x = xOf(i) - barW / 2;
    // Square at the baseline, 4px rounded at the data end.
    const d = `M ${x} ${baseline} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y}`
      + ` L ${x + barW - r} ${y} Q ${x + barW} ${y} ${x + barW} ${y + r}`
      + ` L ${x + barW} ${baseline} Z`;
    root.appendChild(svg('path', { class: `bar${p.hasPR ? ' bar-pr' : ''}`, d }));
  });

  root.appendChild(svg('line', {
    class: 'axis', x1: PAD.left, x2: PAD.left + PLOT_W, y1: baseline, y2: baseline,
  }));

  const lastVal = vals[vals.length - 1];
  if (lastVal != null) {
    root.appendChild(svg('text', {
      class: 'endlabel',
      x: Math.min(xOf(points.length - 1) + barW / 2 + 6, W - 4),
      y: Math.max(PAD.top + 4, yOf(lastVal) + 4),
    }, compact(lastVal) + (unit ? ' ' + unit : '')));
  }

  card.appendChild(root);
  attachHover(card, root, points, points.map((p, i) => ({ x: xOf(i) })),
    describe || ((p) => `${compact(value(p))} ${unit}`.trim()));
  return card;
}

// ---------------------------------------------------------------------------
// Table-view twin -- every chart's values, reachable without hovering anything.
// ---------------------------------------------------------------------------

function chartTable(points, columns) {
  const wrap = h('details.chart-table',
    h('summary', 'Table view'),
    h('div.table-scroll',
      h('table',
        h('thead', h('tr', h('th', 'Date'), columns.map((c) => h('th', c.label)))),
        h('tbody', [...points].reverse().map((p) => h('tr',
          h('td', fmtDate(p.date)),
          columns.map((c) => h('td', c.get(p) == null ? '–' : String(c.get(p))))
        )))
      )
    )
  );
  return wrap;
}
  return { lineChart: lineChart, barChart: barChart, chartTable: chartTable };
})();

/* ---- js/views/history.js ---- */
var __m_js_views_history_js = (function () {
  var { h, mount, confirmSheet, toast } = __m_js_dom_js;
  var store = __m_js_store_js;
  var { lineChart, barChart, chartTable } = __m_js_charts_js;
  var { sessionStats, sortSessions, exerciseIndex, exerciseSeries, recordFor, loadSenseFor, e1rm, round1, fmtWeight, fmtDate, fmtDateLong, PR_LABEL, PR_TITLE } = __m_js_calc_js;
  var { ROUTINE_EXERCISES } = __m_js_routine_js;
// views/history.js -- session list, session detail, exercise list, exercise detail.


// ---------------------------------------------------------------------------
// Tab 1: sessions
// ---------------------------------------------------------------------------

function renderHistory(root, { tab = 'sessions', onOpenSession, onOpenExercise, onTab }) {
  const sessions = sortSessions(store.allSessions()).reverse();

  mount(root,
    h('header.page-header',
      h('h1.page-title', 'History'),
      h('p.page-sub', `${sessions.length} sessions · ${exerciseIndex(store.allSessions()).length} exercises`)
    ),
    h('div.seg',
      segBtn('Sessions', tab === 'sessions', () => onTab('sessions')),
      segBtn('Exercises', tab === 'exercises', () => onTab('exercises'))
    ),
    tab === 'sessions'
      ? sessionList(sessions, onOpenSession)
      : exerciseList(onOpenExercise)
  );
}

function segBtn(label, on, onclick) {
  return h('button', { class: `seg-btn${on ? ' on' : ''}`, type: 'button', onclick }, label);
}

function sessionList(sessions, onOpenSession) {
  if (!sessions.length) return h('p.empty', 'Nothing logged yet.');
  return h('div.session-list', sessions.map((s) => {
    const st = sessionStats(s);
    return h('button.session-row', { type: 'button', onclick: () => onOpenSession(s.id) },
      h('div.sr-left',
        h('span.sr-day', s.day ? s.day : '–'),
        h('span.sr-when', fmtDate(s.date))
      ),
      h('div.sr-mid',
        h('span.sr-title', s.day ? titleFor(s) : (s.legacyLabel || 'Imported session')),
        h('span.sr-detail',
          `${st.workingSets} sets · ${st.volume.toLocaleString()} lb`
          + (st.durationMin ? ` · ${st.durationMin} min` : '')
        )
      ),
      st.prs.length ? h('span.sr-pr', `${st.prs.length} PR`) : null
    );
  }));
}

function titleFor(s) {
  return s.title || `Day ${s.day}`;
}

// ---------------------------------------------------------------------------
// Session detail
// ---------------------------------------------------------------------------

function renderSessionDetail(root, id, { onBack, onOpenExercise }) {
  const s = store.getSession(id);
  if (!s) { mount(root, h('p.empty', 'Session not found.')); return; }
  const st = sessionStats(s);

  mount(root,
    h('header.page-header',
      h('button.back-btn', { type: 'button', onclick: onBack }, '← History'),
      h('h1.page-title', s.day ? `Day ${s.day} — ${titleFor(s)}` : (s.legacyLabel || 'Imported session')),
      h('p.page-sub', fmtDateLong(s.date) + (s.source === 'xlsx' ? ' · imported from the spreadsheet' : ''))
    ),

    h('section.detail-stats',
      tile('Working sets', String(st.workingSets)),
      tile('Volume', st.volume.toLocaleString(), 'lb'),
      tile('PRs', String(st.prs.length)),
      tile('Duration', st.durationMin ? String(st.durationMin) : '–', st.durationMin ? 'min' : '')
    ),

    st.prs.length
      ? h('div.card.pr-card',
          h('h2.card-title', 'Records set'),
          h('ul.pr-list', st.prs.map((p) =>
            h('li',
              h('span', { class: `pr-badge pr-${p.type}`, title: PR_TITLE[p.type] },
                h('span.pr-trophy', '\u{1F3C6}'), PR_LABEL[p.type]),
              h('span.pr-ex', p.exercise),
              h('span.pr-load', `${fmtWeight(p.weight)} × ${p.reps}`))))
        )
      : null,

    h('div.exercise-log', (s.exercises || []).map((ex) =>
      h('div.card.log-card',
        h('button.log-head', { type: 'button', onclick: () => onOpenExercise(ex.name) },
          h('h3.log-name', ex.name),
          h('span.log-go', 'Trend →')
        ),
        h('div.set-list', (ex.sets || []).map((set) => {
          const est = set.warmup ? null : e1rm(set.weight, set.reps);
          return h('div', { class: `set-row${set.warmup ? ' set-warmup' : ''}` },
            h('span.set-num', set.warmup ? 'W' : set.setNum),
            h('span.set-load', `${fmtWeight(set.weight)} × ${set.reps}`),
            set.rir != null ? h('span.set-rir', `RIR ${set.rir}`) : null,
            est ? h('span.set-e1rm', `e1RM ${Math.round(est)}`) : null,
            (set.prFlags || []).length
              ? h('span.pr-badges', set.prFlags.map((f) =>
                  h('span', { class: `pr-badge pr-${f}`, title: PR_TITLE[f] },
                    h('span.pr-trophy', '\u{1F3C6}'), PR_LABEL[f])))
              : null
          );
        }))
      ))),

    h('div.card',
      h('h2.card-title', 'Notes'),
      h('textarea.notes-input', {
        rows: 3,
        placeholder: 'Sleep, recovery, how it felt…',
        value: s.notes || '',
        oninput: (e) => store.setSessionNotes(id, e.target.value),
      })
    ),

    s.source !== 'xlsx'
      ? h('button.btn.btn-danger.btn-block', {
          type: 'button',
          onclick: async () => {
            if (await confirmSheet('Delete session?', `${fmtDateLong(s.date)} will be removed permanently.`, 'Delete')) {
              store.deleteSession(id);
              toast('Session deleted');
              onBack();
            }
          },
        }, 'Delete session')
      : null
  );
}

function tile(label, value, unit, sub) {
  return h('div.stat-tile',
    h('span.stat-label', label),
    h('span.stat-value', value, unit ? h('span.stat-unit', ' ' + unit) : null),
    sub ? h('span.stat-sub', sub) : null
  );
}

// ---------------------------------------------------------------------------
// Tab 2: exercises
// ---------------------------------------------------------------------------

function exerciseList(onOpenExercise) {
  const rows = exerciseIndex(store.allSessions());
  const inRoutine = rows.filter((r) => ROUTINE_EXERCISES.has(r.name));
  const retired = rows.filter((r) => !ROUTINE_EXERCISES.has(r.name));

  const group = (title, sub, list) => list.length
    ? h('section.ex-group',
        h('div.section-head', h('h2.section-title', title), h('span.section-hint', sub)),
        h('div.ex-list', list.map((r) =>
          h('button.ex-row', { type: 'button', onclick: () => onOpenExercise(r.name) },
            h('span.ex-name', r.name),
            h('span.ex-meta',
              `${r.sessions} session${r.sessions > 1 ? 's' : ''}`,
              r.bestE1rm ? h('span.ex-best', `best e1RM ${round1(r.bestE1rm)}`) : null
            ),
            h('span.ex-go', '→')
          ))))
    : null;

  return h('div',
    group('On the routine', 'tracked in sessions', inRoutine),
    group('History only', 'kept for the record, not in the picker', retired)
  );
}

// ---------------------------------------------------------------------------
// Exercise detail -- three single-series charts, never a dual axis.
// ---------------------------------------------------------------------------

function renderExercise(root, name, { onBack, onOpenSession }) {
  const points = exerciseSeries(store.allSessions(), name);
  const rec = recordFor(store.allSessions(), name);
  const sense = loadSenseFor(name);

  mount(root,
    h('header.page-header',
      h('button.back-btn', { type: 'button', onclick: onBack }, '← History'),
      h('h1.page-title', name),
      h('p.page-sub', points.length
        ? `${points.length} sessions · ${fmtDate(points[0].date)} → ${fmtDate(points[points.length - 1].date)}`
        : 'No history yet')
    ),

    h('section.detail-stats',
      tile(sense === 'assist' ? 'Least assist' : 'Best e1RM',
        sense === 'assist'
          ? (rec.minWeight == null ? '–' : fmtWeight(rec.minWeight))
          : (rec.maxE1rm == null ? '–' : String(round1(rec.maxE1rm))),
        'lb'),
      tile(sense === 'assist' ? 'Most assist' : 'Top load',
        rec.maxWeight == null ? '–' : fmtWeight(rec.maxWeight), 'lb'),
      tile('Best set', rec.bestSet ? `${fmtWeight(rec.bestSet.weight)}×${rec.bestSet.reps}` : '–',
        '', rec.bestSet ? fmtDate(rec.bestSet.date) : '')
    ),

    !points.length
      ? h('p.empty', 'Log a set to start the trend.')
      : h('div.charts',
          sense !== 'assist'
            ? lineChart(points, (p) => p.e1rm, {
                title: 'Top-set e1RM',
                sub: 'Epley estimate from the best working set of each session',
                unit: 'lb',
                describe: (p) => `e1RM ${p.e1rm} lb${p.hasPR ? ' · PR' : ''}`,
              })
            : null,
          lineChart(points, (p) => p.weight, {
            title: sense === 'assist' ? 'Assist load' : 'Best working-set weight',
            sub: sense === 'assist' ? 'Lower is stronger' : 'Heaviest working set of each session',
            unit: 'lb',
            describe: (p) => `${fmtWeight(p.weight)} lb across ${p.sets} sets`,
          }),
          barChart(points, (p) => p.volume, {
            title: 'Volume per session',
            sub: 'Working sets only, weight × reps',
            unit: 'lb',
            describe: (p) => `${p.volume.toLocaleString()} lb · ${p.sets} sets`,
          }),
          chartTable(points, [
            { label: 'e1RM', get: (p) => p.e1rm },
            { label: 'Top load', get: (p) => p.weight },
            { label: 'Sets', get: (p) => p.sets },
            { label: 'Volume', get: (p) => p.volume.toLocaleString() },
            { label: 'PR', get: (p) => (p.hasPR ? 'yes' : '') },
          ]),
          h('div.card',
            h('h2.card-title', 'Sessions'),
            h('div.mini-list', [...points].reverse().map((p) =>
              h('button.mini-row', { type: 'button', onclick: () => onOpenSession(p.sessionId) },
                h('span.mini-date', fmtDate(p.date)),
                h('span.mini-detail', `${fmtWeight(p.weight)} lb · ${p.sets} sets · ${p.volume.toLocaleString()} lb`),
                p.hasPR ? h('span.mini-pr', '\u{1F3C6}') : null
              )))
          )
        )
  );
}
  return { renderHistory: renderHistory, renderSessionDetail: renderSessionDetail, renderExercise: renderExercise };
})();

/* ---- js/views/summary.js ---- */
var __m_js_views_summary_js = (function () {
  var { h, mount } = __m_js_dom_js;
  var store = __m_js_store_js;
  var { planFor, nextDay } = __m_js_routine_js;
  var { sessionStats, fmtDateLong, fmtWeight, round1, e1rm, PR_LABEL, PR_TITLE } = __m_js_calc_js;
// views/summary.js -- the screen you get when you rack the last set.


function renderSummary(root, id, { onHome, onOpenSession }) {
  const s = store.getSession(id);
  if (!s) { onHome(); return; }
  const st = sessionStats(s);
  const best = bestSet(s);

  mount(root,
    h('header.page-header.summary-header',
      h('p.summary-kicker', 'Session complete'),
      h('h1.page-title', s.day ? `Day ${s.day} — ${planFor(s.day).title}` : 'Session'),
      h('p.page-sub', fmtDateLong(s.date))
    ),

    h('section.detail-stats',
      tile('Working sets', String(st.workingSets)),
      tile('Volume', st.volume.toLocaleString(), 'lb'),
      tile('Duration', st.durationMin != null ? String(st.durationMin) : '–', st.durationMin != null ? 'min' : ''),
      tile('PRs', String(st.prs.length))
    ),

    st.prs.length
      ? h('div.card.pr-card.pr-card-hero',
          h('h2.card-title', st.prs.length === 1 ? 'One record fell' : `${st.prs.length} records fell`),
          h('ul.pr-list', st.prs.map((p) =>
            h('li',
              h('span', { class: `pr-badge pr-${p.type}`, title: PR_TITLE[p.type] },
                h('span.pr-trophy', '\u{1F3C6}'), PR_LABEL[p.type]),
              h('span.pr-ex', p.exercise),
              h('span.pr-load', `${fmtWeight(p.weight)} × ${p.reps}`))))
        )
      : h('div.card',
          h('h2.card-title', 'No PRs today'),
          h('p.card-sub', best
            ? `Best set was ${best.name} ${fmtWeight(best.weight)} × ${best.reps} (e1RM ${round1(best.e1rm)}).`
            : 'Work logged, records held.')
        ),

    s.notes
      ? h('div.card', h('h2.card-title', 'Notes'), h('p.card-sub', s.notes))
      : null,

    h('div.card.next-card',
      h('h2.card-title', 'Next up'),
      h('p.card-sub', `Day ${nextDay(s.day)} — ${planFor(nextDay(s.day)).title}. Rest day first.`)
    ),

    h('button.btn.btn-ghost.btn-block', { type: 'button', onclick: () => onOpenSession(s.id) }, 'View full log'),
    h('button.btn.btn-primary.btn-block', { type: 'button', onclick: onHome }, 'Done')
  );
}

function tile(label, value, unit) {
  return h('div.stat-tile',
    h('span.stat-label', label),
    h('span.stat-value', value, unit ? h('span.stat-unit', ' ' + unit) : null)
  );
}

function bestSet(s) {
  let best = null;
  for (const ex of s.exercises || []) {
    for (const set of ex.sets || []) {
      if (set.warmup) continue;
      const est = e1rm(set.weight, set.reps);
      if (est != null && (!best || est > best.e1rm)) {
        best = { name: ex.name, weight: set.weight, reps: set.reps, e1rm: est };
      }
    }
  }
  return best;
}
  return { renderSummary: renderSummary };
})();

/* ---- js/generated/build.js ---- */
var __m_js_generated_build_js = (function () {
// GENERATED by build.py -- do not edit.
const BUILD = {"version":"e52e66f62a","builtAt":"2026-09-25T15:14:48-07:00"};
  return { BUILD: BUILD };
})();

/* ---- js/views/data.js ---- */
var __m_js_views_data_js = (function () {
  var { h, mount, download, toast, confirmSheet, sheet } = __m_js_dom_js;
  var store = __m_js_store_js;
  var { todayISO, fmtDateLong, sortSessions } = __m_js_calc_js;
  var { BUILD } = __m_js_generated_build_js;
// views/data.js -- export, import, and the handful of settings worth exposing.


function renderData(root) {
  const state = store.getState();
  const sessions = sortSessions(state.sessions);
  const logged = sessions.filter((s) => s.day);
  const lastBackup = state.settings.lastBackup;

  const fileInput = h('input', {
    type: 'file', accept: 'application/json,.json', hidden: true,
    onchange: (e) => handleImport(e.target.files[0], root),
  });

  mount(root,
    h('header.page-header',
      h('h1.page-title', 'Export'),
      h('p.page-sub', 'Everything lives in this browser. Back it up.')
    ),

    lastBackup
      ? h('p.backup-note', `Last export ${fmtDateLong(lastBackup.slice(0, 10))}.`)
      : h('p.backup-note.warn', 'No export taken yet. Clearing Safari data would erase every session.'),

    h('div.card',
      h('h2.card-title', 'Back up'),
      h('p.card-sub', `${sessions.length} sessions · ${logged.length} logged here · ${countSets(sessions)} sets`),
      h('button.btn.btn-primary.btn-block', {
        type: 'button',
        onclick: () => {
          download(`workout-export-${todayISO()}.json`, JSON.stringify(store.exportPayload(), null, 2));
          store.markBackedUp();
          toast('JSON exported — save it to the Claude Body Fat folder');
          renderData(root);
        },
      }, 'Export JSON'),
      h('button.btn.btn-ghost.btn-block', {
        type: 'button',
        onclick: () => {
          download(`workout-log-${todayISO()}.csv`, store.exportCSV(), 'text/csv');
          toast('CSV exported');
        },
      }, 'Export CSV (one row per set)')
    ),

    h('div.card',
      h('h2.card-title', 'Restore'),
      h('p.card-sub', 'Imports merge by session id, so re-importing the same file is safe.'),
      fileInput,
      h('button.btn.btn-ghost.btn-block', {
        type: 'button', onclick: () => fileInput.click(),
      }, 'Import JSON')
    ),

    h('div.card',
      h('h2.card-title', 'Imported history'),
      h('p.card-sub',
        store.SEED_INFO.cutoff
          ? `Seeded from ${store.SEED_INFO.source}, sessions on or after ${store.SEED_INFO.cutoff}.`
          : `Seeded from ${store.SEED_INFO.source}.`),
      h('dl.kv',
        kv('Sessions', String(store.SEED_INFO.stats.sessions)),
        kv('Sets', String(store.SEED_INFO.stats.sets)),
        kv('Generated', (store.SEED_INFO.generatedAt || '').slice(0, 10))
      ),
      h('button.btn.btn-ghost.btn-block.btn-sm', {
        type: 'button',
        onclick: () => showRenames(),
      }, 'Exercise renames applied'),
      h('button.btn.btn-ghost.btn-block.btn-sm', {
        type: 'button',
        onclick: () => {
          const r = store.reseed();
          toast(`Re-seeded — ${r.replaced} restored, ${r.added} added`);
          renderData(root);
        },
      }, 'Re-import seed history')
    ),

    h('div.card',
      h('h2.card-title', 'App'),
      h('dl.kv',
        kv('Build', BUILD.version),
        kv('Built', BUILD.builtAt.slice(0, 16).replace('T', ' ')),
        kv('Storage', storageSize())
      ),
      h('button.btn.btn-ghost.btn-block.btn-sm', {
        type: 'button',
        onclick: async () => {
          if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map((r) => r.update()));
          }
          toast('Checked for a new version — reload to apply');
        },
      }, 'Check for update'),
      h('button.btn.btn-danger.btn-block.btn-sm', {
        type: 'button',
        onclick: async () => {
          if (await confirmSheet(
            'Erase everything?',
            'Every session logged in this app is deleted and the imported history is reset. Export first.',
            'Erase'
          )) {
            store.wipeAll();
            toast('Reset to the imported history');
            renderData(root);
          }
        },
      }, 'Reset all data')
    )
  );
}

function kv(k, v) {
  return h('div.kv-row', h('dt', k), h('dd', v));
}

function countSets(sessions) {
  return sessions.reduce((n, s) =>
    n + (s.exercises || []).reduce((m, e) => m + (e.sets || []).length, 0), 0);
}

function storageSize() {
  try {
    const raw = localStorage.getItem(store.STORAGE_KEY) || '';
    const kb = Math.round((raw.length / 1024) * 10) / 10;
    return `${kb} KB`;
  } catch (_) {
    return 'unavailable';
  }
}

function showRenames() {
  const map = store.SEED_INFO.renamed || {};
  const rows = Object.entries(map);
  sheet({
    title: 'Exercise renames',
    body: h('div',
      h('p.sheet-text', 'Historical names from the spreadsheet were mapped onto the routine’s names so PR history is continuous.'),
      h('div.rename-list', rows.length
        ? rows.map(([from, to]) => h('div.rename-row', h('span.rn-from', from), h('span.rn-arrow', '→'), h('span.rn-to', to)))
        : h('p.sheet-text', 'None.'))
    ),
    actions: [{ label: 'Close' }],
  });
}

function handleImport(file, root) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    let payload;
    try {
      payload = JSON.parse(String(reader.result));
    } catch (err) {
      toast('That file is not valid JSON', { tone: 'warn' });
      return;
    }
    try {
      const mode = await chooseMode();
      if (!mode) return;
      const r = store.importPayload(payload, { mode });
      toast(`Imported — ${r.added} new, ${r.replaced} replaced`);
      renderData(root);
    } catch (err) {
      toast(err.message || 'Import failed', { tone: 'warn' });
    }
  };
  reader.readAsText(file);
}

function chooseMode() {
  return new Promise((resolve) => {
    let settled = false;
    const done = (v) => { if (!settled) { settled = true; resolve(v); } };
    const s = sheet({
      title: 'Import',
      body: h('p.sheet-text', 'Merge keeps what is already here and adds or updates by session id. Replace wipes local sessions first.'),
      actions: [
        { label: 'Cancel', variant: 'btn-ghost', onClick: () => done(null) },
        { label: 'Replace', variant: 'btn-danger', onClick: () => done('replace') },
        { label: 'Merge', variant: 'btn-primary', onClick: () => done('merge') },
      ],
    });
    s.overlay.addEventListener('click', (e) => { if (e.target === s.overlay) done(null); });
  });
}
  return { renderData: renderData };
})();

/* ---- js/app.js ---- */
var __m_js_app_js = (function () {
  var { h, $, mount, toast } = __m_js_dom_js;
  var store = __m_js_store_js;
  var { renderHome } = __m_js_views_home_js;
  var { renderSession } = __m_js_views_session_js;
  var { renderHistory, renderSessionDetail, renderExercise } = __m_js_views_history_js;
  var { renderSummary } = __m_js_views_summary_js;
  var { renderData } = __m_js_views_data_js;
  var { BUILD } = __m_js_generated_build_js;
// app.js -- bootstrap, hash router, bottom bar, service-worker wiring.


const outlet = () => $('#view');
let teardown = null;

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

function parse() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [head, ...rest] = raw.split('/');
  return { head: head || 'home', arg: rest.length ? decodeURIComponent(rest.join('/')) : null };
}

function render() {
  if (teardown) { teardown(); teardown = null; }
  const root = outlet();
  if (!root) return;
  root.scrollTop = 0;
  window.scrollTo(0, 0);

  const { head, arg } = parse();

  switch (head) {
    case 'session': {
      if (!store.activeSession()) { go('#/'); return; }
      teardown = renderSession(root, {
        onFinish: (done) => { go(done ? `#/summary/${encodeURIComponent(done.id)}` : '#/'); },
      });
      break;
    }
    case 'summary':
      renderSummary(root, arg, {
        onHome: () => go('#/'),
        onOpenSession: (id) => go(`#/log/${encodeURIComponent(id)}`),
      });
      break;
    case 'history':
      renderHistory(root, {
        tab: arg === 'exercises' ? 'exercises' : 'sessions',
        onTab: (t) => go(t === 'exercises' ? '#/history/exercises' : '#/history'),
        onOpenSession: (id) => go(`#/log/${encodeURIComponent(id)}`),
        onOpenExercise: (name) => go(`#/exercise/${encodeURIComponent(name)}`),
      });
      break;
    case 'log':
      renderSessionDetail(root, arg, {
        onBack: () => go('#/history'),
        onOpenExercise: (name) => go(`#/exercise/${encodeURIComponent(name)}`),
      });
      break;
    case 'exercise':
      renderExercise(root, arg, {
        onBack: () => go('#/history/exercises'),
        onOpenSession: (id) => go(`#/log/${encodeURIComponent(id)}`),
      });
      break;
    case 'export':
      renderData(root);
      break;
    default:
      renderHome(root, {
        onStart: (day) => { store.startSession(day); go('#/session'); },
        onResume: () => go('#/session'),
        onOpenSession: (id) => go(`#/log/${encodeURIComponent(id)}`),
      });
  }

  syncNav(head);
}

function syncNav(head) {
  const map = { home: 'home', session: 'home', summary: 'home', history: 'history', log: 'history', exercise: 'history', export: 'export' };
  const on = map[head] || 'home';
  for (const btn of document.querySelectorAll('.nav-btn')) {
    btn.classList.toggle('on', btn.dataset.nav === on);
    btn.setAttribute('aria-current', btn.dataset.nav === on ? 'page' : 'false');
  }
  document.body.classList.toggle('in-session', head === 'session');
}

// ---------------------------------------------------------------------------
// Chrome
// ---------------------------------------------------------------------------

function navBar() {
  const btn = (id, label, icon, target) => h('button', {
    class: 'nav-btn', type: 'button', dataset: { nav: id },
    onclick: () => {
      if (id === 'home' && store.activeSession()) { go('#/session'); return; }
      go(target);
    },
  }, h('span.nav-icon', icon), h('span.nav-label', label));

  return h('nav.nav-bar',
    btn('home', 'Home', '■', '#/'),
    btn('history', 'History', '≡', '#/history'),
    btn('export', 'Export', '↓', '#/export')
  );
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

function boot() {
  store.load();

  const app = $('#app');
  mount(app, h('main#view'), navBar());

  window.addEventListener('hashchange', render);

  // A save failure at the gym is the one thing that must never be quiet.
  window.addEventListener('wt:save-error', () => {
    toast('SAVE FAILED — storage is full or blocked. Export now.', { tone: 'warn', ms: 12000 });
  });

  // Coming back from the lock screen or another app: re-render so the elapsed
  // clock and the rest timer are correct rather than frozen at their old value.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) render();
  });

  if (!location.hash) location.hash = '#/';
  render();

  registerSW();

  // A deliberate debug handle. Everything here is already in localStorage;
  // exposing it means a problem at the gym can be inspected from Safari's
  // console instead of guessed at.
  window.__workout = { store, BUILD, render };

  console.info(`[workout] build ${BUILD.version} (${BUILD.builtAt})`);
}

function registerSW() {
  if (!('serviceWorker' in navigator)) return;

  // On localhost the service worker only gets in the way: it serves the last
  // build back at you after every edit. Skip it there, unless you are
  // deliberately testing offline behaviour with ?sw=1.
  const isDev = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if (isDev && !new URLSearchParams(location.search).has('sw')) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const r of regs) if (r.scope.startsWith(location.origin + '/')) r.unregister();
    });
    console.info('[workout] dev host - service worker skipped (add ?sw=1 to test offline)');
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              toast('New version ready — reload to update', { ms: 6000 });
            }
          });
        });
      })
      .catch((err) => console.warn('[workout] SW registration failed', err));
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
  return {};
})();

void __m_js_app_js;
})();
