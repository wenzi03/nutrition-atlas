// components/compare.js —— type: compare（本站核心展示形态）

import { esc, accentOf } from '../core/dom.js';
import { sectionHead, tableWrap } from './parts.js';

function side(s) {
  if (!s) return '';
  const a = accentOf(s.accent);
  const points = (s.points || [])
    .map(
      (p) => `<li class="flex gap-2.5">
        <span class="${a.text} mt-0.5 shrink-0 select-none">·</span>
        <span>${esc(p)}</span>
      </li>`
    )
    .join('');

  const examples = (s.examples || [])
    .map(
      (e) =>
        `<span class="ui-badge border ${a.border} bg-white ${a.text}">${esc(e)}</span>`
    )
    .join('');

  return `<div class="rounded-xl border ${a.border} ${a.bg} p-5">
    <h3 class="text-base font-medium ${a.text}">${esc(s.title)}</h3>
    ${s.caption ? `<p class="mt-1 text-xs ${a.text} opacity-80">${esc(s.caption)}</p>` : ''}
    ${points ? `<ul class="mt-3.5 space-y-2 text-sm leading-relaxed text-gray-700">${points}</ul>` : ''}
    ${
      examples
        ? `<div class="mt-4">
             <p class="mb-2 text-xs text-gray-400">代表食物</p>
             <div class="flex flex-wrap gap-2">${examples}</div>
           </div>`
        : ''
    }
  </div>`;
}

function diffTable(d) {
  if (!d || !Array.isArray(d.rows) || d.rows.length === 0) return '';
  const cols = d.columns || ['对比维度', '左', '右'];

  const head = `<thead><tr>${cols
    .map(
      (c, i) =>
        `<th scope="col" class="ui-th ${i === 0 ? 'text-left' : 'text-left'}">${esc(c)}</th>`
    )
    .join('')}</tr></thead>`;

  const body = `<tbody>${d.rows
    .map(
      (r) =>
        `<tr class="transition-colors hover:bg-gray-50/70">
          <td class="ui-td whitespace-nowrap text-gray-500">${esc(r.k)}</td>
          <td class="ui-td">${r.l == null ? '<span class="text-gray-300">—</span>' : esc(r.l)}</td>
          <td class="ui-td font-medium text-gray-900">${r.r == null ? '<span class="text-gray-300">—</span>' : esc(r.r)}</td>
        </tr>`
    )
    .join('')}</tbody>`;

  return `<div class="mt-4">${tableWrap(head + body, `${d.caption || '差异对照'}：逐项对比`)}</div>`;
}

export function compare(section) {
  return `${sectionHead(section)}
    <div class="grid gap-4 md:grid-cols-2">${side(section.left)}${side(section.right)}</div>
    ${diffTable(section.diffTable)}`;
}
