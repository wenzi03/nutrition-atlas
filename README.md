# 营养学知识库

一个纯前端的营养学基础科普网站。没有后端、没有数据库，所有内容存放在 `data/` 目录下的 JSON 文件里，**改数据即改网站，不需要动代码**。

内容覆盖：营养素总览、碳水化合物的分类与快慢碳区别、蛋白质的种类与优质蛋白、脂肪的四类划分与 Omega 系列，外加一个 101 种常见食物的可搜索数据库。

---

## 快速开始

**双击 `start.bat`**。

脚本会启动本地服务器并自动打开浏览器，地址是 http://localhost:8080/。

> **为什么不能直接双击 `index.html`？**
> 浏览器禁止 `file://` 协议读取本地 JSON 文件（同源策略，origin 为 `null`），直接双击打开会看不到任何内容。必须通过 `http://localhost` 访问。`start.bat` 就是为此准备的。
>
> 如果 `start.bat` 打不开，说明本机没有 node 也没有 python。任选其一安装即可，也可以把整个文件夹上传到任意静态托管（Vercel / Netlify / GitHub Pages / OSS），线上访问没有这个限制。

---

## 目录结构

```
nutrition-site/
├── index.html              唯一入口（导航壳 + 挂载点 + 页脚）
├── start.bat               Windows 一键启动
├── package.json            只用两个构建期依赖，运行时不需要
│
├── data/                   ★ 所有内容都在这里
│   ├── meta.json           站点配置、导航、数据来源、免责声明
│   ├── nutrients.json      营养素总览
│   ├── carbs.json          碳水化合物（含 GI 速查表）
│   ├── protein.json        蛋白质
│   ├── fat.json            脂肪
│   ├── foods.json          食物库（101 条）
│   ├── rankings.json       速查表（4 张榜单）
│   └── faq.json            常见疑问
│
├── assets/
│   ├── css/tailwind.css    构建产物，不要手改
│   └── js/
│       ├── app.js          入口：加载 meta、注入导航、注册路由
│       ├── core/           路由、数据加载、工具函数
│       ├── components/     7 种内容展示组件
│       └── pages/          8 个页面模块
│
├── src/input.css           Tailwind 源文件（改样式改这里）
├── tools/                  校验与启动脚本
└── docs/                   需求文档、技术文档
```

---

## 改内容

### 加一条食物

打开 `data/foods.json`，在 `items` 数组末尾追加：

```json
{
  "id": "banana-raw",
  "name": "香蕉（生）",
  "aliases": ["banana"],
  "category": "fruit",
  "subCategory": "浆果类",
  "nutrition": { "energy_kcal": 93, "protein_g": 1.4, "fat_g": 0.2, "carb_g": 22.0, "fiber_g": 1.2 },
  "gi": 52,
  "carbType": "slow",
  "proteinType": null,
  "tags": ["low-gi"],
  "note": "熟度越高 GI 越高",
  "source": "中国食物成分表（第6版）"
}
```

注意两点：

- `category` 必须是文件里 `categories` 数组已有的 id
- `tags` 里的值必须在 `tags` 数组里存在

保存后刷新页面即可，**不需要重启，也不需要改任何代码**。

### 加一个章节

在任意内容 JSON 的 `sections` 数组里插入一个对象，`type` 决定它长什么样：

| type | 效果 |
|---|---|
| `table` | 普通表格 |
| `compare` | 左右两栏对照（可带差异表） |
| `cards` | 卡片网格 |
| `gi-table` | 带颜色分级的 GI 表 |
| `stacked-bar` | 脂肪酸构成堆叠条 |
| `list` | 要点清单（建议 / 避免 / 中性） |
| `ranking` | 排行榜 |

页内目录会自动包含新章节，不用手动维护。

### 改文案

所有正文都在 `data/` 里，没有任何科普文案硬编码在代码中。搜一下关键词直接改就行。

---

## 改样式

样式用 Tailwind CSS v4，源文件是 `src/input.css`。

```bash
npm install          # 首次
npm run build        # 重新生成 assets/css/tailwind.css
npm run watch        # 开发时持续监听
```

> 如果不想装依赖，也可以临时把 `index.html` 里的 `<link>` 换成 Tailwind 浏览器版（文件里有注释说明），但那个版本需要联网且性能较差，只适合临时调试。

---

## 校验与测试

```bash
npm run validate     # 检查 8 个 JSON：解析、引用完整性、必填字段、数值范围、能量一致性
npm run check        # 同时跑 validate 和前端模块导入检查
node tools/smoke.mjs # 在 Node 中模拟渲染全部 8 个页面，检查输出是否健康
```

`validate.js` 会检查食物数据的能量自洽性：按 `4×蛋白 + 9×脂肪 + 4×碳水` 估算的热量，与标注值偏差超过 20% 会报错——这一项能抓出绝大多数录入错误。

---

## 部署

纯静态，不需要任何服务端配置。把整个目录（**必须含 `data/` 和 `assets/`**）上传到任意静态托管即可。

### 部署到 GitHub Pages

**第一步：仓库结构**

把 `nutrition-site/` **里面的内容**直接作为仓库根目录，也就是仓库长这样：

```
你的仓库/
├── index.html
├── .nojekyll        ← 必须有，见下方说明
├── assets/
├── data/
└── ...
```

> 不要把 `nutrition-site/` 这个文件夹整个塞进仓库的子目录，否则 Pages 从仓库根提供服务，首页会打不开。

**第二步：开启 Pages**

仓库 → Settings → Pages → Source 选 `Deploy from a branch` → 分支选 `main` → 目录选 `/ (root)` → Save。

等 1–2 分钟，访问 `https://你的用户名.github.io/仓库名/`。

**第三步（关键）：确认 `.nojekyll` 已上传**

GitHub Pages 在「Deploy from a branch」模式下会先跑一遍 Jekyll 构建，而 **Jekyll 有一条硬规则：忽略所有以下划线开头的文件**。

这个问题很隐蔽——本地 `start.bat` 一切正常，上线后却只有部分页面白屏。本项目最初有两个这样的文件，已经重命名修掉了，同时补了 `.nojekyll` 作为双保险：

| 原文件名 | 现文件名 |
|---|---|
| `assets/js/components/_shared.js` | `assets/js/components/parts.js` |
| `assets/js/pages/_content.js` | `assets/js/pages/contentPage.js` |

**部署后如果页面白屏，按这个顺序排查**：

1. 打开 DevTools → Console，看是否有 404 或 `Failed to fetch dynamically imported module`
2. 404 的文件名如果以 `_` 开头 → `.nojekyll` 没上传成功
3. 404 的是 `data/*.json` → `data/` 目录没上传
4. 页面完全没样式 → `assets/css/tailwind.css` 没上传
5. 整个站点 404 → 仓库结构不对，或者 Pages 还没构建完（看 Actions 标签页的进度）

**其他注意**

- GitHub Free 账号的**私有仓库无法启用 Pages**，仓库需要设为公开
- 本站用 hash 路由（`#/carbs`），部署在子路径下也不需要改任何代码，刷新和分享链接都正常
- 部署到 Vercel / Netlify / Cloudflare Pages 的话，这些平台不跑 Jekyll，直接把目录拖上去即可

---

## 数据来源

- 中国食物成分表（第 6 版），北京大学医学出版社
- USDA FoodData Central
- 悉尼大学 GI 数据库
- 中国居民膳食指南（2022）

数值均为每 100 g 可食部的参考值，实际因品种、产地、烹饪方式而异。

---

## 免责声明

本站内容为营养学基础科普，**不构成医疗或临床营养建议**。个体健康问题请咨询医生或注册营养师。
