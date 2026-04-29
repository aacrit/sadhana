// =============================================================================
// Sādhanā service worker — T3.2 (rev 12)
//
// Cache strategy:
//
//   - Shell (HTML for journey home pages, manifest, icons): cache-first.
//     The shell is small and rarely changes; serving from cache makes
//     the PWA feel instant on every open and survives airplane-mode.
//
//   - Curriculum YAML (~56 files at /curriculum/*.yaml): pre-cached on
//     install. Network-first when online so authored corrections land
//     promptly; falls back to cache when offline. This is what makes
//     practice work on the bus.
//
//   - Static JS/CSS chunks: stale-while-revalidate. Browsers without
//     network see the previous-session bundle; with network, the latest.
//
//   - Supabase XHR: network-only (no caching). Auth + session writes
//     cannot be served from cache.
//
// The cache name carries a version suffix so updates can purge old
// bundles cleanly. Bump CACHE when changing this file's strategy.
// =============================================================================

const CACHE = 'sadhana-v3';

// Pages we want to seed at install time. The static export emits HTML
// at these URLs (with trailing slashes). The lesson dynamic routes
// live under /journeys/<journey>/lessons/<id>/ — too many to list, so
// they're cached on first visit by the runtime fetch handler instead.
const SHELL = [
  '/sadhana/',
  '/sadhana/journeys/beginner/',
  '/sadhana/journeys/explorer/',
  '/sadhana/journeys/scholar/',
  '/sadhana/journeys/master/',
  '/sadhana/journeys/freeform/',
  '/sadhana/profile/',
  '/sadhana/manifest.json',
  '/sadhana/icons/icon-192.svg',
  '/sadhana/icons/icon-512.svg',
];

// Curriculum YAML pre-cache list. Mirror the files in public/curriculum/.
// Listed by lesson ID; both the lesson YAML and the copy overlay are pulled.
// Adding a new lesson here is a one-line edit.
const CURRICULUM_LESSONS = [
  'beginner-01-bhoopali',
  'beginner-02-sa-pa-drone',
  'beginner-03-yaman',
  'beginner-04-bhairav',
  'beginner-05-bhimpalasi',
  'beginner-06-bageshri',
  'beginner-07-consolidation',
  'beginner-08-challenge',
  'sadhaka-01-desh',
  'sadhaka-02-meend',
  'sadhaka-03-andolan',
  'sadhaka-04-kafi',
  'sadhaka-05-teentaal',
  'sadhaka-06-grammar',
  'sadhaka-07-gamak',
  'sadhaka-08-call-response',
  'sadhaka-09-intervals',
  'sadhaka-10-challenge',
  'varistha-01-marwa',
  'varistha-02-raga-comparison',
  'varistha-03-darbari',
  'varistha-04-composition',
  'varistha-05-puriya-dhanashri',
  'varistha-06-ornament-mastery',
  'varistha-07-malkauns',
  'varistha-08-shruti',
  'varistha-09-todi',
  'varistha-10-tala-integration',
  'varistha-11-challenge',
  'guru-01-raga-id-advanced',
  'guru-02-bandish',
  'guru-03-bhairavi',
  'guru-04-modulation',
  'guru-05-taan',
  'guru-06-kedar-hameer',
  'guru-07-sohini-marwa',
  'guru-08-raga-rendering',
  'guru-09-teaching',
  'guru-10-open-mastery',
];

const CURRICULUM_URLS = CURRICULUM_LESSONS.flatMap((id) => [
  `/sadhana/curriculum/${id}.yaml`,
  `/sadhana/curriculum/${id}-copy.yaml`,
]);

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      // Shell pages — must succeed for the install to count
      await cache.addAll(SHELL);
      // Curriculum — best-effort. A missing copy overlay shouldn't fail
      // the install, so we add them one-at-a-time and swallow 404s.
      await Promise.allSettled(
        CURRICULUM_URLS.map((url) =>
          fetch(url, { cache: 'reload' })
            .then((r) => (r.ok ? cache.put(url, r.clone()) : null))
            .catch(() => null),
        ),
      );
    }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Never cache Supabase API traffic — auth + session writes are not
  // cacheable. Let the network-only request go through unchanged.
  if (url.hostname.endsWith('.supabase.co')) return;
  // Same for Supabase auth tokens / OAuth redirects
  if (url.pathname.startsWith('/auth/v1/')) return;

  // Curriculum YAML — cache-first, network fallback. Once cached, the
  // student keeps practising offline indefinitely. We DO update the cache
  // in the background when online so corrections eventually land without
  // requiring a service-worker bump.
  if (url.pathname.includes('/curriculum/') && url.pathname.endsWith('.yaml')) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        const networkFetch = fetch(e.request)
          .then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE).then((cache) => cache.put(e.request, clone));
            }
            return res;
          })
          .catch(() => cached || Response.error());
        return cached || networkFetch;
      }),
    );
    return;
  }

  // Default: network-first with cache fallback. Pages, JS, CSS all
  // benefit from this — fresh when online, the previous version when
  // not. Successful responses backfill the cache so future offline
  // hits work.
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && (e.request.method === 'GET') && url.origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request)),
  );
});
