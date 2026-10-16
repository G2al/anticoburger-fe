# Antico Burger – Prenotazioni (PWA)

PWA con cui i clienti di Antico Burger prenotano un tavolo e annullano una prenotazione.
Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui (Luma, Base UI) · Motion · TanStack Query.

Il backend è `anticoburger-be` (Laravel 12). Il contratto API è in [`docs/FRONTEND_HANDOFF.md`](docs/FRONTEND_HANDOFF.md):
il frontend usa solo gli endpoint lì documentati.

## Avvio

Requisiti: Node 24, npm.

```powershell
npm install
Copy-Item .env.example .env.local   # poi imposta NEXT_PUBLIC_API_BASE_URL
npm run dev                          # http://localhost:3000
```

Il backend deve essere avviato (`php artisan serve` in `anticoburger-be`) e deve consentire l'origin del
frontend in `CORS_ALLOWED_ORIGINS` (default: `http://localhost:3000,http://127.0.0.1:3000`).
Per provare da smartphone in LAN aggiungi l'origin (es. `http://192.168.1.50:3000`) e avvia il backend con
`php artisan serve --host=0.0.0.0`.

### Variabili d'ambiente

| Variabile | Obbligatoria | Descrizione |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | sì | URL base delle API, senza slash finale. Sviluppo `http://127.0.0.1:8000/api/v1`, produzione `https://admin.anticoburger.it/api/v1`. Se manca, `next dev`/`next build` si fermano con un messaggio chiaro. |
| `APP_VERSION` | no | Versione della build (default: timestamp). Cambia l'URL del service worker e ne forza l'aggiornamento. |
| `NEXT_PUBLIC_ENABLE_SW` | no | `true` per registrare il service worker anche in sviluppo. |

`NEXT_PUBLIC_*` viene incorporata **in fase di build**: cambiarla richiede una nuova build.

## Script

| Comando | Cosa fa |
|---|---|
| `npm run dev` | server di sviluppo |
| `npm run build` / `npm run start` | build e server di produzione |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run test` | unit e component test (Vitest + Testing Library + MSW) |
| `npm run test:e2e` | e2e Playwright con API simulate (build di produzione sulla porta 3100) |
| `npm run test:e2e:backend` | e2e contro il backend Laravel reale sul DB di test (vedi sotto) |
| `npm run icons` | rigenera wordmark e icone PWA dai loghi in `public/images` |

### Test e2e contro il backend reale

```powershell
# nella cartella anticoburger-be
$env:DB_DATABASE='anticoburger_test'
$env:CORS_ALLOWED_ORIGINS='http://localhost:3000,http://127.0.0.1:3000,http://localhost:3100'
php artisan serve --port=8010
# nella cartella anticoburger-fe
npx playwright install chromium
npm run test:e2e:backend
```

Serve almeno un tavolo prenotabile configurato da `/admin` nel DB di test; altrimenti il test viene saltato
indicandone il motivo. Ogni esecuzione crea e poi annulla una prenotazione con un telefono casuale.
Gli e2e usano la porta 3100 per non interferire con `npm run dev`: per questo l'origin `http://localhost:3100`
va consentito nel backend di test (solo come variabile d'ambiente del processo, nessuna modifica ai file).

## Struttura

```
src/
  app/                 rotte (/, /prenota, /prenotazione, /prenotazioni, /offline), manifest, icone, errori
  components/
    booking/           flusso a step: persone, calendario, orari, dati, conferma
    reservation/       gestione, annullamento, "Le mie prenotazioni"
    layout/            AppShell, Header, BottomActionBar, OfflineBanner, Wordmark
    pwa/               registrazione del service worker, invito all'installazione
    common/            stati di errore/offline, avvisi, contatti
    ui/                componenti shadcn (CLI), personalizzati via token
  hooks/               query/mutazioni TanStack, stato online, storage, idratazione
  lib/
    api/               client HTTP unico, tipi del contratto, endpoint, mappa errori
    date.ts            utilità Europe/Rome solo con Intl
    phone.ts           normalizzazione del telefono identica al backend
    validation.ts      schemi Zod dei form
    reservation-storage.ts  archivio locale (localStorage, chiave ab:reservations:v1)
  config/restaurant.ts dati statici del ristorante (SEGNAPOSTO da sostituire)
public/sw.js           service worker
scripts/generate-icons.mjs
tests/                 unit/component test e mock MSW
e2e/                   test Playwright
```

Scelte principali:
- Pagine e layout sono Server Components prerenderizzati staticamente. Il flusso e la gestione sono Client
  Components montati dopo l'idratazione, perché leggono storage, frammento dell'URL e ora corrente (con
  Cache Components queste letture non sono ammesse nel prerender). Disponibilità e prenotazioni si leggono
  solo nel browser e non vengono mai cachate lato server.
- Un solo client HTTP (`lib/api/client.ts`): `credentials: "omit"`, timeout (10 s letture, 15 s POST), ogni
  errore diventa un `ApiError` tipizzato, anche per corpi non JSON, rete, CORS e timeout. Non registra mai
  header né token.
- I messaggi dipendono da `error.code`, mai dal testo del backend (`lib/api/errors.ts`).
- La POST non viene mai ripetuta: niente retry e mutazioni con `networkMode: "always"`, così offline
  falliscono subito invece di finire in coda.
- Il token di annullamento vive solo nel frammento `#ref=…&token=…`, in `localStorage` e nell'header
  `X-Reservation-Token`. Dopo la lettura del link, se il salvataggio locale riesce, il token viene tolto
  dalla barra degli indirizzi.

## Brand

- Colore primario: `#311713`, il bordeaux esatto del logo ufficiale. Palette crema/bianco/grigi caldi e
  ottone come accento decorativo. Tutti i token sono in `oklch` in `src/app/globals.css`, con i contrasti
  WCAG annotati.
- Solo tema chiaro (`color-scheme: light`).
- Il font è Geist (`next/font`).
- I loghi non vengono ridisegnati. `npm run icons` ritaglia solo il margine vuoto e usa la luminanza del
  logo come canale alfa, generando:
  - `public/brand/wordmark-*.png`;
  - le icone 192/512 `any` e `maskable` in `public/icons`;
  - `src/app/apple-icon.png` (180×180) e `src/app/icon.png`.

## PWA

- Manifest: `src/app/manifest.ts`.
- Service worker manuale in `public/sw.js`, registrato solo in produzione:
  - `/_next/static`, icone, immagini e font: cache-first, versionata per build;
  - navigazioni: network-first con fallback alla copia in cache o a `/offline`;
  - **mai in cache**: le API (che sono su un altro dominio), le richieste non GET e `/prenotazione`.
- Aggiornamento: quando c'è un nuovo service worker compare il toast "Nuova versione disponibile – Aggiorna";
  le cache vecchie vengono eliminate in `activate`.
- Installazione:
  - Android/Chrome: invito discreto basato su `beforeinstallprompt`, mostrato una sola volta;
  - iOS: istruzioni "Condividi → Aggiungi alla schermata Home", solo in Safari e non in modalità standalone.

Limiti noti:
- **iOS**: non esiste `beforeinstallprompt`. Safari può cancellare `localStorage` e cache dopo un periodo
  di inutilizzo (circa 7 giorni per i siti non installati), e i dati di Safari e della PWA installata sono
  separati. Per questo la conferma insiste sul link di gestione.
- **Android/Chrome**: l'invito di installazione compare solo se Chrome lo propone (criteri di engagement)
  e su HTTPS.

## Deploy su `https://app.anticoburger.it`

1. Sostituire i segnaposto in `src/config/restaurant.ts` e impostare `isPlaceholder: false`.
2. Impostare `NEXT_PUBLIC_API_BASE_URL=https://admin.anticoburger.it/api/v1` (e, se si vuole,
   `APP_VERSION` con il commit) **prima** di `npm run build`.
3. `npm ci && npm run build && npm run start` (Node 24), oppure qualsiasi piattaforma che supporti Next.js 16.
   Servire in HTTPS: è obbligatorio per service worker e installazione.
4. Nel backend: `CORS_ALLOWED_ORIGINS=https://app.anticoburger.it`.
5. `/sw.js` deve essere servito senza cache (già impostato in `next.config.ts` con `headers()`; se c'è una
   CDN davanti, deve rispettare `Cache-Control: no-cache`).

### Plesk (Node.js / Passenger)

| Impostazione | Valore |
|---|---|
| Application Root | cartella del progetto (es. `/httpdocs`) |
| Application Startup File | `server.js` |
| Application Mode | `production` |
| Node.js Version | ≥ 20.9 (consigliata 24) |
| Custom environment variables | `NEXT_PUBLIC_API_BASE_URL=https://admin.anticoburger.it/api/v1` |

Procedura (a ogni aggiornamento del codice):
1. **NPM install**.
2. **Run script** → `build`. La variabile `NEXT_PUBLIC_API_BASE_URL` deve essere già impostata, perché viene
   incorporata nel bundle durante la build.
3. **Restart App**.

`server.js` avvia Next.js in produzione sulla porta indicata da Passenger. Le dipendenze necessarie alla
build (Tailwind, TypeScript) sono in `dependencies`, così la build funziona anche quando Plesk installa
senza devDependencies.
