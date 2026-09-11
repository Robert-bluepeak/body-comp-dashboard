// dom.js -- the only place that touches document directly, besides views.

export function h(tag, attrs, ...children) {
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

export const svg = (tag, attrs = {}, ...children) => {
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

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

export function mount(el, ...children) {
  clear(el);
  add(el, children);
  return el;
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

let toastTimer = null;

export function toast(message, { tone = 'info', ms = 2600 } = {}) {
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

export function sheet({ title, body, actions = [] }) {
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

export function confirmSheet(title, message, confirmLabel = 'Confirm') {
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

export function download(filename, text, mime = 'application/json') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 0);
}

export function haptic(ms = 12) {
  if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (_) { /* ignore */ } }
}
