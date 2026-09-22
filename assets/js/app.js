// app.js —— 入口：加载 meta、注入导航与页脚、注册路由并启动

import { createStore } from './core/store.js';
import { register, start, renderFatal } from './core/router.js';
import { esc } from './core/dom.js';

import home from './pages/home.js';
import overview from './pages/overview.js';
import carbs from './pages/carbs.js';
import protein from './pages/protein.js';
import fat from './pages/fat.js';
import foods from './pages/foods.js';
import quick from './pages/quick.js';
import faq from './pages/faq.js';

const PAGES = {
  '/': home,
  '/overview': overview,
  '/carbs': carbs,
  '/protein': protein,
  '/fat': fat,
  '/foods': foods,
  '/quick': quick,
  '/faq': faq
};

const appRoot = document.getElementById('app');
const store = createStore('data/');

let meta = null;
let bootError = null;
try {
  meta = await store.load('meta');
} catch (err) {
  bootError = err;
}

if (!meta) {
  // meta 都读不到，说明整个数据层不可用（最常见的是直接双击打开了 index.html）
  appRoot.innerHTML = renderFatal(bootError || new Error('无法加载 data/meta.json'));
  appRoot.setAttribute('aria-busy', 'false');
} else {
  bootstrap(meta);
}

function bootstrap(meta) {
  renderNav(meta);
  renderFooter(meta);
  bindMobileNav();

  Object.entries(PAGES).forEach(([path, page]) => register(path, page));

  start(appRoot, store, meta);

  // 开发调试用：控制台执行 __store.clear() 可清空 JSON 缓存
  window.__store = store;
  window.__meta = meta;
}

function renderNav(meta) {
  const nav = meta.nav || [];
  const desktop = document.getElementById('site-nav');
  const mobile = document.getElementById('site-nav-mobile');

  desktop.innerHTML = nav
    .map(
      (n) =>
        `<a data-nav="${esc(n.path)}" href="#${esc(n.path)}" class="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50">${esc(n.label)}</a>`
    )
    .join('');

  mobile.innerHTML = nav
    .map(
      (n) =>
        `<a data-nav="${esc(n.path)}" href="#${esc(n.path)}" class="block rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50">${esc(n.label)}</a>`
    )
    .join('');
}

function renderFooter(meta) {
  const sources = (meta.sources || [])
    .map((s) =>
      s.url
        ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" class="transition-colors hover:text-gray-600">${esc(s.name)}</a>`
        : `<span>${esc(s.name)}</span>`
    )
    .join(' · ');

  document.getElementById('footer-sources').innerHTML = `数据来源：${sources}`;
  document.getElementById('footer-disclaimer').textContent = meta.disclaimer || '';

  const year = new Date().getFullYear();
  const brand = document.getElementById('footer-brand');
  if (brand) {
    brand.textContent = `${meta.site?.title || '营养学知识库'} · ${year}`;
  }
}

function bindMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const mobileNav = document.getElementById('site-nav-mobile');
  if (!toggle || !mobileNav) return;

  toggle.addEventListener('click', () => {
    const hidden = mobileNav.classList.toggle('hidden');
    toggle.setAttribute('aria-expanded', String(!hidden));
  });

  // 点击任一导航项后自动收起
  mobileNav.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      mobileNav.classList.add('hidden');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}
