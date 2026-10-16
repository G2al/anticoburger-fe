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

// Animazioni istantanee nei test: AnimatePresence non attende le uscite.
MotionGlobalConfig.skipAnimations = true;

// API del browser assenti in jsdom.
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};
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
