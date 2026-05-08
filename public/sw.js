// Bump version to push updates to all installed PWA users
const CACHE_NAME = "vgc-team-report-v23";
const SHARE_CACHE = "vgc-shares-v5";
const API_CACHE = "vgc-api-v6";

const PRECACHE_URLS = [
  "/",
  "/explore",
  "/champions",
  "/compare",
  "/changelog",
  "/feedback",
  "/dashboard",
  "/dashboard/profile",
  "/privacy",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/manifest.json",
];

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#0B0B1A">
  <title>VGC Team Report — Offline</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #0B0B1A;
      color: #F0EDE6;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100dvh;
      min-height: 100vh; /* fallback */
      padding: 2rem;
      padding-top: max(2rem, env(safe-area-inset-top, 0px));
      padding-bottom: max(2rem, env(safe-area-inset-bottom, 0px));
      padding-left: max(1.5rem, env(safe-area-inset-left, 0px));
      padding-right: max(1.5rem, env(safe-area-inset-right, 0px));
      overscroll-behavior: none;
      -webkit-user-select: none;
      user-select: none;
    }
    .container {
      text-align: center;
      max-width: 360px;
      animation: fade-in 0.5s ease both;
    }
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.15; }
      50% { opacity: 0.25; }
    }
    .icon-ring {
      width: 80px; height: 80px;
      margin: 0 auto 1.5rem;
      border-radius: 50%;
      background: rgba(225, 29, 72, 0.1);
      border: 2px solid rgba(225, 29, 72, 0.2);
      display: flex; align-items: center; justify-content: center;
      position: relative;
    }
    .icon-ring::after {
      content: '';
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      border: 1.5px solid rgba(225, 29, 72, 0.1);
      animation: pulse 3s ease-in-out infinite;
    }
    .brand {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #7A7AA0;
      margin-bottom: 1.25rem;
    }
    .brand span { color: #E11D48; }
    h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.75rem; letter-spacing: -0.02em; }
    p { color: #7A7AA0; font-size: 0.875rem; line-height: 1.7; margin-bottom: 1.75rem; }
    button {
      background: #E11D48; color: white; border: none;
      padding: 0.875rem 2.5rem; border-radius: 1rem;
      font-weight: 700; font-size: 0.875rem; cursor: pointer;
      transition: transform 0.15s, opacity 0.15s;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    button:hover { opacity: 0.9; }
    button:active { transform: scale(0.96); opacity: 0.85; }
    .hint {
      color: #52526E;
      font-size: 0.7rem;
      margin-top: 1.5rem;
      line-height: 1.5;
    }
    .cached-link {
      display: inline-block;
      margin-top: 1rem;
      color: #E11D48;
      font-size: 0.8rem;
      font-weight: 600;
      text-decoration: none;
      opacity: 0.8;
    }
    .cached-link:active { opacity: 1; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon-ring">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E11D48" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <line x1="1" y1="1" x2="23" y2="23"/>
        <path d="M16.72 11.06A10.94 10.94 0 0119 12.55"/>
        <path d="M5 12.55a10.94 10.94 0 015.17-2.39"/>
        <path d="M10.71 5.05A16 16 0 0122.56 9"/>
        <path d="M1.42 9a15.91 15.91 0 014.7-2.88"/>
        <path d="M8.53 16.11a6 6 0 016.95 0"/>
        <line x1="12" y1="20" x2="12.01" y2="20"/>
      </svg>
    </div>
    <div class="brand">VGC Team <span>Report</span></div>
    <h1>You're offline</h1>
    <p>Check your connection and try again. Previously viewed teams may still be available.</p>
    <button onclick="window.location.reload()">Try Again</button>
    <a href="/" class="cached-link">Go to cached home</a>
    <p class="hint">Collaborative edits and version history require a connection.</p>
  </div>
</body>
</html>`;

// Install: precache critical assets + offline page. Every step is best-effort —
// the SW must complete install even if individual caches fail (otherwise the
// browser surfaces a TypeError to the page and PostHog records it as a real bug).
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        // Precache in parallel, skip failures for individual URLs (404s, redirects,
        // network blips during deploy churn).
        await Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)));
        try {
          await cache.put(
            new Request("/_offline"),
            new Response(OFFLINE_HTML, {
              headers: { "Content-Type": "text/html; charset=utf-8" },
            })
          );
        } catch {
          // Offline fallback failed to cache — non-fatal, online navigation
          // still works. Avoids failing install on a single put error.
        }
      } catch {
        // Even caches.open() can fail in storage-pressure / private-mode scenarios.
        // Swallow so install completes — SW becomes a no-op rather than an error.
      }
    })()
  );
  self.skipWaiting();
});

// Activate: purge all old caches
self.addEventListener("activate", (event) => {
  const keepCaches = [CACHE_NAME, SHARE_CACHE, API_CACHE];
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

// Trim a cache to a max number of entries (FIFO)
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    await Promise.all(keys.slice(0, keys.length - maxEntries).map((k) => cache.delete(k)));
  }
}

// Handle skip-waiting message from client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (POST saves, PATCH, DELETE, etc.)
  if (request.method !== "GET") return;

  // Skip all cross-origin requests — let the browser handle them natively
  if (url.origin !== self.location.origin) return;

  // ── Share API data ──
  // Cache-first with background revalidation for offline tournament access
  if (url.pathname.match(/^\/api\/share\/[A-Za-z0-9]{8}$/) && !url.searchParams.has("key") && !url.searchParams.has("since")) {
    event.respondWith(
      caches.open(SHARE_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
              trimCache(SHARE_CACHE, 50);
            }
            return response;
          }).catch(() => cached || Response.error());
          // Serve cached immediately, update in background
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // ── Cacheable API routes — stale-while-revalidate ──
  if (url.pathname.match(/^\/api\/(explore|spotlight|creator\/|user\/reports|user\/saved|user\/collaborations|user\/drafts)/)) {
    event.respondWith(
      caches.open(API_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
              trimCache(API_CACHE, 30);
            }
            return response;
          }).catch(() => cached || Response.error());
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // ── Other API routes (versions, collaborators, auth, etc.) — network only ──
  if (url.pathname.startsWith("/api/")) return;

  // ── Static assets (JS, CSS, fonts, images) — cache-first ──
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|otf|svg|png|jpg|jpeg|gif|webp|ico)$/) ||
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

  // ── Shared team & embed pages (/s/*, /embed/*) — network-first, cache fallback ──
  if (url.pathname.startsWith("/s/") || url.pathname.startsWith("/embed/")) {
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
