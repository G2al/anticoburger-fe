// File di avvio per hosting Node.js con Phusion Passenger (Plesk): "Application Startup File" = server.js.
// Avvia Next.js in produzione: va eseguito dopo `npm run build`.
// CommonJS e nessuna compilazione: questo file non passa dal bundler di Next.
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS voluto per Passenger */

const { createServer } = require("node:http");
const next = require("next");

const port = Number.parseInt(process.env.PORT || "3000", 10);
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, () => {
      console.log(`> Antico Burger – Prenotazioni in ascolto sulla porta ${port}`);
    });
  })
  .catch((error) => {
    console.error("Avvio non riuscito. È stato eseguito `npm run build`?", error);
    process.exit(1);
  });
