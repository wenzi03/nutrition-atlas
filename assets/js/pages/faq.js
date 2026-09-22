// pages/faq.js —— 常见疑问（用原生 details 实现折叠，无需 JS）

import { esc } from '../core/dom.js';

const CHEVRON = `<svg class="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180" viewBox="0 0 16 16" fill="none" aria-hidden="true">
  <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default {
  id: 'faq',
  title: '常见疑问',

  async render(ctx) {
    const d = await ctx.store.load('faq');
    const items = d.items || [];

    const body = items
      .map(
        (it) => `<details id="${esc(it.id)}" class="ui-card group scroll-mt-24">
          <summary class="flex cursor-pointer list-none items-start justify-between gap-4">
            <span class="text-base font-medium leading-relaxed text-gray-900">${esc(it.q)}</span>
            ${CHEVRON}
          </summary>
          <div class="mt-3 border-t border-gray-100 pt-3">
            <p class="text-sm leading-relaxed text-gray-600">${esc(it.a)}</p>
            ${
              Array.isArray(it.related) && it.related.length
                ? `<div class="mt-4 flex flex-wrap items-center gap-2">
                     <span class="text-xs text-gray-400">相关章节</span>
                     ${it.related
                       .map(
                         (r) =>
                           `<a href="#${r.path}" class="ui-pill">${esc(r.label)}</a>`
                       )
                       .join('')}
                   </div>`
                : ''
            }
          </div>
        </details>`
      )
      .join('');

    const sources = (ctx.meta?.sources || [])
      .map((s) => `<li>${esc(s.name)}${s.publisher ? ` · ${esc(s.publisher)}` : ''}${s.year ? ` · ${esc(s.year)}` : ''}</li>`)
      .join('');

    return {
      html: `
        <header class="mb-10">
          <h1 class="text-2xl font-semibold tracking-tight text-gray-900">${esc(d.title || this.title)}</h1>
          ${d.intro ? `<p class="mt-3 text-base leading-relaxed text-gray-500">${esc(d.intro)}</p>` : ''}
        </header>

        <div class="space-y-3">${body}</div>

        <section class="mt-12 rounded-xl border border-gray-200 bg-white p-6">
          <h2 class="text-sm font-medium text-gray-900">数据来源</h2>
          <ul class="mt-3 space-y-1.5 text-sm text-gray-500">${sources}</ul>
          <h2 class="mt-6 text-sm font-medium text-gray-900">免责声明</h2>
          <p class="mt-3 text-sm leading-relaxed text-gray-500">${esc(ctx.meta?.disclaimer || '')}</p>
        </section>
      `
    };
  }
};
