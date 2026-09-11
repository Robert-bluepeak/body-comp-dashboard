// views/history.js -- session list, session detail, exercise list, exercise detail.

import { h, mount, confirmSheet, toast } from '../dom.js';
import * as store from '../store.js';
import { lineChart, barChart, chartTable } from '../charts.js';
import {
  sessionStats, sortSessions, exerciseIndex, exerciseSeries, recordFor,
  loadSenseFor, e1rm, round1, fmtWeight, fmtDate, fmtDateLong,
  PR_LABEL, PR_TITLE,
} from '../calc.js';
import { ROUTINE_EXERCISES } from '../routine.js';

// ---------------------------------------------------------------------------
// Tab 1: sessions
// ---------------------------------------------------------------------------

export function renderHistory(root, { tab = 'sessions', onOpenSession, onOpenExercise, onTab }) {
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

export function renderSessionDetail(root, id, { onBack, onOpenExercise }) {
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

export function renderExercise(root, name, { onBack, onOpenSession }) {
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
