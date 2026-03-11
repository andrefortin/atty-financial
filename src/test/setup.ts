// ============================================
// Jest Test Configuration
// ============================================

import '@testing-library/jest-dom';

// ============================================
// Global Test Setup
// ============================================

beforeAll(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock window.scrollTo
  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: jest.fn(),
  });

  // Mock window.requestAnimationFrame
  Object.defineProperty(window, 'requestAnimationFrame', {
    writable: true,
    value: (callback: FrameRequestCallback) => {
      return setTimeout(() => callback(Date.now()), 0) as unknown;
    },
  });

  // Mock window.cancelAnimationFrame
  Object.defineProperty(window, 'cancelAnimationFrame', {
    writable: true,
    value: jest.fn(),
  });

  // Mock ResizeObserver
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })) as any;

  // Mock IntersectionObserver
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })) as any;

  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      get length() {
        return Object.keys(store).length;
      },
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    });

  // Mock URL
  global.URL.createObjectURL = jest.fn(() => 'blob:test/url');
  global.URL.revokeObjectURL = jest.fn();

  // Mock Blob
  global.Blob = class Blob {
    constructor(content: any[], options: BlobPropertyBag) {
      this.content = content;
      this.options = options;
    }
  } as any;

  // Mock document methods
  global.document.createElement = jest.fn((tagName) => {
    if (tagName === 'a') {
      return {
        href: '',
        download: '',
        click: jest.fn(),
      } as any;
    }
    return document.createElement(tagName);
  }) as any;

  // Mock canvas (for chart components)
  const canvasContext = {
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(),
    putImageData: jest.fn(),
    createImageData: jest.fn(),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    fillText: jest.fn(),
    restore: jest.fn(),
    fill: jest.fn(),
    strokeRect: jest.fn(),
    strokeText: jest.fn(),
    measureText: jest.fn(),
  };

  global.HTMLCanvasElement.prototype.getContext = jest.fn(() => canvasContext);
  global.HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,test');
});

afterEach(() => {
  // Clear all mocks after each test
  jest.clearAllMocks();

  // Clear localStorage
  localStorage.clear();
});

// ============================================
// Test Utilities
// ============================================

// Custom matchers
expect.extend({
  toHaveClass(received: HTMLElement, className: string) {
    const pass = received.classList.contains(className);
    return {
      pass,
      message: () =>
        pass
          ? `Expected element to have class "${className}"`
          : `Expected element not to have class "${className}"`,
    };
  },

  toHaveAttribute(received: HTMLElement, attributeName: string, value?: any) {
    const hasAttribute = received.hasAttribute(attributeName);

    if (value === undefined) {
      return {
        pass: hasAttribute,
        message: () =>
          hasAttribute
            ? `Expected element to have attribute "${attributeName}"`
            : `Expected element not to have attribute "${attributeName}"`,
      };
    }

    const actualValue = received.getAttribute(attributeName);
    const pass = actualValue === value;

    return {
      pass,
      message: () =>
        pass
          ? `Expected element to have attribute "${attributeName}" with value "${value}"`
          : `Expected element not to have attribute "${attributeName}" with value "${value}" (got "${actualValue}")`,
    };
  },

  toMatchObject(received: any, expected: any) {
    const pass = Object.keys(expected).every((key) => {
      return received[key] === expected[key];
    });

    return {
      pass,
      message: () =>
        pass
          ? `Expected object to match`
          : `Expected object not to match`,
    };
  },
});

// ============================================
// Test Environment Variables
// ============================================

process.env.NODE_ENV = 'test';
process.env.TZ = 'UTC';

// ============================================
// Suppress console output in tests
// ============================================

const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// ============================================
// Timeout Handling
// ============================================

jest.setTimeout(10000);
