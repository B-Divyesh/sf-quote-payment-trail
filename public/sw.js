const CACHE = 'deal-thread-shell-v5'
const SHELL = ['/', '/index.html', '/offline.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/assets/deal-thread-hero-640.webp', '/assets/deal-thread-hero-960.webp', '__BUILD_ASSETS__']
self.addEventListener('install', (event) => event.waitUntil((async () => {
  const cache = await caches.open(CACHE)
  await Promise.all(SHELL.map(async (path) => {
    const response = await fetch(new Request(path, { cache: 'reload' }))
    if (!response.ok) throw new Error(`Could not cache ${path}`)
    await cache.put(path, response)
  }))
  await self.skipWaiting()
})()))
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())))
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== location.origin) return
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); return response }).catch(() => caches.match(event.request, { ignoreVary: true }).then((cached) => cached || caches.match('/', { ignoreVary: true }) || caches.match('/offline.html', { ignoreVary: true }))))
    return
  }
  event.respondWith(caches.match(event.request, { ignoreVary: true }).then((cached) => cached || fetch(event.request).then((response) => { if (response.ok) { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)) } return response })))
})
