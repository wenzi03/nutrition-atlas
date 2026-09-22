// components/myths.js —— 误区卡，被四个内容页复用

import { esc } from '../core/dom.js';
import { emptyHint } from './parts.js';

export function renderMyths(myths, title = '常见误区') {
  if (!Array.isArray(myths) || myths.length === 0) return '';

  const body = myths
    .map(
      (m) => `<div class="ui-card">
        <div class="flex gap-3">
          <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs text-red-600">×</span>
          <p class="text-sm font-medium leading-relaxed text-gray-900">${esc(m.myth)}</p>
        </div>
        <div class="mt-3 flex gap-3 border-t border-gray-100 pt-3">
          <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs text-brand-700">✓</span>
          <p class="text-sm leading-relaxed text-gray-600">${esc(m.fact)}</p>
        </div>
      </div>`
    )
    .join('');

  return `<section id="myths" class="mb-12 scroll-mt-24">
    <div class="mb-5">
      <h2 class="text-xl font-semibold text-gray-900">${esc(title)}</h2>
      <p class="mt-2 text-sm leading-relaxed text-gray-500">左边是不准确的说法，右边是实际情况。</p>
    </div>
    <div class="grid gap-4 md:grid-cols-2">${body}</div>
  </section>`;
}

export { emptyHint };
