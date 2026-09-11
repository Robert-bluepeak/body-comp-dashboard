// views/session.js -- the screen you actually stand in front of a barbell with.
//
// Design constraints from the spec: portrait iPhone, one thumb, low light,
// no misclicks. So: one station on screen at a time, every control >= 44px,
// steppers next to the number inputs so the keyboard is optional, and a single
// full-width "Log set" button that never moves.

import { h, mount, clear, toast, sheet, confirmSheet, haptic } from '../dom.js';
import { planFor, repTarget, WARMUP } from '../routine.js';
import * as store from '../store.js';
import {
  e1rm, round1, fmtWeight, fmtDate, loadSenseFor, recordFor, lastPerformance,
  overloadSuggestion, warmupRamp, sessionStats, PR_LABEL, PR_TITLE,
} from '../calc.js';

let tickTimer = null;

// ---------------------------------------------------------------------------
// Stations: consecutive exercises sharing a supersetGroup are one station.
// ---------------------------------------------------------------------------

export function stationsFor(day) {
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

export function renderSession(root, { onFinish }) {
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
