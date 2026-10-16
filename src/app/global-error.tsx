"use client";

// Sostituisce il layout radice quando questo fallisce: stili inline, nessuna dipendenza.
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="it">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAF6F0",
          color: "#1F1714",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <title>Errore · Antico Burger</title>
        <main style={{ maxWidth: 320 }}>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Qualcosa non ha funzionato</h1>
          <p style={{ color: "#6B5F57", marginBottom: 24 }}>Si è verificato un errore imprevisto. Riprova tra poco.</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              minHeight: 48,
              padding: "0 24px",
              borderRadius: 999,
              border: 0,
              background: "#311713",
              color: "#FBF7F1",
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Riprova
          </button>
        </main>
      </body>
    </html>
  );
}
