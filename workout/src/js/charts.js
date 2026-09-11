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

import { h, svg, clear } from './dom.js';
import { fmtDate } from './calc.js';

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
export function lineChart(points, value, { title, sub, unit = '', describe } = {}) {
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

export function barChart(points, value, { title, sub, unit = '', describe } = {}) {
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

export function chartTable(points, columns) {
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

