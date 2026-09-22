// core/store.js —— JSON 加载器与内存缓存
// 约定：文件名不含 .json 后缀传入，如 load('carbs')；支持子目录路径 load('foods/grain')

const cache = new Map();

export function createStore(basePath = 'data/') {
  async function load(name) {
    if (cache.has(name)) return cache.get(name);

    const url = `${basePath}${name}.json`;
    let res;
    try {
      // no-cache：每次校验，避免改完 JSON 刷新还看到旧内容
      res = await fetch(url, { cache: 'no-cache' });
    } catch (cause) {
      // file:// 协议下必然走到这里（浏览器对 file:// 的 fetch 一律拒绝）
      const err = new Error(`无法读取 ${url}`);
      err.kind = location.protocol === 'file:' ? 'file-protocol' : 'network';
      err.url = url;
      err.cause = cause;
      throw err;
    }

    if (!res.ok) {
      const err = new Error(`加载 ${url} 失败：HTTP ${res.status}`);
      err.kind = res.status === 404 ? 'not-found' : 'http';
      err.url = url;
      err.status = res.status;
      throw err;
    }

    let data;
    try {
      data = await res.json();
    } catch (cause) {
      // 服务器未返回 application/json，或 JSON 语法有误
      const err = new Error(`${url} 不是合法的 JSON`);
      err.kind = 'parse';
      err.url = url;
      err.cause = cause;
      throw err;
    }

    cache.set(name, data);
    return data;
  }

  function loadMany(names) {
    return Promise.all(names.map(load)).then((list) =>
      Object.fromEntries(names.map((n, i) => [n, list[i]]))
    );
  }

  /** 清空缓存（开发调试用，控制台执行 __store.clear()） */
  function clear() {
    cache.clear();
  }

  return { load, loadMany, clear };
}
