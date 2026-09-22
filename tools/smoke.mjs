#!/usr/bin/env node
/**
 * tools/smoke.mjs —— 页面渲染冒烟测试
 * 在 Node 中直接调用各页面的 render()，检查生成的 HTML 是否健康。
 * 不需要浏览器，能抓出字符串拼接拼错、字段缺失、组件未注册等常见问题。
 *
 * 用法：node tools/smoke.mjs
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const store = {
  async load(name) {
    return JSON.parse(readFileSync(path.join(ROOT, 'data', `${name}.json`), 'utf8'));
  }
};

const meta = await store.load('meta');

const CASES = [
  { path: '/', file: 'home' },
  { path: '/overview', file: 'overview' },
  { path: '/carbs', file: 'carbs' },
  { path: '/protein', file: 'protein' },
  { path: '/fat', file: 'fat' },
  { path: '/foods', file: 'foods' },
  { path: '/quick', file: 'quick' },
  { path: '/faq', file: 'faq' }
];

const ROUTE_PATHS = new Set(CASES.map((c) => c.path));

const BAD = [
  ['undefined', /undefined/],
  ['NaN', /NaN/],
  ['[object Object]', /\[object Object\]/],
  ['组件未注册', /未知展示类型/],
  ['null 泄漏', />null</]
];

let errors = 0;

console.log('页面渲染冒烟测试\n');

const routeLinks = new Set();

for (const c of CASES) {
  const url = pathToFileURL(path.join(ROOT, 'assets', 'js', 'pages', `${c.file}.js`)).href;
  const mod = await import(url);
  const page = mod.default;

  if (!page || typeof page.render !== 'function') {
    console.log(`  [ERROR] ${c.path}  页面模块没有导出 render 方法`);
    errors++;
    continue;
  }

  let html;
  try {
    const res = await page.render({ store, meta, query: {}, path: c.path });
    html = typeof res === 'string' ? res : res.html;
  } catch (e) {
    console.log(`  [ERROR] ${c.path}  render 抛异常：${e.message}`);
    errors++;
    continue;
  }

  if (typeof html !== 'string' || html.length < 300) {
    console.log(`  [ERROR] ${c.path}  输出过短（${html ? html.length : 0} 字符）`);
    errors++;
    continue;
  }

  const problems = BAD.filter(([, re]) => re.test(html)).map(([n]) => n);
  if (problems.length) {
    console.log(`  [ERROR] ${c.path}  输出包含异常内容：${problems.join('、')}`);
    errors++;
    continue;
  }

  // 收集页内链接
  for (const m of html.matchAll(/href="#(\/[^"?]*)/g)) routeLinks.add(m[1]);

  const sections = (html.match(/<section id=/g) || []).length;
  console.log(`  [OK   ] ${c.path.padEnd(11)} ${String(html.length).padStart(6)} 字符, ${sections} 个 section`);
}

// 页内链接有效性（允许 /foods 带 query）
console.log('\n内部链接检查');
for (const link of routeLinks) {
  if (!ROUTE_PATHS.has(link)) {
    console.log(`  [ERROR] 存在无效链接：#${link}`);
    errors++;
  }
}
console.log(`  共 ${routeLinks.size} 个不同的内部链接`);

console.log('');
if (errors > 0) {
  console.log(`发现 ${errors} 项问题。`);
  process.exit(1);
} else {
  console.log('全部页面渲染正常。');
}
