import type { NextConfig } from "next";

// Validazione all'avvio (dev/build): senza URL delle API l'app non può funzionare.
if (!process.env.NEXT_PUBLIC_API_BASE_URL && !process.env.VITEST) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL non è configurata. Copia .env.example in .env.local e imposta l'URL delle API " +
      "(es. http://127.0.0.1:8000/api/v1, senza slash finale).",
  );
}

// Versione della build: cambia l'URL del service worker e quindi ne forza l'aggiornamento.
const appVersion = process.env.APP_VERSION ?? Date.now().toString(36);

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
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

export default nextConfig;
