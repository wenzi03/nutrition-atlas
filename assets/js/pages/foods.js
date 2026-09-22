// pages/foods.js —— 食物营养图谱
// 全站唯一带交互状态的页面：搜索 / 分类 / 标签筛选 / 数值排序 / 详情 / 两两对比
// 状态变更后只重渲染列表容器，避免整页重渲染导致搜索框失焦。见技术文档 §8.6

import { esc, accentOf, debounce } from '../core/dom.js';
import { emptyHint } from '../components/parts.js';
import { replaceQuery } from '../core/router.js';

const SORTS = [
  { id: 'name:asc', label: '名称', key: 'name', dir: 'asc' },
  { id: 'protein_g:desc', label: '蛋白质 高→低', key: 'protein_g', dir: 'desc' },
  { id: 'carb_g:asc', label: '碳水 低→高', key: 'carb_g', dir: 'asc' },
  { id: 'fat_g:asc', label: '脂肪 低→高', key: 'fat_g', dir: 'asc' },
  { id: 'fiber_g:desc', label: '纤维 高→低', key: 'fiber_g', dir: 'desc' },
  { id: 'gi:asc', label: 'GI 低→高', key: 'gi', dir: 'asc' },
  { id: 'energy_kcal:asc', label: '热量 低→高', key: 'energy_kcal', dir: 'asc' },
  { id: 'energy_kcal:desc', label: '热量 高→低', key: 'energy_kcal', dir: 'desc' }
];

const METRICS = [
  { key: 'energy_kcal', label: '热量', unit: ' kcal', decimals: 0 },
  { key: 'protein_g', label: '蛋白质', unit: ' g', decimals: 1 },
  { key: 'fat_g', label: '脂肪', unit: ' g', decimals: 1 },
  { key: 'carb_g', label: '碳水', unit: ' g', decimals: 1 },
  { key: 'fiber_g', label: '纤维', unit: ' g', decimals: 1 },
  { key: 'gi', label: 'GI', unit: '', decimals: 0 }
];

const CLOSE_BTN = `<button type="button" data-close class="ui-btn shrink-0" aria-label="关闭">关闭</button>`;

const state = { q: '', tags: new Set(), cat: '', sort: { key: 'name', dir: 'asc' } };
let compare = [];
let index = { items: [], catMap: new Map(), tagMap: new Map(), fields: [] };
let rootEl = null;

// ---------- 数据索引 ----------
function buildIndex(foods) {
  index.items = foods.items || [];
  index.catMap = new Map((foods.categories || []).map((c) => [c.id, c]));
  index.tagMap = new Map((foods.tags || []).map((t) => [t.id, t]));
  index.fields = foods.fields || [];
  index.per = foods.per || 100;
  index.unit = foods.unit || 'g';
}

function haystack(it) {
  if (it._hay) return it._hay;
  it._hay = [
    it.name,
    ...(it.aliases || []),
    index.catMap.get(it.category)?.name || '',
    it.subCategory || '',
    ...(it.tags || []).map((t) => index.tagMap.get(t)?.name || '')
  ]
    .join(' ')
    .toLowerCase();
  return it._hay;
}

// ---------- 筛选与排序 ----------
function valueOf(it, key) {
  if (key === 'name') return it.name;
  if (key === 'gi') return it.gi;
  return it.nutrition ? it.nutrition[key] ?? null : null;
}

function filterItems() {
  const q = state.q.trim().toLowerCase();
  return index.items.filter((it) => {
    if (state.cat && it.category !== state.cat) return false;
    if (state.tags.size) {
      const tags = it.tags || [];
      for (const t of state.tags) if (!tags.includes(t)) return false;
    }
    if (q && !haystack(it).includes(q)) return false;
    return true;
  });
}

function sortItems(items) {
  const { key, dir } = state.sort;
  const mul = dir === 'desc' ? -1 : 1;
  return items.slice().sort((a, b) => {
    const va = valueOf(a, key);
    const vb = valueOf(b, key);
    // null 始终排最后：否则按蛋白质降序时，无数据的条目会跑到第一
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === 'string') return mul * va.localeCompare(vb, 'zh-Hans-CN');
    return mul * (va - vb);
  });
}

// ---------- 片段构造 ----------
function statBox(label, value, decimals, unit) {
  const shown = value == null
    ? '<span class="text-gray-300">—</span>'
    : `${Number(value).toFixed(decimals)}<span class="text-xs font-normal text-gray-400">${esc(unit)}</span>`;
  return `<div class="rounded-lg bg-gray-50 px-1 py-2 text-center">
    <p class="text-xs text-gray-400">${esc(label)}</p>
    <p class="mt-0.5 text-sm font-medium tabular-nums text-gray-900">${shown}</p>
  </div>`;
}

function tagBadge(tagId) {
  const t = index.tagMap.get(tagId);
  if (!t) return '';
  const a = accentOf(t.accent);
  return `<span class="ui-badge border ${a.border} ${a.bg} ${a.text}">${esc(t.name)}</span>`;
}

function cardHtml(it) {
  const cat = index.catMap.get(it.category)?.name || '';
  const sub = it.subCategory || '';
  const n = it.nutrition || {};
  const selected = compare.includes(it.id);

  return `<article data-food-id="${esc(it.id)}"
    class="ui-card group cursor-pointer transition-colors hover:border-brand-300 ${selected ? 'border-brand-300 ring-2 ring-brand-500' : ''}">
    <div class="flex items-start justify-between gap-3">
      <h2 class="text-base font-medium leading-snug text-gray-900">${esc(it.name)}</h2>
      <button type="button" data-action="compare" aria-pressed="${selected}"
        class="shrink-0 rounded-md border px-2 py-1 text-xs transition-colors ${
          selected
            ? 'border-brand-600 bg-brand-600 text-white'
            : 'border-gray-200 bg-white text-gray-500 hover:border-brand-300 hover:text-brand-700'
        }">${selected ? '已选' : '对比'}</button>
    </div>
    <p class="mt-1 text-xs text-gray-400">${esc(cat)}${sub ? ` · ${esc(sub)}` : ''}</p>
    <div class="mt-3 grid grid-cols-4 gap-1.5">
      ${statBox('热量', n.energy_kcal, 0, '')}
      ${statBox('蛋白', n.protein_g, 1, '')}
      ${statBox('脂肪', n.fat_g, 1, '')}
      ${statBox('碳水', n.carb_g, 1, '')}
    </div>
    ${(it.tags || []).length ? `<div class="mt-3 flex flex-wrap gap-1.5">${it.tags.map(tagBadge).join('')}</div>` : ''}
  </article>`;
}

// ---------- 列表渲染 ----------
function renderList() {
  const list = rootEl.querySelector('#food-list');
  const count = rootEl.querySelector('#food-count');
  const items = sortItems(filterItems());

  list.innerHTML = items.length
    ? items.map(cardHtml).join('')
    : emptyHint('没有符合条件的食物。试试减少筛选条件，或换一个关键词。');

  count.innerHTML = items.length === index.items.length
    ? `共 ${index.items.length} 条食物`
    : `<span class="font-medium text-gray-900">${items.length}</span> / ${index.items.length} 条`;
}

function syncChips() {
  rootEl.querySelectorAll('[data-cat]').forEach((el) => {
    const on = (el.dataset.cat || '') === state.cat;
    el.className = chipClass(on, 'green');
    el.setAttribute('aria-pressed', String(on));
  });
  rootEl.querySelectorAll('[data-tag]').forEach((el) => {
    const on = state.tags.has(el.dataset.tag);
    el.className = chipClass(on, el.dataset.accent || 'gray');
    el.setAttribute('aria-pressed', String(on));
  });
  const sortSel = rootEl.querySelector('#food-sort');
  if (sortSel) sortSel.value = `${state.sort.key}:${state.sort.dir}`;
}

// chip 的激活态需要「完整字面量类名」，不能拼接
const CHIP_ON = {
  green: 'border-brand-600 bg-brand-600 text-white',
  red: 'border-red-500 bg-red-500 text-white',
  blue: 'border-blue-500 bg-blue-500 text-white',
  amber: 'border-amber-500 bg-amber-500 text-white',
  gray: 'border-gray-500 bg-gray-500 text-white'
};
const CHIP_OFF = 'border-gray-200 bg-white text-gray-600 hover:border-gray-300';

function chipClass(on, accent) {
  const base = 'ui-chip';
  return on ? `${base} ${CHIP_ON[accent] || CHIP_ON.gray}` : `${base} ${CHIP_OFF}`;
}

function syncHash() {
  const query = {};
  if (state.q) query.q = state.q;
  if (state.tags.size) query.tags = [...state.tags].join(',');
  if (state.cat) query.cat = state.cat;
  const sortId = `${state.sort.key}:${state.sort.dir}`;
  if (sortId !== 'name:asc') query.sort = sortId;
  replaceQuery('/foods', query);
}

// ---------- 对比 ----------
function updateCompareBar() {
  const bar = rootEl.querySelector('#compare-bar');
  const hint = rootEl.querySelector('#compare-hint');
  const go = rootEl.querySelector('#compare-go');

  if (compare.length === 0) {
    bar.classList.add('hidden');
    return;
  }
  bar.classList.remove('hidden');

  const names = compare
    .map((id) => index.items.find((x) => x.id === id))
    .filter(Boolean)
    .map((x) => x.name)
    .join('  vs  ');

  hint.textContent = `已选 ${compare.length}/2：${names}`;
  go.disabled = compare.length < 2;
}

function toggleCompare(id) {
  const i = compare.indexOf(id);
  if (i > -1) {
    compare.splice(i, 1);
  } else if (compare.length >= 2) {
    compare.shift(); // 替换最早的选择，并明确告知，不静默失败
    compare.push(id);
  } else {
    compare.push(id);
  }

  // 同步卡片视觉
  rootEl.querySelectorAll('[data-food-id]').forEach((el) => {
    const on = compare.includes(el.dataset.foodId);
    el.classList.toggle('border-brand-300', on);
    el.classList.toggle('ring-2', on);
    el.classList.toggle('ring-brand-500', on);
    const btn = el.querySelector('[data-action="compare"]');
    if (btn) {
      btn.textContent = on ? '已选' : '对比';
      btn.setAttribute('aria-pressed', String(on));
      btn.className = `shrink-0 rounded-md border px-2 py-1 text-xs transition-colors ${
        on ? 'border-brand-600 bg-brand-600 text-white'
           : 'border-gray-200 bg-white text-gray-500 hover:border-brand-300 hover:text-brand-700'
      }`;
    }
  });

  updateCompareBar();
}

function diffLabel(a, b) {
  if (a == null || b == null) return '';
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  if (lo === 0) return hi === 0 ? '相同' : `${hi.toFixed(0)} : 0`;
  const ratio = hi / lo;
  if (ratio < 1.2) return '接近';
  if (ratio < 10) return `相差 ${ratio.toFixed(1)} 倍`;
  return `相差 ${Math.round(ratio)} 倍`;
}

function buildCompareBody() {
  const a = index.items.find((x) => x.id === compare[0]);
  const b = index.items.find((x) => x.id === compare[1]);
  if (!a || !b) return '<p class="text-sm text-gray-400">请先选择两种食物。</p>';

  const rows = METRICS.map((m) => {
    const va = m.key === 'gi' ? a.gi : a.nutrition?.[m.key];
    const vb = m.key === 'gi' ? b.gi : b.nutrition?.[m.key];
    const fa = va == null ? '—' : `${Number(va).toFixed(m.decimals)}${m.unit}`;
    const fb = vb == null ? '—' : `${Number(vb).toFixed(m.decimals)}${m.unit}`;
    return `<tr>
      <td class="ui-td text-gray-500">${esc(m.label)}</td>
      <td class="ui-td tabular-nums text-gray-900">${fa}</td>
      <td class="ui-td tabular-nums text-gray-900">${fb}</td>
      <td class="ui-td text-xs text-gray-400">${esc(diffLabel(va, vb))}</td>
    </tr>`;
  }).join('');

  const catA = index.catMap.get(a.category)?.name || '';
  const catB = index.catMap.get(b.category)?.name || '';

  const tagList = (it) => (it.tags || []).map(tagBadge).join('') || '<span class="text-xs text-gray-300">无</span>';

  return `<div class="overflow-x-auto rounded-xl border border-gray-200">
    <table class="ui-table">
      <caption class="sr-only">两种食物的营养数据对比</caption>
      <thead><tr>
        <th scope="col" class="ui-th">指标</th>
        <th scope="col" class="ui-th">${esc(a.name)}</th>
        <th scope="col" class="ui-th">${esc(b.name)}</th>
        <th scope="col" class="ui-th">差异幅度</th>
      </tr></thead>
      <tbody>
        ${rows}
        <tr>
          <td class="ui-td text-gray-500">分类</td>
          <td class="ui-td">${esc(catA)}</td>
          <td class="ui-td">${esc(catB)}</td>
          <td class="ui-td text-xs text-gray-400">${catA === catB ? '相同' : '不同'}</td>
        </tr>
        <tr>
          <td class="ui-td align-top text-gray-500">标签</td>
          <td class="ui-td"><div class="flex flex-wrap gap-1.5">${tagList(a)}</div></td>
          <td class="ui-td"><div class="flex flex-wrap gap-1.5">${tagList(b)}</div></td>
          <td class="ui-td text-xs text-gray-400">—</td>
        </tr>
      </tbody>
    </table>
  </div>
  <p class="mt-3 text-xs leading-relaxed text-gray-400">
    差异幅度只反映数值相差多少，不代表优劣。热量高在某些场景（如增重、耐力运动）反而是优点。
    所有数值均按每 ${esc(String(index.per))} ${esc(index.unit)} 可食部计。
  </p>`;
}

// ---------- 详情 ----------
function buildDetailBody(it) {
  const cat = index.catMap.get(it.category)?.name || '';
  const n = it.nutrition || {};

  const boxes = METRICS.map((m) => {
    const v = m.key === 'gi' ? it.gi : n[m.key];
    return `<div class="rounded-xl bg-gray-50 px-3 py-3 text-center">
      <p class="text-xs text-gray-400">${esc(m.label)}</p>
      <p class="mt-1 text-base font-medium tabular-nums text-gray-900">${
        v == null ? '<span class="text-gray-300">—</span>'
                  : `${Number(v).toFixed(m.decimals)}<span class="text-xs font-normal text-gray-400">${esc(m.unit)}</span>`
      }</p>
    </div>`;
  }).join('');

  return `
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-lg font-medium text-gray-900">${esc(it.name)}</h2>
        <p class="mt-1 text-sm text-gray-400">${esc(cat)}${it.subCategory ? ` · ${esc(it.subCategory)}` : ''} · 每 ${esc(String(index.per))} ${esc(index.unit)}</p>
      </div>
      ${CLOSE_BTN}
    </div>
    ${it.highlight ? `<p class="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-sm leading-relaxed text-brand-700">${esc(it.highlight)}</p>` : ''}
    <div class="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">${boxes}</div>
    ${(it.tags || []).length ? `<div class="mt-4 flex flex-wrap gap-1.5">${it.tags.map(tagBadge).join('')}</div>` : ''}
    ${it.note ? `<p class="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">${esc(it.note)}</p>` : ''}
    ${(it.aliases || []).length ? `<p class="mt-4 text-xs text-gray-400">别名：${esc(it.aliases.join('、'))}</p>` : ''}
    <p class="mt-2 text-xs text-gray-400">数据来源：${esc(it.source || '')}</p>
  `;
}

// ---------- 页面 ----------
export default {
  id: 'foods',
  title: '食物营养图谱',

  async render(ctx) {
    const foods = await ctx.store.load('foods');
    buildIndex(foods);

    const q = ctx.query || {};
    state.q = q.q || '';
    state.tags = new Set(
      String(q.tags || '').split(',').filter((t) => t && index.tagMap.has(t))
    );
    state.cat = index.catMap.has(q.cat) ? q.cat : '';
    const found = SORTS.find((s) => s.id === q.sort);
    state.sort = found ? { key: found.key, dir: found.dir } : { key: 'name', dir: 'asc' };
    compare = [];

    const catChips = [
      `<button type="button" data-cat="" class="ui-chip ${CHIP_OFF}">全部</button>`,
      ...(foods.categories || []).map(
        (c) => `<button type="button" data-cat="${esc(c.id)}" class="ui-chip ${CHIP_OFF}">${esc(c.name)}</button>`
      )
    ].join('');

    const tagChips = (foods.tags || [])
      .map(
        (t) => `<button type="button" data-tag="${esc(t.id)}" data-accent="${esc(t.accent)}" class="ui-chip ${CHIP_OFF}">${esc(t.name)}</button>`
      )
      .join('');

    const sortOptions = SORTS.map(
      (s) => `<option value="${esc(s.id)}"${s.id === `${state.sort.key}:${state.sort.dir}` ? ' selected' : ''}>${esc(s.label)}</option>`
    ).join('');

    const html = `
      <header class="mb-8">
        <h1 class="text-2xl font-semibold tracking-tight text-gray-900">食物营养图谱</h1>
        <p class="mt-3 max-w-2xl text-base leading-relaxed text-gray-500">
          ${index.items.length} 种常见食物的营养数据，均为每 ${esc(String(index.per))} ${esc(index.unit)} 可食部的参考值。
          点击卡片查看详情，用「对比」按钮可以并排比较两种食物。
        </p>
      </header>

      <div class="ui-card mb-5 space-y-4">
        <div>
          <label for="food-search" class="sr-only">搜索食物</label>
          <input id="food-search" type="search" value="${esc(state.q)}"
            placeholder="搜索食物名称、别名或标签，例如「燕麦」「慢碳」「低 GI」"
            class="ui-input">
        </div>

        <div>
          <p class="mb-2 text-xs text-gray-400">分类</p>
          <div id="food-cats" class="flex flex-wrap gap-1.5">${catChips}</div>
        </div>

        <div>
          <p class="mb-2 text-xs text-gray-400">标签（可多选，需同时满足）</p>
          <div id="food-tags" class="flex flex-wrap gap-1.5">${tagChips}</div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <p id="food-count" class="text-sm text-gray-500"></p>
          <div class="flex items-center gap-2">
            <label for="food-sort" class="text-xs text-gray-400">排序</label>
            <select id="food-sort" class="ui-select">${sortOptions}</select>
          </div>
        </div>
      </div>

      <div id="food-list" class="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3"></div>

      <div id="compare-bar" class="fixed inset-x-0 bottom-0 z-30 hidden border-t border-gray-200 bg-white/95 backdrop-blur">
        <div class="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <p id="compare-hint" class="min-w-0 flex-1 truncate text-sm text-gray-600"></p>
          <div class="flex shrink-0 gap-2">
            <button type="button" id="compare-clear" class="ui-btn">清空</button>
            <button type="button" id="compare-go" disabled
              class="rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40">开始对比</button>
          </div>
        </div>
      </div>

      <dialog id="food-detail" class="w-[min(94vw,36rem)] rounded-2xl p-0 backdrop:bg-black/40">
        <div id="food-detail-body" class="p-6"></div>
      </dialog>

      <dialog id="food-compare" class="w-[min(94vw,46rem)] rounded-2xl p-0 backdrop:bg-black/40">
        <div class="p-6">
          <div class="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-medium text-gray-900">食物对比</h2>
              <p class="mt-1 text-sm text-gray-400">数据按每 ${esc(String(index.per))} ${esc(index.unit)} 可食部计</p>
            </div>
            ${CLOSE_BTN}
          </div>
          <div id="food-compare-body"></div>
        </div>
      </dialog>
    `;

    return {
      html,
      onMount(root) {
        rootEl = root;
        renderList();
        syncChips();
        bindEvents(root);
      }
    };
  }
};

// ---------- 事件绑定（全部委托） ----------
function bindEvents(root) {
  const list = root.querySelector('#food-list');
  const detail = root.querySelector('#food-detail');
  const compareDlg = root.querySelector('#food-compare');

  // 搜索（防抖 200ms；只重渲染列表，输入框保持焦点）
  const input = root.querySelector('#food-search');
  input.addEventListener('input', debounce(() => {
    state.q = input.value;
    syncHash();
    renderList();
  }, 200));

  // 分类
  root.querySelector('#food-cats').addEventListener('click', (e) => {
    const chip = e.target.closest('[data-cat]');
    if (!chip) return;
    state.cat = chip.dataset.cat || '';
    syncChips();
    syncHash();
    renderList();
  });

  // 标签
  root.querySelector('#food-tags').addEventListener('click', (e) => {
    const chip = e.target.closest('[data-tag]');
    if (!chip) return;
    const t = chip.dataset.tag;
    state.tags.has(t) ? state.tags.delete(t) : state.tags.add(t);
    syncChips();
    syncHash();
    renderList();
  });

  // 排序
  root.querySelector('#food-sort').addEventListener('change', (e) => {
    const found = SORTS.find((s) => s.id === e.target.value) || SORTS[0];
    state.sort = { key: found.key, dir: found.dir };
    syncHash();
    renderList();
  });

  // 列表：详情 / 对比
  list.addEventListener('click', (e) => {
    const card = e.target.closest('[data-food-id]');
    if (!card) return;
    const id = card.dataset.foodId;

    if (e.target.closest('[data-action="compare"]')) {
      e.preventDefault();
      toggleCompare(id);
      return;
    }

    const it = index.items.find((x) => x.id === id);
    if (!it) return;
    root.querySelector('#food-detail-body').innerHTML = buildDetailBody(it);
    detail.showModal();
  });

  // 对比浮条
  root.querySelector('#compare-clear').addEventListener('click', () => {
    [...compare].forEach((id) => toggleCompare(id));
  });

  root.querySelector('#compare-go').addEventListener('click', () => {
    if (compare.length < 2) return;
    root.querySelector('#food-compare-body').innerHTML = buildCompareBody();
    compareDlg.showModal();
  });

  // 弹窗关闭：按钮 + 点击背景 + ESC（ESC 由 dialog 原生支持）
  [detail, compareDlg].forEach((dlg) => {
    dlg.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]') || e.target === dlg) dlg.close();
    });
  });
}
