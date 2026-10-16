// Accesso a localStorage/sessionStorage che non lancia mai: in navigazione privata o con storage
// bloccato si ripiega su una mappa in memoria, così l'app continua a funzionare nella sessione.

type StorageKind = "local" | "session";

const memory: Record<StorageKind, Map<string, string>> = { local: new Map(), session: new Map() };

function getStorage(kind: StorageKind): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readItem(kind: StorageKind, key: string): string | null {
  try {
    const storage = getStorage(kind);
    if (storage) return storage.getItem(key);
  } catch {
    // ignorato: si usa la memoria
  }
  return memory[kind].get(key) ?? null;
}

/** Restituisce `true` se il valore è stato salvato in modo persistente. */
export function writeItem(kind: StorageKind, key: string, value: string): boolean {
  memory[kind].set(key, value);
  try {
    const storage = getStorage(kind);
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeItem(kind: StorageKind, key: string): void {
  memory[kind].delete(key);
  try {
    getStorage(kind)?.removeItem(key);
  } catch {
    // ignorato
  }
}

export function readJson<T>(kind: StorageKind, key: string): T | null {
  const raw = readItem(kind, key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Solo per i test. */
export function __resetMemoryStorage() {
  memory.local.clear();
  memory.session.clear();
}
