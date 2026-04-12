const CACHE = 'sadhana-v1'
const SHELL = ['/sadhana/', '/sadhana/journeys/beginner/']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ))
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  // Network-first for API calls, cache-first for shell
  if (e.request.url.includes('supabase.co')) return
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})
