// components/registry.js —— section.type → 渲染函数 的映射与分发
// 新增展示形态只需：新建组件文件 + 在此加一行 + JSON 里用新 type。见技术文档 §14.4

import { esc } from '../core/dom.js';
import { table } from './table.js';
import { compare } from './compare.js';
import { cards } from './cards.js';
import { giTable } from './giTable.js';
import { stackedBar } from './stackedBar.js';
import { list } from './list.js';
import { ranking } from './ranking.js';

const registry = {
  table,
  compare,
  cards,
  'gi-table': giTable,
  'stacked-bar': stackedBar,
  list,
  ranking
};

export function renderSection(section, ctx) {
  const fn = registry[section.type];
  if (!fn) {
    console.warn(`[registry] 未知组件类型: ${section.type}`, section);
    return `<section class="mb-12">
      <div class="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        未知展示类型：<code class="text-xs">${esc(section.type)}</code>
        ${section.title ? `（章节：${esc(section.title)}）` : ''}
      </div>
    </section>`;
  }

  const highlight = section.highlight
    ? 'rounded-r-xl border-l-4 border-brand-500 bg-white py-5 pl-5 pr-5'
    : '';

  return `<section id="${esc(section.id)}" class="mb-12 scroll-mt-24 ${highlight}">
    ${fn(section, ctx)}
  </section>`;
}

/** 页面统一入口：把 sections[] 渲染为 HTML */
export function renderSections(sections, ctx) {
  if (!Array.isArray(sections) || sections.length === 0) return '';
  return sections.map((s) => renderSection(s, ctx)).join('');
}
