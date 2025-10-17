/**
 * Promise pool with controlled concurrency
 *
 * Processes an array of items with a specified function, limiting the number
 * of concurrent operations. This prevents resource exhaustion when processing
 * large datasets (e.g., 1000+ files).
 *
 * @example
 * ```typescript
 * const files = ['file1.md', 'file2.md', 'file3.md'];
 * const results = await promisePool(
 *   files,
 *   async (file) => validateFile(file),
 *   10 // max 10 concurrent operations
 * );
 * ```
 */

/**
 * Execute async operations with controlled concurrency
 *
 * @param items - Array of items to process
 * @param fn - Async function to apply to each item
 * @param concurrency - Maximum number of concurrent operations (default: 10)
 * @returns Promise resolving to array of results in original order
 *
 * @throws If any operation fails, the promise pool will reject with the first error
 *
 * @example
 * ```typescript
 * // Validate files with max 10 concurrent operations
 * const results = await promisePool(
 *   files,
 *   file => validateFile(file),
 *   10
 * );
 * ```
 */
export async function promisePool<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number = 10
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  const executing: Set<Promise<void>> = new Set();

  for (let i = 0; i < items.length; i++) {
    // Use non-null assertion since we know i is within bounds
    const item = items[i]!;
    const resultIndex = i;

    const promise = (async () => {
      const result = await fn(item);
      results[resultIndex] = result;
    })().finally(() => {
      executing.delete(promise);
    });

    executing.add(promise);

    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}
