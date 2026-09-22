// components/table.js —— type: table

import { esc } from '../core/dom.js';
import { sectionHead, ALIGN, tableWrap } from './parts.js';

export function table(section) {
  const cols = section.columns || [];
  const rows = section.rows || [];
  if (cols.length === 0) return sectionHead(section);

  const alignCls = (c) => ALIGN[c.align] || ALIGN.left;
  // 列宽可选：数据侧给 columns[].width 传百分比（如 "34%"），用于把长内容列撑开。
  // 只设需要的那一列即可，其余列交给浏览器自适应。
  const widthAttr = (c) => (c.width ? ` style="width:${esc(c.width)}"` : '');

  const head = `<thead><tr>${cols
    .map((c) => `<th scope="col" class="ui-th ${alignCls(c)}"${widthAttr(c)}>${esc(c.label)}</th>`)
    .join('')}</tr></thead>`;

  const body = `<tbody>${rows
    .map(
      (r) =>
        `<tr class="transition-colors hover:bg-gray-50/70">${cols
          .map((c) => {
            const v = r[c.key];
            const cell =
              v == null || v === ''
                ? '<span class="text-gray-300">—</span>'
                : esc(v);
            // 第一列视为主键列：稍作强调，且不允许折行
            // （不这样的话，表格 auto layout 会把宽度全分给长内容列，把「单糖」这类短词压到断行）
            const isFirst = c === cols[0];
            return `<td class="ui-td ${alignCls(c)} ${isFirst ? 'whitespace-nowrap font-medium text-gray-900' : ''}">${cell}</td>`;
          })
          .join('')}</tr>`
    )
    .join('')}</tbody>`;

  const foot = section.footnote
    ? `<p class="mt-3 text-xs text-gray-400">${esc(section.footnote)}</p>`
    : '';

  return `${sectionHead(section)}${rows.length ? tableWrap(head + body, section.title) : ''}${foot}`;
}
