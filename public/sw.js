const CACHE_NAME = "vgc-team-report-v3";
const SPRITE_CACHE = "vgc-sprites-v1";
const SHARE_CACHE = "vgc-shares-v1";

const PRECACHE_URLS = ["/", "/favicon.svg", "/icon-192.png"];

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VGC Team Report — Offline</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #0B0B1A;
      color: #F0EDE6;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
    }
    .container {
      text-align: center;
      max-width: 400px;
    }
    .icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 1.5rem;
      border-radius: 50%;
      background: rgba(225, 29, 72, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    h1 { font-size: 1.25rem; margin-bottom: 0.75rem; }
    p { color: #7A7AA0; font-size: 0.875rem; line-height: 1.6; margin-bottom: 1.5rem; }
    button {
      background: #E11D48;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.75rem;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
    }
    button:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="1" y1="1" x2="23" y2="23"/>
        <path d="M16.72 11.06A10.94 10.94 0 0119 12.55"/>
        <path d="M5 12.55a10.94 10.94 0 015.17-2.39"/>
        <path d="M10.71 5.05A16 16 0 0122.56 9"/>
        <path d="M1.42 9a15.91 15.91 0 014.7-2.88"/>
        <path d="M8.53 16.11a6 6 0 016.95 0"/>
        <line x1="12" y1="20" x2="12.01" y2="20"/>
      </svg>
    </div>
    <h1>You're offline</h1>
    <p>VGC Team Report needs an internet connection to load teams and shared reports. Previously viewed teams may still be available.</p>
    <button onclick="window.location.reload()">Retry</button>
  </div>
</body>
</html>`;

// Install: precache critical assets + offline page
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(PRECACHE_URLS);
      await cache.put(
        new Request("/_offline"),
        new Response(OFFLINE_HTML, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        })
      );
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches (keep sprite + share caches)
self.addEventListener("activate", (event) => {
  const keepCaches = [CACHE_NAME, SPRITE_CACHE, SHARE_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !keepCaches.includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // ── Pokemon sprites (cross-origin) ──
  // Cache sprites from Showdown CDN so teams render offline
  if (url.hostname === "play.pokemonshowdown.com" && url.pathname.includes("/sprites/")) {
    event.respondWith(
      caches.open(SPRITE_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => new Response("", { status: 404 }));
        })
      )
    );
    return;
  }

  // Skip other cross-origin requests
  if (url.origin !== self.location.origin) return;

  // ── Share API data ──
  // Cache share responses so previously viewed teams load offline
  if (url.pathname.match(/^\/api\/share\/[A-Za-z0-9]{8}$/) && !url.searchParams.has("key")) {
    event.respondWith(
      caches.open(SHARE_CACHE).then((cache) =>
        fetch(request)
          .then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() =>
            cache.match(request).then((cached) => cached || Response.error())
          )
      )
    );
    return;
  }

  // ── Other API routes — network only ──
  if (url.pathname.startsWith("/api/")) return;

  // ── Static assets (JS, CSS, fonts, images) — cache-first ──
  if (
    url.pathname.match(
      /\.(js|css|woff2?|ttf|otf|svg|png|jpg|jpeg|gif|webp|ico)$/
    ) ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // ── Shared team pages (/s/*) — network-first, cache fallback ──
  if (url.pathname.startsWith("/s/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) =>
            cached || caches.match("/_offline")
          )
        )
    );
    return;
  }

  // ── All other pages — network-first, cache fallback ──
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) =>
          cached || caches.match("/_offline")
        )
      )
  );
});
