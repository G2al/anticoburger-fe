/* Service worker di Antico Burger – Prenotazioni.
 *
 * - /_next/static, icone, immagini e font: cache-first (nomi con hash, quindi immutabili).
 * - Navigazioni: network-first con fallback alla copia in cache o a /offline.
 * - Mai in cache: API (/api/v1, anche su altro dominio), richieste non GET, /prenotazione.
 *   Unica eccezione: GET /api/v1/menu, contenuto di consultazione (network-first, copia per l'offline).
 *   Disponibilità, calendario e prenotazioni restano sempre e solo in rete.
 * - Foto del menu (storage del backend, dirette o via /_next/image): stale-while-revalidate.
 * La versione arriva dall'URL di registrazione (/sw.js?v=<build>): cambia a ogni build.
 */

const VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
const STATIC_CACHE = `ab-static-${VERSION}`;
const PAGES_CACHE = `ab-pages-${VERSION}`;
const MENU_DATA_CACHE = `ab-menu-data-${VERSION}`;
const MENU_IMAGES_CACHE = `ab-menu-images-${VERSION}`;
const KEEP_CACHES = [STATIC_CACHE, PAGES_CACHE, MENU_DATA_CACHE, MENU_IMAGES_CACHE];

const OFFLINE_URL = "/offline";
// Shell senza dati personali: le pagine leggono storage e API solo nel browser.
const CACHEABLE_PAGES = ["/", "/menu", "/prenota", "/prenotazioni", OFFLINE_URL];
const PRECACHE_ASSETS = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/brand/wordmark-dark.png",
];
const NEVER_CACHE_PAGES = ["/prenotazione"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(PAGES_CACHE).then((cache) => cache.addAll(CACHEABLE_PAGES)),
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_ASSETS)),
    ]),
  );
  // Nessun skipWaiting automatico: l'utente sceglie "Aggiorna".
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("ab-") && !KEEP_CACHES.includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

/** Solo il menu: nessun altro endpoint API entra mai in cache. */
function isMenuApi(url) {
  return url.pathname.endsWith("/api/v1/menu");
}

/** Foto caricate da Filament: dirette dallo storage del backend oppure ottimizzate da /_next/image. */
function isMenuImage(url) {
  if (url.pathname.startsWith("/storage/")) return url.origin !== self.location.origin;
  if (url.origin === self.location.origin && url.pathname.startsWith("/_next/image")) {
    try {
      return new URL(url.searchParams.get("url") || "").pathname.startsWith("/storage/");
    } catch {
      return false;
    }
  }
  return false;
}

async function networkFirstMenu(request) {
  const cache = await caches.open(MENU_DATA_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(MENU_IMAGES_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      // Le immagini cross-origin senza CORS sono "opaque": si possono comunque conservare.
      if (response.ok || response.type === "opaque") cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached || Response.error());
  return cached || network;
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/brand/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/menu/") ||
    /\.(?:png|webp|jpe?g|svg|ico|woff2?)$/.test(url.pathname)
  );
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") cache.put(request, response.clone());
  return response;
}

async function networkFirstPage(request, url) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok && CACHEABLE_PAGES.includes(url.pathname)) cache.put(url.pathname, response.clone());
    return response;
  } catch {
    const cached = CACHEABLE_PAGES.includes(url.pathname) ? await cache.match(url.pathname) : undefined;
    return cached || (await cache.match(OFFLINE_URL)) || Response.error();
  }
}

async function networkOnlyPage(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(PAGES_CACHE);
    return (await cache.match(OFFLINE_URL)) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (isMenuApi(url)) {
    event.respondWith(networkFirstMenu(request));
    return;
  }
  if (isMenuImage(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Tutte le altre API e qualsiasi altra origine passano sempre dalla rete, senza cache.
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      NEVER_CACHE_PAGES.includes(url.pathname) ? networkOnlyPage(request) : networkFirstPage(request, url),
    );
    return;
  }

  // Payload RSC e altre richieste dinamiche: rete diretta.
  if (request.headers.get("RSC") || url.searchParams.has("_rsc")) return;

  if (isStaticAsset(url)) event.respondWith(cacheFirst(request));
});
