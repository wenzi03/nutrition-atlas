// components/list.js —— type: list

import { esc } from '../core/dom.js';
import { sectionHead } from './parts.js';

// style: check = 建议做 / cross = 避免做 / dot = 中性要点
const MARK = {
  check: { cls: 'bg-brand-100 text-brand-700', char: '✓' },
  cross: { cls: 'bg-red-100 text-red-600', char: '×' },
  dot: { cls: 'bg-gray-100 text-gray-500', char: '·' }
};

export function list(section) {
  const items = section.items || [];
  const m = MARK[section.style] || MARK.dot;

  const body = items
    .map(
      (it) => `<li class="flex gap-3 text-sm leading-relaxed text-gray-700">
        <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${m.cls} text-xs">${m.char}</span>
        <span>${esc(it)}</span>
      </li>`
    )
    .join('');

  const inner = section.card === false
    ? `<ul class="space-y-2.5">${body}</ul>`
    : `<div class="ui-card"><ul class="space-y-2.5">${body}</ul></div>`;

  return `${sectionHead(section)}${inner}`;
}
