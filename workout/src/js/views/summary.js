// views/summary.js -- the screen you get when you rack the last set.

import { h, mount } from '../dom.js';
import * as store from '../store.js';
import { planFor, nextDay } from '../routine.js';
import {
  sessionStats, fmtDateLong, fmtWeight, round1, e1rm, PR_LABEL, PR_TITLE,
} from '../calc.js';

export function renderSummary(root, id, { onHome, onOpenSession }) {
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
