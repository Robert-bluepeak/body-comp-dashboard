// views/home.js -- three big buttons and enough context to know which one.

import { h, mount, confirmSheet } from '../dom.js';
import { ROUTINE, DAY_ORDER, planFor } from '../routine.js';
import * as store from '../store.js';
import {
  sessionStats, sortSessions, fmtDateLong, fmtDate, daysBetween, todayISO,
} from '../calc.js';

export function renderHome(root, { onStart, onOpenSession, onResume }) {
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
