// ── Cache version ──────────────────────────────────────────────────────────
// INCREMENT THIS STRING on every production deploy that changes app code.
// The browser compares sw.js byte-for-byte; a new cache name triggers a full
// install → activate → old-cache deletion cycle.
const CACHE = "huginn-shield-v2";

// Only pre-cache the shell; JS bundles are fetched on first visit.
const PRECACHE = ["/manifest.json", "/huginn-logo.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      // skipWaiting so the new SW activates immediately without waiting for
      // all tabs using the old SW to close.
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      // Take control of all pages immediately after activation.
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Never intercept: non-GET, API calls, cross-origin requests.
  if (
    e.request.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // ── Next.js immutable static assets (/_next/static/) ──────────────────
  // These have content-addressed filenames (hashes). Cache-first is safe and
  // optimal — a new deploy produces new URLs, old ones are never reused.
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((response) => {
          if (response.ok && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // ── HTML navigation requests (/, /shield, /dashboard, etc.) ───────────
  // Network-first: always try to get the latest HTML from Vercel.
  // Falls back to cache only when offline.
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          if (response.ok && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(e.request).then(
            (cached) => cached ?? new Response("Offline", { status: 503 })
          )
        )
    );
    return;
  }

  // ── Everything else (images, fonts, icons) ────────────────────────────
  // Cache-first with network fallback.
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request)
        .then((response) => {
          if (response.ok && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return response;
        })
        .catch(() => new Response("Offline", { status: 503 }));
    })
  );
});
