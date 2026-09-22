// core/pager.js —— 上一页 / 下一页
// 顺序由 meta.nav 推导，页面模块无需自己维护

import { esc } from './dom.js';

export function renderPager(currentId, meta) {
  const nav = meta?.nav || [];
  const i = nav.findIndex((n) => n.id === currentId);
  if (i === -1) return '';

  const prev = nav[i - 1];
  const next = nav[i + 1];

  const left = prev
    ? `<a href="#${prev.path}" class="group inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-brand-600">
         <span class="transition-transform group-hover:-translate-x-0.5">←</span>${esc(prev.label)}
       </a>`
    : '<span></span>';

  const right = next
    ? `<a href="#${next.path}" class="group inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-brand-600">
         ${esc(next.label)}<span class="transition-transform group-hover:translate-x-0.5">→</span>
       </a>`
    : '<span></span>';

  return `<nav class="mt-14 flex items-center justify-between gap-4 border-t border-gray-200 pt-6" aria-label="章节导航">
    ${left}${right}
  </nav>`;
}
