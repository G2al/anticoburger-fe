import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from "next/constants";

// Versione della build: cambia l'URL del service worker e quindi ne forza l'aggiornamento.
const appVersion = process.env.APP_VERSION ?? Date.now().toString(36);

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  images: {
    // Foto del menu caricate da Filament (storage pubblico del backend).
    remotePatterns: [
      new URL("https://admin.anticoburger.it/storage/**"),
      new URL("http://127.0.0.1:8000/storage/**"),
      new URL("http://localhost:8000/storage/**"),
    ],
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/prenotazione",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default function config(phase: string): NextConfig {
  // Validazione in dev e build: l'URL delle API viene incorporato nel bundle in fase di build.
  // In produzione (next start / server.js) non serve più, quindi non blocca l'avvio.
  const needsApiUrl = phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_BUILD;
  if (needsApiUrl && !process.env.NEXT_PUBLIC_API_BASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL non è configurata. Copia .env.example in .env.local e imposta l'URL delle API " +
        "(es. http://127.0.0.1:8000/api/v1, senza slash finale).",
    );
  }
  return nextConfig;
}
