// components/cards.js —— type: cards

import { esc, accentOf } from '../core/dom.js';
import { sectionHead } from './parts.js';

// 必须为完整字面量类名
const COLS = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4'
};

export function cards(section) {
  const items = section.items || [];
  const grid = COLS[section.columns] || COLS[3];

  const body = items
    .map((it) => {
      const a = accentOf(it.accent);
      const points = (it.points || [])
        .map(
          (p) => `<li class="flex gap-2.5">
            <span class="mt-2 h-1 w-1 shrink-0 rounded-full ${a.solid}"></span>
            <span>${esc(p)}</span>
          </li>`
        )
        .join('');

      return `<div class="ui-card flex flex-col">
        <div class="mb-3 h-1 w-8 rounded-full ${a.solid}"></div>
        <div class="flex flex-wrap items-start justify-between gap-2">
          <h3 class="text-base font-medium text-gray-900">${esc(it.title)}</h3>
          ${it.badge ? `<span class="ui-badge border ${a.border} ${a.bg} ${a.text}">${esc(it.badge)}</span>` : ''}
        </div>
        ${it.caption ? `<p class="mt-1.5 text-xs leading-relaxed text-gray-400">${esc(it.caption)}</p>` : ''}
        ${points ? `<ul class="mt-3 space-y-1.5 text-sm leading-relaxed text-gray-600">${points}</ul>` : ''}
      </div>`;
    })
    .join('');

  return `${sectionHead(section)}<div class="grid gap-4 ${grid}">${body}</div>`;
}
