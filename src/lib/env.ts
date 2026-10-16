const MISSING_API_URL_MESSAGE =
  "NEXT_PUBLIC_API_BASE_URL non è configurata. Copia .env.example in .env.local e imposta l'URL delle API " +
  "(es. http://127.0.0.1:8000/api/v1, senza slash finale).";

/** URL base delle API Laravel, senza slash finale. */
export function getApiBaseUrl(): string {
  // Accesso letterale: Next sostituisce il valore in fase di build.
  const value = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!value) throw new Error(MISSING_API_URL_MESSAGE);
  return value.replace(/\/+$/, "");
}

export { MISSING_API_URL_MESSAGE };
