// Normalizzazione del telefono identica al backend (FRONTEND_HANDOFF.md §6.4).

export const PHONE_MAX_LENGTH = 30;

const SEPARATORS = /[\s\-./()]/g;
const ITALIAN_DIGITS = /^\d{6,11}$/;
const INTERNATIONAL = /^[1-9]\d{7,14}$/;

/**
 * Restituisce il numero in formato E.164 (`+39…`) oppure `null` se non è valido.
 * Esempi: "333 123 4567" → "+393331234567", "06 1234567" → "+39061234567".
 */
export function normalizePhone(input: string): string | null {
  const compact = input.trim().replace(SEPARATORS, "");
  if (!compact || compact.length > PHONE_MAX_LENGTH) return null;

  const value = compact.startsWith("00") ? `+${compact.slice(2)}` : compact;

  if (value.startsWith("+39")) return italian(value.slice(3));
  if (value.startsWith("+")) {
    const digits = value.slice(1);
    return INTERNATIONAL.test(digits) ? `+${digits}` : null;
  }
  return italian(value);
}

function italian(digits: string): string | null {
  return ITALIAN_DIGITS.test(digits) ? `+39${digits}` : null;
}

export function isValidPhone(input: string): boolean {
  return input.length <= PHONE_MAX_LENGTH && normalizePhone(input) !== null;
}
