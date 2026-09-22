// components/giTable.js —— type: gi-table
// level 由数据侧显式给出（low ≤55 / mid 56–69 / high ≥70），前端不重算，
// 便于人工修正特殊食物。见技术文档 §5.3.2

import { esc, num } from '../core/dom.js';
import { sectionHead, ALIGN, tableWrap } from './parts.js';

const LEVEL = {
  low: { label: '低', badge: 'bg-brand-50 text-brand-700 border-brand-200', bar: 'bg-brand-500' },
  mid: { label: '中', badge: 'bg-amber-50 text-amber-700 border-amber-200', bar: 'bg-amber-500' },
  high: { label: '高', badge: 'bg-red-50 text-red-700 border-red-200', bar: 'bg-red-500' }
};

function giCell(gi, level) {
  if (gi == null) return '<span class="text-gray-300">—</span>';
  const lv = LEVEL[level] || LEVEL.mid;
  const pct = Math.min(100, Math.max(0, Number(gi)));
  return `<div class="flex items-center gap-3">
    <span class="w-9 shrink-0 tabular-nums font-medium text-gray-900">${esc(gi)}</span>
    <span class="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100 sm:w-24">
      <span class="block h-full rounded-full ${lv.bar}" style="width:${pct}%"></span>
    </span>
  </div>`;
}

export function giTable(section) {
  const rows = section.rows || [];

  const head = `<thead><tr>
    <th scope="col" class="ui-th">食物</th>
    <th scope="col" class="ui-th">GI 值</th>
    <th scope="col" class="ui-th ${ALIGN.right}">GL</th>
    <th scope="col" class="ui-th">血糖影响</th>
  </tr></thead>`;

  const body = `<tbody>${rows
    .map((r) => {
      const lv = LEVEL[r.level] || LEVEL.mid;
      return `<tr class="transition-colors hover:bg-gray-50/70">
        <td class="ui-td whitespace-nowrap font-medium text-gray-900">${esc(r.food)}</td>
        <td class="ui-td">${giCell(r.gi, r.level)}</td>
        <td class="ui-td ${ALIGN.right}">${num(r.gl, 1)}</td>
        <td class="ui-td">
          <span class="ui-badge border ${lv.badge}">${lv.label} GI</span>
          ${r.note ? `<span class="ml-2 text-xs text-gray-400">${esc(r.note)}</span>` : ''}
        </td>
      </tr>`;
    })
    .join('')}</tbody>`;

  const legend = `<div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400">
    <span>GI 分级：</span>
    ${Object.entries(LEVEL)
      .map(
        ([k, v]) =>
          `<span class="inline-flex items-center gap-1.5">
            <span class="h-1.5 w-6 rounded-full ${v.bar}"></span>${esc(v.label)}
          </span>`
      )
      .join('')}
    <span class="text-gray-300">|</span>
    <span>GL = GI × 可利用碳水(g) ÷ 100，比 GI 更贴近实际血糖影响</span>
  </div>`;

  return `${sectionHead(section)}${rows.length ? tableWrap(head + body, section.title || '食物 GI 值') : ''}${legend}`;
}
