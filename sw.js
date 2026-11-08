// オフラインでも使えるようにするための仕組み（サービスワーカー）
// 中身を更新したら、下の VERSION の数字を変えてください
const VERSION = 'v5';
const CACHE = 'kantan-shorui-' + VERSION;
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'lib/html2canvas.min.js', 'lib/jspdf.umd.min.js', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // 文字のデザイン（Googleフォント）は、一度読み込んだら保存しておく
  if(url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')){
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(e.request);
      if(hit) return hit;
      try{ const res = await fetch(e.request); c.put(e.request, res.clone()); return res; }catch(err){ return new Response('', {status: 504}); }
    }));
    return;
  }
  if(url.origin !== location.origin) return;
  // ページ本体：ネットがあれば最新を、なければ保存しておいたものを使う
  e.respondWith(fetch(e.request).then(res => {
    const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res;
  }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
