import { describe, it, expect } from 'vitest';
import { promisePool } from '../../src/utils/promise-pool.js';

describe('promisePool', () => {
  describe('basic functionality', () => {
    it('should process all items', async () => {
      const items = [1, 2, 3, 4, 5];
      const results = await promisePool(items, async n => n * 2, 2);

      expect(results).toEqual([2, 4, 6, 8, 10]);
    });

    it('should handle empty array', async () => {
      const items: number[] = [];
      const results = await promisePool(items, async n => n * 2, 2);

      expect(results).toEqual([]);
    });

    it('should handle single item', async () => {
      const items = [42];
      const results = await promisePool(items, async n => n * 2, 2);

      expect(results).toEqual([84]);
    });

    it('should preserve order of results', async () => {
      const items = [1, 2, 3, 4, 5];
      const results = await promisePool(
        items,
        async n => {
          // Add random delay to test order preservation
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
          return n;
        },
        3
      );

      expect(results).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('concurrency limiting', () => {
    it('should limit concurrency', async () => {
      let concurrent = 0;
      let maxConcurrent = 0;

      const items = Array.from({ length: 20 }, (_, i) => i);

      await promisePool(
        items,
        async () => {
          concurrent++;
          maxConcurrent = Math.max(maxConcurrent, concurrent);
          await new Promise(resolve => setTimeout(resolve, 10));
          concurrent--;
        },
        5
      );

      expect(maxConcurrent).toBeLessThanOrEqual(5);
      expect(maxConcurrent).toBeGreaterThan(1); // Should use parallelism
    });

    it('should handle concurrency of 1 (sequential)', async () => {
      let concurrent = 0;
      let maxConcurrent = 0;

      const items = Array.from({ length: 10 }, (_, i) => i);

      await promisePool(
        items,
        async () => {
          concurrent++;
          maxConcurrent = Math.max(maxConcurrent, concurrent);
          await new Promise(resolve => setTimeout(resolve, 5));
          concurrent--;
        },
        1
      );

      expect(maxConcurrent).toBe(1);
    });

    it('should handle concurrency greater than items', async () => {
      let concurrent = 0;
      let maxConcurrent = 0;

      const items = [1, 2, 3];

      await promisePool(
        items,
        async () => {
          concurrent++;
          maxConcurrent = Math.max(maxConcurrent, concurrent);
          await new Promise(resolve => setTimeout(resolve, 10));
          concurrent--;
        },
        10
      );

      expect(maxConcurrent).toBeLessThanOrEqual(3);
    });
  });

  describe('error handling', () => {
    it('should propagate errors', async () => {
      const items = [1, 2, 3, 4];

      await expect(
        promisePool(
          items,
          async n => {
            if (n === 3) throw new Error('Test error');
            return n * 2;
          },
          2
        )
      ).rejects.toThrow('Test error');
    });

    it('should stop processing after first error', async () => {
      const items = [1, 2, 3, 4, 5];
      const processed: number[] = [];

      await expect(
        promisePool(
          items,
          async n => {
            await new Promise(resolve => setTimeout(resolve, 10));
            processed.push(n);
            if (n === 3) throw new Error('Test error');
            return n * 2;
          },
          2
        )
      ).rejects.toThrow('Test error');

      // Not all items should be processed after error
      expect(processed.length).toBeLessThan(items.length);
    });
  });

  describe('default parameters', () => {
    it('should use default concurrency of 10', async () => {
      const items = Array.from({ length: 15 }, (_, i) => i);
      let maxConcurrent = 0;
      let concurrent = 0;

      const results = await promisePool(items, async n => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise(resolve => setTimeout(resolve, 5));
        concurrent--;
        return n * 2;
      });

      expect(results).toHaveLength(15);
      expect(maxConcurrent).toBeGreaterThan(1);
      expect(maxConcurrent).toBeLessThanOrEqual(10);
    });
  });

  describe('async operations', () => {
    it('should handle promises that resolve immediately', async () => {
      const items = [1, 2, 3, 4, 5];
      const results = await promisePool(items, async n => n * 2, 2);

      expect(results).toEqual([2, 4, 6, 8, 10]);
    });

    it('should handle mixed fast and slow operations', async () => {
      const items = [1, 2, 3, 4, 5];
      const results = await promisePool(
        items,
        async n => {
          // Odd numbers are slow, even are fast
          if (n % 2 === 1) {
            await new Promise(resolve => setTimeout(resolve, 20));
          }
          return n * 2;
        },
        2
      );

      expect(results).toEqual([2, 4, 6, 8, 10]);
    });
  });

  describe('type safety', () => {
    it('should work with different types', async () => {
      const strings = ['a', 'b', 'c'];
      const results = await promisePool(strings, async s => s.toUpperCase(), 2);

      expect(results).toEqual(['A', 'B', 'C']);
    });

    it('should work with object types', async () => {
      const items = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];

      const results = await promisePool(items, async item => ({ ...item, processed: true }), 2);

      expect(results).toEqual([
        { id: 1, name: 'Alice', processed: true },
        { id: 2, name: 'Bob', processed: true },
      ]);
    });
  });
});
