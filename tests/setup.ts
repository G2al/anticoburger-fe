import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { MotionGlobalConfig } from "motion/react";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";
import { __resetMemoryStorage } from "@/lib/safe-storage";
import { NOW } from "./msw/fixtures";
import { db } from "./msw/handlers";
import { server } from "./msw/server";

// Router dell'App Router assente nei test di componente.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
}));

// next/font è trasformato dal compilatore di Next, assente in Vitest: ogni font diventa una classe fittizia.
vi.mock("next/font/google", () => {
  const font = () => ({ className: "font-test", variable: "font-test-variable", style: { fontFamily: "test" } });
  return { Geist: font, Playfair_Display: font, Great_Vibes: font };
});

// Animazioni istantanee nei test: AnimatePresence non attende le uscite.
MotionGlobalConfig.skipAnimations = true;

// API del browser assenti in jsdom.
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};
// Usati da sonner al tocco del toast.
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.hasPointerCapture ??= () => false;
// Usato da Motion (whileInView) e dalla barra delle categorie del menu.
globalThis.IntersectionObserver ??= class {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
} as unknown as typeof IntersectionObserver;
window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList;

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));

beforeEach(() => {
  // Solo Date è finto: timer reali per React, MSW e user-event.
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  server.events.removeAllListeners();
  db.reset();
  localStorage.clear();
  sessionStorage.clear();
  __resetMemoryStorage();
  window.location.hash = "";
  vi.useRealTimers();
});

afterAll(() => server.close());
