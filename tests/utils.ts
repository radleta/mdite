import { join } from 'path';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load a fixture file
 * @param name - Relative path to the fixture file from tests/fixtures/
 * @returns File contents as string
 */
export async function loadFixture(name: string): Promise<string> {
  const path = join(__dirname, 'fixtures', name);
  return readFile(path, 'utf-8');
}

/**
 * Get fixture path
 * @param parts - Path parts to join
 * @returns Full path to the fixture
 */
export function getFixturePath(...parts: string[]): string {
  return join(__dirname, 'fixtures', ...parts);
}

/**
 * Assert array contains items (order doesn't matter)
 * @param actual - Actual array
 * @param expected - Expected items
 * @param message - Optional error message
 */
export function assertArrayContains<T>(actual: T[], expected: T[], message?: string): void {
  const missing = expected.filter(item => !actual.includes(item));
  if (missing.length > 0) {
    throw new Error(message || `Array missing items: ${JSON.stringify(missing)}`);
  }
}

/**
 * Delay for async tests
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a spy function that tracks calls
 * @returns Spy function with call tracking
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createSpy<T extends (...args: any[]) => any>(): T & {
  calls: Array<Parameters<T>>;
  callCount: number;
  reset: () => void;
} {
  const calls: Array<Parameters<T>> = [];

  const spy = ((...args: Parameters<T>) => {
    calls.push(args);
  }) as T & {
    calls: Array<Parameters<T>>;
    callCount: number;
    reset: () => void;
  };

  spy.calls = calls;

  Object.defineProperty(spy, 'callCount', {
    get: () => calls.length,
  });

  spy.reset = () => {
    calls.length = 0;
  };

  return spy;
}
