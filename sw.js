// GlicoCare Service Worker
// Estrategia: network-first pra navegacao/HTML (sempre pega a versao nova quando
// online; usa cache so como fallback offline) e cache-first pros assets estaticos.
// Isso mantem o app INSTALAVEL (PWA/PWABuilder feliz) SEM prender numa versao velha.
// 22/07/2026 00:35 - v8: as bibliotecas do grafico e do PDF sairam do CDN e agora sao
// arquivos daqui de dentro, entao entram na lista de coisas guardadas pra usar offline.
// 22/07/2026 01:25 - v9: dose de insulina virou numero inteiro (index.html).
const CACHE = 'glicocare-v9';
const ASSETS = ['/', '/index.html', '/img/bg.jpg', '/manifest.json', '/img/icon.png',
  '/vendor/chart.min.js', '/vendor/jspdf.umd.min.js', '/vendor/jspdf.plugin.autotable.min.js'];

self.addEventListener('install', e => {
  self.skipWaiting();   // ativa a versao nova na hora
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
});

self.addEventListener('activate', e => {
  // limpa caches antigos (glicocare-v1 etc) pra nao acumular lixo
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // navegacao/HTML -> network-first (sempre tenta a versao fresca; cai pro cache offline)
  const isHTML = req.mode === 'navigate' ||
                 (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('/index.html')))
    );
    return;
  }

  // assets estaticos -> cache-first (rapido), busca na rede se nao tiver
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }))
  );
});
