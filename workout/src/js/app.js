// app.js -- bootstrap, hash router, bottom bar, service-worker wiring.

import { h, $, mount, toast } from './dom.js';
import * as store from './store.js';
import { renderHome } from './views/home.js';
import { renderSession } from './views/session.js';
import { renderHistory, renderSessionDetail, renderExercise } from './views/history.js';
import { renderSummary } from './views/summary.js';
import { renderData } from './views/data.js';
import { BUILD } from './generated/build.js';

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
