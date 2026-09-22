// components/stackedBar.js —— type: stacked-bar
// 纯内联 SVG，不引图表库。viewBox 宽度固定 100，直接用百分比数值作 width 属性。

import { esc, num } from '../core/dom.js';
import { sectionHead } from './parts.js';

// SVG fill 用 hex，不经过 Tailwind，无构建期扫描问题
const HEX = {
  green: '#16a34a',
  red: '#dc2626',
  blue: '#2563eb',
  amber: '#d97706',
  gray: '#9ca3af',
  teal: '#0d9488',
  purple: '#7c3aed'
};

function bar(item, series) {
  let x = 0;
  const rects = series
    .map((s) => {
      const v = Number(item[s.key]) || 0;
      const r = `<rect x="${x}" y="0" width="${v}" height="10" fill="${HEX[s.color] || HEX.gray}"/>`;
      x += v;
      return r;
    })
    .join('');

  // 取占比最高的成分作为右侧摘要
  const top = series.reduce(
    (best, s) => (Number(item[s.key]) || 0) > (Number(item[best.key]) || 0) ? s : best,
    series[0]
  );
  const topVal = Number(item[top.key]) || 0;

  return `<div>
    <div class="mb-1.5 flex items-baseline justify-between gap-3">
      <span class="text-sm text-gray-900">${esc(item.name)}</span>
      <span class="text-xs text-gray-400">${esc(top.name)} ${num(topVal, 0, '%')}</span>
    </div>
    <svg viewBox="0 0 100 10" preserveAspectRatio="none" class="h-2.5 w-full overflow-hidden rounded-full" role="img"
         aria-label="${esc(item.name)}：${series.map((s) => `${s.name} ${item[s.key] ?? 0}%`).join('，')}">
      ${rects}
    </svg>
  </div>`;
}

export function stackedBar(section) {
  const series = section.series || [];
  const items = section.items || [];
  if (!series.length || !items.length) return sectionHead(section);

  const legend = `<div class="mb-4 flex flex-wrap gap-x-4 gap-y-2">
    ${series
      .map(
        (s) => `<span class="inline-flex items-center gap-1.5 text-xs text-gray-600">
          <span class="h-2.5 w-2.5 rounded-sm" style="background:${HEX[s.color] || HEX.gray}"></span>${esc(s.name)}
        </span>`
      )
      .join('')}
    <span class="text-xs text-gray-300">（占脂肪酸总量 %，按 100 g 计）</span>
  </div>`;

  return `${sectionHead(section)}
    <div class="ui-card">${legend}<div class="space-y-4">${items.map((it) => bar(it, series)).join('')}</div></div>`;
}
