// pages/contentPage.js —— 内容页工厂
// 碳水 / 蛋白 / 脂肪 / 总览 / 速查表 五个页面结构完全一致，只在数据文件与是否含误区上不同

import { esc } from '../core/dom.js';
import { renderSections } from '../components/registry.js';
import { renderMyths } from '../components/myths.js';

export function makeContentPage({ id, title, file, withMyths = true, mythsTitle = '常见误区' }) {
  return {
    id,
    title,

    async render(ctx) {
      const d = await ctx.store.load(file);

      return {
        html: `
          <header class="mb-10">
            <h1 class="text-2xl font-semibold tracking-tight text-gray-900">${esc(d.title || title)}</h1>
            ${d.intro ? `<p class="mt-3 text-base leading-relaxed text-gray-500">${esc(d.intro)}</p>` : ''}
          </header>
          ${renderSections(d.sections, ctx)}
          ${withMyths ? renderMyths(d.myths, mythsTitle) : ''}
        `
      };
    }
  };
}
