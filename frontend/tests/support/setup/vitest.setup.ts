import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import axiosInstance from '@/services/api';
import { server } from '../mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// jsdom's XMLHttpRequest never finishes a multipart body under MSW; the fetch
// adapter does, and the request itself is identical.
axiosInstance.defaults.adapter = 'fetch';
afterAll(() => server.close());

// --- jsdom gaps ---

const matchMediaState = { prefersDark: false };
const darkSchemeListeners = new Set<() => void>();

// Notifies like the OS does when its appearance flips; plain functions so restoreMocks keeps them.
export const setPrefersDark = (value: boolean) => {
  matchMediaState.prefersDark = value;
  darkSchemeListeners.forEach((listener) => listener());
};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: (query: string) => {
    const isDarkQuery = query.includes('prefers-color-scheme: dark');
    const add = (_type: string, listener: () => void) => {
      if (isDarkQuery) darkSchemeListeners.add(listener);
    };
    const remove = (_type: string, listener: () => void) => {
      darkSchemeListeners.delete(listener);
    };
    return {
      matches: isDarkQuery ? matchMediaState.prefersDark : false,
      media: query,
      onchange: null,
      addEventListener: add,
      removeEventListener: remove,
      addListener: (listener: () => void) => add('change', listener),
      removeListener: (listener: () => void) => remove('change', listener),
      dispatchEvent: () => false,
    };
  },
});

type ObserverCallback = (entries: { isIntersecting: boolean; target: Element }[]) => void;

// Tests drive intersection manually; jsdom never fires it.
export const intersectionObservers: { callback: ObserverCallback; elements: Element[] }[] = [];

export const triggerIntersection = (isIntersecting = true) => {
  intersectionObservers.forEach(({ callback, elements }) => {
    callback(elements.map((target) => ({ isIntersecting, target })));
  });
};

class MockIntersectionObserver {
  private entry: { callback: ObserverCallback; elements: Element[] };

  constructor(callback: ObserverCallback) {
    this.entry = { callback, elements: [] };
    intersectionObservers.push(this.entry);
  }
  observe(element: Element) {
    this.entry.elements.push(element);
  }
  unobserve(element: Element) {
    this.entry.elements = this.entry.elements.filter((e) => e !== element);
  }
  disconnect() {
    this.entry.elements = [];
  }
  takeRecords() {
    return [];
  }
}

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
vi.stubGlobal('ResizeObserver', MockResizeObserver);

let objectUrlCounter = 0;
URL.createObjectURL = vi.fn(() => `blob:mock/${++objectUrlCounter}`);
URL.revokeObjectURL = vi.fn();

Element.prototype.scrollIntoView = vi.fn();
window.scrollTo = vi.fn();

// jsdom throws "Not implemented" on navigation; errorBoundary and buildVersionChecker call these.
Object.defineProperty(window, 'location', {
  configurable: true,
  writable: true,
  value: { ...window.location, reload: vi.fn(), assign: vi.fn(), replace: vi.fn(), href: 'http://localhost/' },
});

afterEach(() => {
  server.resetHandlers();
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  intersectionObservers.length = 0;
  matchMediaState.prefersDark = false;
  darkSchemeListeners.clear();
  document.head.querySelectorAll('meta[data-seo], link[rel="canonical"]').forEach((el) => el.remove());
});
