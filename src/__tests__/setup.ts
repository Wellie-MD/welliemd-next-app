import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';

let server: Awaited<typeof import('./mocks/server')>['server'];

// Mock environment variables for testing
Object.assign(process.env, {
  VITE_API_BASE_URL: 'http://localhost:3000/api',
  VITE_API_TIMEOUT: '5000',
  VITE_AUTH_TOKEN_KEY: 'test_auth_token',
  VITE_REFRESH_TOKEN_KEY: 'test_refresh_token',
  VITE_APP_ENV: 'development',
  VITE_ENABLE_FEATURE_FLAGS: 'true',
  VITE_MOCK_API: 'true',
  VITE_DEBUG_MODE: 'false',
});

// Mock global objects
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
});

// Mock IntersectionObserver
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: class IntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  },
});

// Mock localStorage
const localStorageMock = {
  getItem: (key: string) => {
    return localStorageMock[key] || null;
  },
  setItem: (key: string, value: string) => {
    localStorageMock[key] = value;
  },
  removeItem: (key: string) => {
    delete localStorageMock[key];
  },
  clear: () => {
    Object.keys(localStorageMock).forEach(key => {
      if (key !== 'getItem' && key !== 'setItem' && key !== 'removeItem' && key !== 'clear') {
        delete localStorageMock[key];
      }
    });
  },
  length: 0,
  key: (index: number) => {
    const keys = Object.keys(localStorageMock).filter(
      key => key !== 'getItem' && key !== 'setItem' && key !== 'removeItem' && key !== 'clear' && key !== 'length' && key !== 'key'
    );
    return keys[index] || null;
  },
} as Storage;

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});

// Mock crypto.randomUUID for request IDs
Object.defineProperty(window, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
});

// Mock URL.createObjectURL and URL.revokeObjectURL for file operations
Object.defineProperty(window.URL, 'createObjectURL', {
  value: () => 'blob:test-url',
});

Object.defineProperty(window.URL, 'revokeObjectURL', {
  value: () => {},
});

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: async (text: string) => {
      return Promise.resolve();
    },
    readText: async () => {
      return Promise.resolve('test-clipboard-content');
    },
  },
});

// Setup MSW
beforeAll(async () => {
  ({ server } = await import('./mocks/server'));
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  // Clean up after each test
  cleanup();
  server?.resetHandlers();
  localStorageMock.clear();
});

afterAll(() => {
  server?.close();
});

// Global test utilities
declare global {
  namespace Vi {
    interface JestAssertion<T = any> extends jest.Matchers<void, T> {}
  }
}
