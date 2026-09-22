// pages/home.js —— 首页

import { esc, accentOf } from '../core/dom.js';

export default {
  id: 'home',
  title: '',

  async render(ctx) {
    const meta = ctx.meta || {};
    const home = meta.home || {};
    const site = meta.site || {};

    const cards = (home.entries || [])
      .map((e) => {
        const a = accentOf(e.accent);
        return `<a href="#${e.path}" class="ui-card group flex flex-col transition-colors hover:border-brand-300">
          <div class="mb-3 h-1 w-8 rounded-full ${a.solid}"></div>
          <h2 class="text-base font-medium text-gray-900 transition-colors group-hover:text-brand-700">${esc(e.title)}</h2>
          <p class="mt-2 flex-1 text-sm leading-relaxed text-gray-500">${esc(e.desc)}</p>
          ${e.meta ? `<p class="mt-4 text-xs text-gray-400">${esc(e.meta)}</p>` : ''}
        </a>`;
      })
      .join('');

    const ec = home.entryCard;
    const entryCard = ec
      ? `<a href="#${ec.path}" class="group mt-4 flex flex-col items-start justify-between gap-4 rounded-xl border border-brand-200 bg-brand-50 p-6 transition-colors hover:border-brand-300 sm:flex-row sm:items-center">
          <div>
            <h2 class="text-base font-medium text-brand-700">${esc(ec.title)}</h2>
            <p class="mt-2 max-w-xl text-sm leading-relaxed text-gray-600">${esc(ec.desc)}</p>
          </div>
          <span class="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors group-hover:bg-brand-700">${esc(ec.label)}</span>
        </a>`
      : '';

    return {
      html: `
        <header class="mb-10">
          <p class="text-sm font-medium text-brand-600">${esc(site.title || '')}</p>
          <h1 class="mt-2 text-2xl font-semibold tracking-tight text-gray-900">${esc(site.subtitle || '')}</h1>
          ${home.lead ? `<p class="mt-3 max-w-2xl text-base leading-relaxed text-gray-500">${esc(home.lead)}</p>` : ''}
        </header>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">${cards}</div>
        ${entryCard}
      `
    };
  }
};
