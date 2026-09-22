#!/usr/bin/env node
/**
 * tools/serve.js —— 零依赖静态服务器
 * 用途：浏览器禁止 file:// 协议读取本地 JSON（origin 为 null），
 *       因此必须通过 http://localhost 访问本项目。
 *
 * 用法：node tools/serve.js [端口]        默认 8080
 *       node tools/serve.js 8080 --no-open  不自动打开浏览器
 *
 * 关键点：必须为 .json 返回 application/json，
 *        否则 fetch(...).json() 会因 Content-Type 校验而抛错。
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const PORT = Number(args.find((a) => /^\d+$/.test(a))) || 8080;
const NO_OPEN = args.includes('--no-open');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request');
    return;
  }

  if (pathname === '/' || pathname === '') pathname = '/index.html';

  const filePath = path.normalize(path.join(ROOT, pathname));

  // 防目录穿越
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`404 Not Found: ${pathname}`);
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n端口 ${PORT} 已被占用。`);
    console.error(`换一个端口试试：node tools/serve.js ${PORT + 1}\n`);
  } else {
    console.error(err);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}/`;
  console.log('');
  console.log('  营养学知识库 · 本地预览');
  console.log(`  地址：${url}`);
  console.log('  停止：按 Ctrl+C');
  console.log('');

  if (!NO_OPEN && process.platform === 'win32') {
    exec(`start "" "${url}"`, () => {});
  }
});
