// Harvestan Service Worker v1.0
// Cache shell + halaman utama untuk offline mode

const CACHE_NAME = "harvestan-v1";
const URLS_TO_CACHE = [
  "/",
  "/dashboard",
  "/penggarap",
  "/gabah",
  "/keuangan",
  "/grafik",
  "/manifest.json",
];

// Install: cache shell
self.addEventListener("install", (event) => {
  console.log("[SW] Installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(URLS_TO_CACHE).catch((err) => {
          console.warn("[SW] Failed to cache some URLs:", err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: hapus cache lama
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...");
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: network-first untuk data, cache-first untuk static
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET
  if (request.method !== "GET") return;

  // Skip API routes (biar selalu fresh)
  if (request.url.includes("/api/")) return;

  // Skip Supabase requests
  if (request.url.includes("supabase")) return;

  // Static assets (CSS, JS, images, fonts): cache-first
  if (
    request.url.match(/\.(css|js|png|jpg|jpeg|svg|webp|woff|woff2|ttf|otf)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request)
          .then((response) => {
            if (response.ok && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => {
            // Kalau offline dan tidak ada cache
            return new Response("", { status: 503 });
          });
      })
    );
    return;
  }

  // HTML pages: network-first (biar selalu update), fallback ke cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;

          // Fallback ke halaman offline
          return caches.match("/").then((rootCached) => {
            if (rootCached) return rootCached;
            return new Response(
              `<html><body style="font-family:sans-serif;text-align:center;padding:50px;background:#eaf7e6;">
                <h1>🌾 Harvestan</h1>
                <p>Anda sedang offline.</p>
                <p>Coba nyalakan internet dan refresh halaman.</p>
              </body></html>`,
              { headers: { "Content-Type": "text/html" } }
            );
          });
        });
      })
  );
});

// Message handler (optional)
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
