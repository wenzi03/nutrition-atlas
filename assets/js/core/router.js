// core/router.js —— hash 路由解析与页面调度
// 约定：所有页面内锚点用 JS 滚动实现，不改 location.hash（否则会被当成路由跳转）

import { esc } from './dom.js';
import { renderPager } from './pager.js';

const routes = new Map();

export function register(path, page) {
  routes.set(path, page);
}

/** 解析当前 hash → { path, query } */
export function resolve() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const qi = raw.indexOf('?');
  const path = (qi === -1 ? raw : raw.slice(0, qi)) || '/';
  const qs = qi === -1 ? '' : raw.slice(qi + 1);
  const query = Object.fromEntries(new URLSearchParams(qs));
  return { path, query };
}

/** 反向拼装 hash 链接 */
export function buildHref(path, query = {}) {
  const usp = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== '' && v != null) usp.set(k, v);
  });
  const qs = usp.toString();
  return `#${path}${qs ? `?${qs}` : ''}`;
}

/** 只更新 query，不动历史栈深度（避免每输入一个字符就多一条记录） */
export function replaceQuery(path, query = {}) {
  const href = buildHref(path, query);
  if (location.hash !== href) {
    history.replaceState(null, '', href);
  }
}

function setActiveNav(path) {
  document.querySelectorAll('[data-nav]').forEach((a) => {
    const active = a.dataset.nav === path;
    a.classList.toggle('text-brand-700', active);
    a.classList.toggle('bg-brand-50', active);
    a.classList.toggle('font-medium', active);
    a.classList.toggle('text-gray-600', !active);
    if (active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

/** 从 sections 自动生成页内目录，用 JS 平滑滚动 */
function buildToc(root) {
  const secs = [...root.querySelectorAll('section[id]')];
  if (secs.length < 3) return;

  const items = secs
    .map((s) => {
      const h2 = s.querySelector('h2');
      return h2 ? { id: s.id, label: h2.textContent.trim() } : null;
    })
    .filter(Boolean);
  if (items.length < 3) return;

  const nav = document.createElement('nav');
  nav.className = 'mb-10 flex flex-wrap gap-2 border-b border-gray-200 pb-4';
  nav.setAttribute('aria-label', '本页目录');
  nav.innerHTML = items
    .map(
      (it) =>
        `<a href="#${esc(it.id)}" data-toc="${esc(it.id)}" class="ui-pill">${esc(it.label)}</a>`
    )
    .join('');

  const anchor = root.querySelector('header') || root.firstElementChild;
  if (anchor && anchor.parentNode === root) anchor.after(nav);
  else root.prepend(nav);

  nav.addEventListener('click', (e) => {
    const a = e.target.closest('[data-toc]');
    if (!a) return;
    e.preventDefault();
    const target = root.querySelector(`#${CSS.escape(a.dataset.toc)}`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/** 整页级错误视图（fetch 失败、JSON 损坏等） */
export function renderFatal(err) {
  const isFile = err.kind === 'file-protocol';

  if (isFile) {
    return `<div class="ui-card border-amber-200 bg-amber-50">
      <h1 class="text-lg font-medium text-amber-800">需要通过本地服务器打开</h1>
      <p class="mt-3 text-sm leading-relaxed text-amber-700">
        浏览器禁止 <code class="rounded bg-amber-100 px-1 py-0.5 text-xs">file://</code>
        协议读取本地 JSON 文件，所以直接双击 <code class="rounded bg-amber-100 px-1 py-0.5 text-xs">index.html</code>
        会看不到任何内容。
      </p>
      <p class="mt-3 text-sm leading-relaxed text-amber-700">请改用下面任一方式：</p>
      <ol class="mt-3 space-y-2 text-sm text-amber-700">
        <li class="flex gap-2"><span class="font-medium">1.</span>
          <span>双击项目根目录下的 <code class="rounded bg-amber-100 px-1 py-0.5 text-xs">start.bat</code>，会自动启动服务并打开浏览器。</span>
        </li>
        <li class="flex gap-2"><span class="font-medium">2.</span>
          <span>在项目目录执行 <code class="rounded bg-amber-100 px-1 py-0.5 text-xs">python -m http.server 8080</code>，然后访问
          <code class="rounded bg-amber-100 px-1 py-0.5 text-xs">http://localhost:8080</code>。</span>
        </li>
      </ol>
    </div>`;
  }

  const hints = {
    'not-found': '数据文件不存在，请确认 data/ 目录已随项目一起复制。',
    parse: '数据文件不是合法的 JSON，常见原因是多余的逗号、缺少引号或中文引号。',
    network: '网络请求失败，请确认本地服务器仍在运行。',
    http: '服务器返回了错误状态码。'
  };

  return `<div class="ui-card border-red-200 bg-red-50">
    <h1 class="text-lg font-medium text-red-800">内容加载失败</h1>
    <p class="mt-3 text-sm text-red-700">${esc(err.message)}</p>
    ${err.url ? `<p class="mt-2 text-xs text-red-600">请求地址：${esc(err.url)}</p>` : ''}
    <p class="mt-3 text-sm leading-relaxed text-red-700">${esc(hints[err.kind] || '请检查数据文件后重试。')}</p>
    <button type="button" data-retry class="mt-4 ui-btn border-red-300 text-red-700 hover:border-red-400">重新加载</button>
  </div>`;
}

function render404(path) {
  const list = [...routes.entries()]
    .filter(([p]) => p !== '404')
    .map(([p, page]) => ({ p, id: page.id, title: page.title || p }))
    .sort((a, b) => (a.id === 'home' ? -1 : b.id === 'home' ? 1 : 0));

  return `<div class="ui-card">
    <h1 class="text-2xl font-semibold text-gray-900">页面未找到</h1>
    <p class="mt-2 text-sm text-gray-500">
      没有匹配 <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">${esc(path)}</code> 的页面。
    </p>
    <div class="mt-5 flex flex-wrap gap-2">
      ${list
        .map(
          (r) =>
            `<a href="#${r.p}" class="ui-pill">${esc(r.title)}</a>`
        )
        .join('')}
    </div>
  </div>`;
}

/**
 * 启动路由
 * @param {HTMLElement} root 页面挂载点
 * @param {object} store JSON 加载器
 * @param {object} meta  站点元数据（导航、来源、免责声明）
 */
export function start(root, store, meta) {
  let runToken = 0;

  async function run() {
    const token = ++runToken;
    const { path, query } = resolve();
    const page = routes.get(path) || routes.get('404');
    const is404 = !routes.has(path);

    setActiveNav(is404 ? '__none__' : path);
    root.setAttribute('aria-busy', 'true');
    root.innerHTML = '<p class="text-sm text-gray-400">正在加载…</p>';

    try {
      let html;
      let onMount;

      if (is404) {
        html = render404(path);
      } else {
        const ctx = { store, meta, query, path };
        const result = await page.render(ctx);
        if (token !== runToken) return; // 已被更新的导航取代，丢弃本次结果
        html = typeof result === 'string' ? result : result.html;
        onMount = typeof result === 'object' ? result.onMount : undefined;

        // 内容页自动追加「上一页 / 下一页」
        if (page.id && meta?.nav?.some((n) => n.id === page.id)) {
          html += renderPager(page.id, meta);
        }
      }

      if (token !== runToken) return;
      root.innerHTML = html;

      document.title = is404
        ? '页面未找到 · ' + (meta?.site?.title || '')
        : page.title
          ? `${page.title} · ${meta?.site?.title || ''}`
          : meta?.site?.title || '';

      onMount?.(root, store, query);
      buildToc(root);
    } catch (err) {
      if (token !== runToken) return;
      console.error('[router] 渲染失败', err);
      root.innerHTML = renderFatal(err);
      root.querySelector('[data-retry]')?.addEventListener('click', () => run());
    } finally {
      if (token === runToken) root.setAttribute('aria-busy', 'false');
    }

    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', run);
  return run();
}
