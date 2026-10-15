import { createInitialFixtures, cloneFixtures, type DemoFixtureStore } from "@/lib/demo-data/fixtures";

const STORAGE_KEY = "planova_demo_fixtures_v1";

let memoryStore: DemoFixtureStore | null = null;

export function getFixtureStore(): DemoFixtureStore {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // localStorage may fail in private mode or quota exceeded
    }
  }

  if (!memoryStore) {
    memoryStore = createInitialFixtures();
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
      } catch {
        // ignore
      }
    }
  }
  return memoryStore;
}

export function saveFixtureStore(store: DemoFixtureStore): void {
  memoryStore = store;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // ignore
    }
  }
}

export function resetFixtureStore(): DemoFixtureStore {
  const fresh = createInitialFixtures();
  saveFixtureStore(fresh);
  return fresh;
}
