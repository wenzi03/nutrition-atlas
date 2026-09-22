#!/usr/bin/env node
/**
 * tools/check-imports.js —— 前端模块导入检查
 * 浏览器原生 ESM 要求 import 路径必须带 .js 后缀且文件真实存在，
 * 写错只会在控制台报错、页面白屏。此脚本在启动前静态检查。
 *
 * 用法：node tools/check-imports.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const JS_DIR = path.join(ROOT, 'assets', 'js');

let errors = 0;
let checked = 0;

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

/** 收集一个模块导出的名字 */
function exportsOf(file) {
  const src = fs.readFileSync(file, 'utf8');
  const names = new Set();
  for (const m of src.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s+(?:const|let|var)\s+([A-Za-z0-9_$]+)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s*\{([^}]+)\}/g)) {
    m[1].split(',').forEach((s) => {
      const part = s.trim();
      if (!part) return;
      const alias = part.split(/\s+as\s+/);
      names.add((alias[1] || alias[0]).trim());
    });
  }
  if (/export\s+default/.test(src)) names.add('default');
  return names;
}

const files = walk(JS_DIR);
const exportCache = new Map();

for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const src = fs.readFileSync(file, 'utf8');
  const dir = path.dirname(file);

  const re = /import\s+(?:([\s\S]*?)\s+from\s+)?['"]([^'"]+)['"]/g;
  for (const m of src.matchAll(re)) {
    const clause = (m[1] || '').trim();
    const spec = m[2];
    checked++;

    if (!spec.startsWith('.')) {
      console.log(`  [SKIP ] ${rel} -> ${spec}（非相对路径）`);
      continue;
    }

    const target = path.resolve(dir, spec);

    if (!fs.existsSync(target)) {
      console.log(`  [ERROR] ${rel} -> ${spec}  文件不存在`);
      errors++;
      continue;
    }
    if (path.extname(target) !== '.js') {
      console.log(`  [WARN ] ${rel} -> ${spec}  浏览器 ESM 需要显式 .js 后缀`);
    }

    if (!exportCache.has(target)) exportCache.set(target, exportsOf(target));
    const available = exportCache.get(target);

    // 解析具名导入
    const namedMatch = clause.match(/\{([\s\S]*)\}/);
    if (namedMatch) {
      namedMatch[1].split(',').forEach((piece) => {
        const part = piece.trim();
        if (!part) return;
        const name = part.split(/\s+as\s+/)[0].trim();
        if (!available.has(name)) {
          console.log(`  [ERROR] ${rel} -> ${spec}  目标未导出 ${name}`);
          errors++;
        }
      });
    }

    // 默认导入
    if (clause && !clause.startsWith('{') && !clause.startsWith('*')) {
      if (!available.has('default')) {
        console.log(`  [ERROR] ${rel} -> ${spec}  目标没有 default 导出`);
        errors++;
      }
    }
  }
}

console.log('');
console.log(`检查 ${files.length} 个模块、${checked} 条 import 语句。`);
if (errors > 0) {
  console.log(`发现 ${errors} 项错误。`);
  process.exit(1);
} else {
  console.log('全部导入路径与导出名称正确。');
}
