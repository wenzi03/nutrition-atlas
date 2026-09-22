#!/usr/bin/env node
/**
 * tools/validate.js —— 数据校验脚本
 * 用法：node tools/validate.js
 * 检查项见技术文档 §15.1
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const REQUIRED_FILES = [
  'meta', 'nutrients', 'carbs', 'protein',
  'fat', 'foods', 'rankings', 'faq'
];

const SECTION_TYPES = ['table', 'compare', 'cards', 'gi-table', 'stacked-bar', 'list', 'ranking'];
const ACCENTS = ['green', 'red', 'blue', 'amber', 'gray'];
const CARB_TYPES = ['fast', 'slow'];
const PROTEIN_TYPES = ['complete', 'semi-complete', 'incomplete'];
const GI_LEVELS = ['low', 'mid', 'high'];
const LIST_STYLES = ['check', 'cross', 'dot'];

let errorCount = 0;
let warnCount = 0;

const err = (m) => { console.log('  [ERROR] ' + m); errorCount++; };
const warn = (m) => { console.log('  [WARN ] ' + m); warnCount++; };
const ok = (m) => console.log('  [OK   ] ' + m);
const section = (m) => console.log('\n' + m);

const data = {};

// ---------- 1. 解析 ----------
section('1. JSON 解析');
REQUIRED_FILES.forEach((name) => {
  const file = path.join(DATA_DIR, name + '.json');
  if (!fs.existsSync(file)) {
    err(`缺少文件：data/${name}.json`);
    return;
  }
  try {
    data[name] = JSON.parse(fs.readFileSync(file, 'utf8'));
    ok(`data/${name}.json`);
  } catch (e) {
    err(`data/${name}.json 解析失败：${e.message}`);
  }
});

// ---------- 2. 通用 section 校验 ----------
function checkSections(list, where) {
  if (!Array.isArray(list)) return;
  const seen = new Set();
  list.forEach((s, i) => {
    const label = `${where}[${i}]`;
    if (!s.id) err(`${label} 缺少 id`);
    else if (seen.has(s.id)) err(`${label} id 重复：${s.id}`);
    else seen.add(s.id);

    if (!s.title) warn(`${label} 缺少 title`);
    if (!SECTION_TYPES.includes(s.type)) {
      err(`${label} 未知 type：${s.type}`);
      return;
    }
    if (s.type === 'table' && !Array.isArray(s.columns)) err(`${label} table 缺少 columns`);
    if (s.type === 'compare' && (!s.left || !s.right)) err(`${label} compare 缺少 left/right`);
    if (s.type === 'gi-table' && !Array.isArray(s.rows)) err(`${label} gi-table 缺少 rows`);
    if (s.type === 'ranking' && !Array.isArray(s.items)) err(`${label} ranking 缺少 items`);

    if (s.type === 'gi-table') {
      (s.rows || []).forEach((r, j) => {
        if (!GI_LEVELS.includes(r.level)) err(`${label}.rows[${j}] level 非法：${r.level}`);
        if (typeof r.gi !== 'number' || r.gi < 0 || r.gi > 110) {
          err(`${label}.rows[${j}] gi 超出范围：${r.gi}`);
        }
      });
    }

    if (s.type === 'list' && s.style && !LIST_STYLES.includes(s.style)) {
      err(`${label} style 非法：${s.style}`);
    }

    if (s.type === 'stacked-bar') {
      (s.items || []).forEach((it, j) => {
        const sum = (s.series || []).reduce((a, ser) => a + (Number(it[ser.key]) || 0), 0);
        if (sum < 95 || sum > 105) warn(`${label}.items[${j}]（${it.name}）占比合计 ${sum}，偏离 100`);
      });
    }

    // accent 合法性
    const accents = [];
    if (s.left) accents.push(s.left.accent);
    if (s.right) accents.push(s.right.accent);
    if (Array.isArray(s.items) && s.type === 'cards') s.items.forEach((it) => accents.push(it.accent));
    if (Array.isArray(s.items) && s.type === 'ranking') s.items.forEach((it) => accents.push(it.accent));
    accents.filter(Boolean).forEach((a) => {
      if (!ACCENTS.includes(a)) err(`${label} accent 非法：${a}`);
    });
  });
}

section('2. 内容页 sections 校验');
['nutrients', 'carbs', 'protein', 'fat', 'rankings'].forEach((n) => {
  if (data[n]) {
    checkSections(data[n].sections, `data/${n}.json`);
    ok(`data/${n}.json 共 ${(data[n].sections || []).length} 个 section`);
  }
});

section('3. 误区数据校验');
['nutrients', 'carbs', 'protein', 'fat'].forEach((n) => {
  const myths = data[n] && data[n].myths;
  if (!Array.isArray(myths) || myths.length === 0) {
    warn(`data/${n}.json 缺少 myths`);
    return;
  }
  myths.forEach((m, i) => {
    if (!m.myth) err(`data/${n}.json myths[${i}] 缺少 myth`);
    if (!m.fact) err(`data/${n}.json myths[${i}] 缺少 fact`);
  });
  ok(`data/${n}.json 共 ${myths.length} 条误区`);
});

// ---------- 4. foods 校验 ----------
section('4. 食物库数据校验');
const foods = data.foods;
if (foods) {
  const catIds = new Set((foods.categories || []).map((c) => c.id));
  const tagIds = new Set((foods.tags || []).map((t) => t.id));
  const items = foods.items || [];

  const seenIds = new Set();
  const seenNames = new Set();
  const byCat = {};
  const byTag = {};

  items.forEach((it, i) => {
    const label = `items[${i}]（${it.name || it.id || '无名'}）`;

    ['id', 'name', 'category', 'nutrition', 'tags', 'source'].forEach((k) => {
      if (it[k] == null) err(`${label} 缺少必填字段 ${k}`);
    });

    if (it.id) {
      if (seenIds.has(it.id)) err(`${label} id 重复：${it.id}`);
      seenIds.add(it.id);
      if (!/^[a-z0-9-]+$/.test(it.id)) err(`${label} id 应为 kebab-case：${it.id}`);
    }
    if (it.name) {
      if (seenNames.has(it.name)) warn(`${label} 名称重复：${it.name}`);
      seenNames.add(it.name);
    }

    if (it.category) {
      if (!catIds.has(it.category)) err(`${label} category 引用不存在：${it.category}`);
      byCat[it.category] = (byCat[it.category] || 0) + 1;
    }

    (it.tags || []).forEach((t) => {
      if (!tagIds.has(t)) err(`${label} tag 引用不存在：${t}`);
      byTag[t] = (byTag[t] || 0) + 1;
    });

    if (it.carbType && !CARB_TYPES.includes(it.carbType)) err(`${label} carbType 非法：${it.carbType}`);
    if (it.proteinType && !PROTEIN_TYPES.includes(it.proteinType)) err(`${label} proteinType 非法：${it.proteinType}`);

    const n = it.nutrition || {};
    ['energy_kcal', 'protein_g', 'fat_g', 'carb_g', 'fiber_g'].forEach((k) => {
      if (!(k in n)) {
        err(`${label} nutrition 缺少 ${k}`);
      } else if (typeof n[k] !== 'number' || n[k] < 0) {
        err(`${label} nutrition.${k} 非法：${n[k]}`);
      }
    });

    if (it.gi != null && (typeof it.gi !== 'number' || it.gi < 0 || it.gi > 110)) {
      err(`${label} gi 超出范围：${it.gi}`);
    }

    // 能量一致性：4P + 9F + 4*(C-Fiber) + 2*Fiber
    if (n.energy_kcal > 0) {
      const est = 4 * n.protein_g + 9 * n.fat_g
        + 4 * Math.max(0, n.carb_g - n.fiber_g) + 2 * n.fiber_g;
      const dev = Math.abs(est - n.energy_kcal) / n.energy_kcal;
      if (dev > 0.20) {
        err(`${label} 能量不一致：标注 ${n.energy_kcal} kcal，按 4/9/4 估算 ${est.toFixed(0)} kcal（偏差 ${(dev * 100).toFixed(0)}%）`);
      }
    }

    // 标签语义一致性（slow-carb 只针对主食类，水果与豆制品的 slow 是血管反应分类）
    if (it.carbType === 'slow' && it.category === 'grain' && !(it.tags || []).includes('slow-carb')) {
      warn(`${label} 主食类 carbType=slow 但未打 slow-carb 标签`);
    }
    const isProcessed = /加工/.test(it.subCategory || '');
    if (it.proteinType === 'complete' && (n.protein_g || 0) >= 15
        && !isProcessed && !(it.tags || []).includes('complete-protein')) {
      warn(`${label} 是含量≥15g 的完全蛋白，建议加 complete-protein 标签`);
    }
  });

  ok(`食物总数：${items.length}`);
  ok(`分类覆盖：${Object.keys(byCat).length} / ${catIds.size}`);

  catIds.forEach((c) => {
    if (!byCat[c]) warn(`分类 ${c} 下没有任何食物`);
  });

  section('   各分类数量');
  (foods.categories || []).forEach((c) => {
    console.log(`   - ${c.name}（${c.id}）：${byCat[c.id] || 0} 条`);
  });

  section('   各标签数量');
  (foods.tags || []).forEach((t) => {
    const count = byTag[t.id] || 0;
    if (count === 0) warn(`标签 ${t.name}（${t.id}）没有被任何食物使用`);
    console.log(`   - ${t.name}（${t.id}）：${count} 条`);
  });
}

// ---------- 5. meta 校验 ----------
section('5. meta 校验');
if (data.meta) {
  const nav = data.meta.nav || [];
  const ids = new Set();
  nav.forEach((n) => {
    if (!n.id || !n.label || !n.path) err(`nav 项字段不完整：${JSON.stringify(n)}`);
    if (ids.has(n.id)) err(`nav id 重复：${n.id}`);
    ids.add(n.id);
  });
  if (!data.meta.disclaimer) err('meta 缺少 disclaimer');
  if (!Array.isArray(data.meta.sources) || data.meta.sources.length === 0) warn('meta.sources 为空');
  ok(`导航项：${nav.length} 个`);
}

// ---------- 6. faq 校验 ----------
section('6. FAQ 校验');
if (data.faq) {
  const items = data.faq.items || [];
  const seen = new Set();
  items.forEach((it, i) => {
    if (!it.id) err(`faq.items[${i}] 缺少 id`);
    if (seen.has(it.id)) err(`faq.items[${i}] id 重复：${it.id}`);
    seen.add(it.id);
    if (!it.q) err(`faq.items[${i}] 缺少 q`);
    if (!it.a) err(`faq.items[${i}] 缺少 a`);
    if (typeof it.a === 'string' && it.a.length < 40) warn(`faq.items[${i}] 回答过短`);
  });
  ok(`FAQ 条目：${items.length} 条`);
}

// ---------- 汇总 ----------
section('校验结果');
console.log(`  错误 ${errorCount} 项，警告 ${warnCount} 项`);
if (errorCount > 0) {
  console.log('\n存在错误，请修复后重试。');
  process.exit(1);
} else {
  console.log('\n数据校验通过。');
}
