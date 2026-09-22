// core/dom.js —— 通用 DOM 与字符串工具
// 所有插入 HTML 的动态内容都必须经过 esc()，见技术文档 §9.3

const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** HTML 转义 */
export function esc(v) {
  if (v == null) return '';
  return String(v).replace(/[&<>"']/g, (c) => ESC_MAP[c]);
}

/** 缺失值占位：显示灰色破折号 */
export function dash(v, suffix = '') {
  if (v == null || v === '') return '<span class="text-gray-300">—</span>';
  return esc(v) + esc(suffix);
}

/** 数值格式化：固定小数位 + 等宽数字，缺失显示破折号 */
export function num(v, decimals = 1, suffix = '') {
  if (v == null || v === '') return '<span class="text-gray-300">—</span>';
  const n = Number(v);
  if (!Number.isFinite(n)) return '<span class="text-gray-300">—</span>';
  return `<span class="tabular-nums">${n.toFixed(decimals)}</span>${esc(suffix)}`;
}

/** 整数格式化 */
export function int(v, suffix = '') {
  return num(v, 0, suffix);
}

/** 防抖 */
export function debounce(fn, wait = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// accent 必须映射为「完整字面量类名」，禁止运行时拼接字符串。
// 原因：Tailwind 在构建时静态扫描源码，bg-${x}-50 这类拼接不会生成对应 CSS。
// 见技术文档 §13.2
const ACCENTS = {
  green: { bg: 'bg-brand-50', text: 'text-brand-700', border: 'border-brand-200', solid: 'bg-brand-600' },
  red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', solid: 'bg-red-500' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', solid: 'bg-blue-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', solid: 'bg-amber-500' },
  gray: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', solid: 'bg-gray-400' }
};

export function accentOf(name) {
  return ACCENTS[name] || ACCENTS.gray;
}

/** 数值缺失时安全取默认 */
export function orNull(v) {
  return v == null || v === '' ? null : v;
}
