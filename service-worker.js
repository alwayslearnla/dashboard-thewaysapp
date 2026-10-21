// THE WAYS — service worker v5.3
// Sempre busca a versão mais nova na internet; o cache só é usado sem conexão.
// Ao ativar, apaga os caches de versões antigas para ninguém ficar preso nelas.
const CACHE = 'theways-v5.3';
const ARQUIVOS = ['./', './index.html', './manifest.json', './icon-192.png'];
// Bibliotecas de gráficos e planilhas (versão fixa): guardadas para o app abrir sem internet
const BIBLIOTECAS = [
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all([
    c.addAll(ARQUIVOS).catch(() => {}),
    ...BIBLIOTECAS.map((u) => fetch(new Request(u, { mode: 'no-cors' })).then((r) => c.put(u, r)).catch(() => {})),
  ])));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // Bibliotecas não mudam: usa a cópia guardada e só busca na internet se não tiver
  if (BIBLIOTECAS.includes(e.request.url)) {
    e.respondWith(caches.match(e.request.url).then((r) => r || fetch(e.request).then((resp) => {
      const copia = resp.clone(); caches.open(CACHE).then((c) => c.put(e.request.url, copia)); return resp;
    })));
    return;
  }
  e.respondWith(
    fetch(e.request, { cache: 'no-store' })
      .then((resp) => {
        if (resp && resp.ok && new URL(e.request.url).origin === self.location.origin) {
          const copia = resp.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copia));
        }
        return resp;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
