// Polyfill Buffer and process for browser environment
import { Buffer } from 'buffer';

// Make Buffer globally available
(window as any).Buffer = Buffer;
(globalThis as any).Buffer = Buffer;

// Polyfill process for crypto libraries
(window as any).process = {
  env: {},
  version: '',
  versions: {},
  browser: true,
};

(globalThis as any).process = (window as any).process;
