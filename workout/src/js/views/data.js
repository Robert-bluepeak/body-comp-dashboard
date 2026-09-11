// views/data.js -- export, import, and the handful of settings worth exposing.

import { h, mount, download, toast, confirmSheet, sheet } from '../dom.js';
import * as store from '../store.js';
import { todayISO, fmtDateLong, sortSessions } from '../calc.js';
import { BUILD } from '../generated/build.js';

export function renderData(root) {
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
