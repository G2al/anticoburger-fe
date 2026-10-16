// Link di gestione: i dati viaggiano solo nel frammento (#…), che il browser non invia mai ai server.

export const MANAGE_PATH = "/prenotazione";

export function buildManageUrl(origin: string, reference: string, token: string): string {
  const fragment = new URLSearchParams({ ref: reference, token });
  return `${origin}${MANAGE_PATH}#${fragment}`;
}

/** Link interno che porta solo il riferimento: il token viene letto dall'archivio locale. */
export function buildLocalManageHref(reference: string): string {
  return `${MANAGE_PATH}#${new URLSearchParams({ ref: reference })}`;
}

export function parseManageHash(hash: string): { reference: string | null; token: string | null } {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return {
    reference: params.get("ref")?.trim() || null,
    token: params.get("token")?.trim() || null,
  };
}

/** Riferimento breve leggibile da comunicare al ristorante (non basta per annullare). */
export function shortReference(reference: string): string {
  return reference.replace(/-/g, "").slice(0, 8).toUpperCase();
}
