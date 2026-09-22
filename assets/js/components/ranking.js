// components/ranking.js —— type: ranking

import { esc, num, accentOf } from '../core/dom.js';
import { sectionHead } from './parts.js';

const BAR = {
  green: 'bg-brand-500',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  gray: 'bg-gray-400'
};

export function ranking(section) {
  const items = section.items || [];
  if (!items.length) return sectionHead(section);

  const values = items.map((i) => Number(i.value) || 0);
  const max = Math.max(...values, 1);
  const decimals = section.decimals ?? 1;

  const body = items
    .map((it) => {
      const a = accentOf(it.accent);
      const v = Number(it.value) || 0;
      const pct = Math.max(2, Math.round((v / max) * 100));
      const barCls = BAR[it.accent] || BAR.gray;

      return `<li class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-gray-300">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${a.bg} text-xs font-medium ${a.text} tabular-nums">${esc(it.rank)}</span>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-baseline justify-between gap-x-3">
            <span class="text-sm text-gray-900">${esc(it.name)}</span>
            <span class="text-sm font-medium tabular-nums text-gray-900">${num(v, decimals)}<span class="ml-0.5 text-xs font-normal text-gray-400">${esc(section.unit || '')}</span></span>
          </div>
          <div class="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-gray-100">
            <div class="h-full rounded-full ${barCls}" style="width:${pct}%"></div>
          </div>
          ${it.note ? `<p class="mt-1.5 text-xs text-gray-400">${esc(it.note)}</p>` : ''}
        </div>
      </li>`;
    })
    .join('');

  const head = section.valueLabel
    ? `<p class="mb-3 text-xs text-gray-400">排序依据：${esc(section.valueLabel)}</p>`
    : '';

  return `${sectionHead(section)}${head}<ol class="space-y-2.5">${body}</ol>`;
}
