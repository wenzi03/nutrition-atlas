// components/parts.js —— 组件共用的片段构造器

import { esc, accentOf } from '../core/dom.js';

/** 章节标题 + 导语 */
export function sectionHead(section) {
  if (!section.title && !section.lead) return '';
  return `<div class="mb-5">
    ${section.title ? `<h2 class="text-xl font-semibold text-gray-900">${esc(section.title)}</h2>` : ''}
    ${section.lead ? `<p class="mt-2 text-sm leading-relaxed text-gray-500">${esc(section.lead)}</p>` : ''}
  </div>`;
}

/** 标签徽标 */
export function badge(text, accent = 'gray', extra = '') {
  const a = accentOf(accent);
  return `<span class="ui-badge border ${a.border} ${a.bg} ${a.text} ${extra}">${esc(text)}</span>`;
}

/** 空状态提示 */
export function emptyHint(text) {
  return `<p class="rounded-xl border border-dashed border-gray-200 bg-white px-5 py-10 text-center text-sm text-gray-400">${esc(text)}</p>`;
}

/** 表格单元格对齐（必须为完整字面量类名） */
export const ALIGN = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right'
};

/** 通用表格容器 */
export function tableWrap(inner, caption) {
  return `<div class="overflow-x-auto rounded-xl border border-gray-200">
    <table class="ui-table">
      ${caption ? `<caption class="sr-only">${esc(caption)}</caption>` : ''}
      ${inner}
    </table>
  </div>`;
}
