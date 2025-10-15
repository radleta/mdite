import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DependencyReporter } from '../../src/utils/dependency-reporter.js';
import { DependencyReport } from '../../src/core/dependency-analyzer.js';
import { Logger } from '../../src/utils/logger.js';

describe('DependencyReporter', () => {
  let mockLogger: Logger;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let output: string[];

  beforeEach(() => {
    output = [];
    mockLogger = new Logger(false);

    // Spy on console.log to capture output
    logSpy = vi.spyOn(console, 'log').mockImplementation(msg => {
      output.push(String(msg));
    });
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  describe('Tree format', () => {
    it('should format simple tree with box-drawing characters', () => {
      const reporter = new DependencyReporter('tree', mockLogger);
      const report: DependencyReport = {
        file: '/docs/a.md',
        incoming: [],
        outgoing: [
          { path: '/docs/b.md', depth: 1, children: [] },
          { path: '/docs/c.md', depth: 1, children: [] },
        ],
        cycles: [],
        stats: { incomingCount: 0, outgoingCount: 2, cyclesDetected: 0 },
      };

      reporter.report(report, { colors: false });

      const outputStr = output.join('\n');
      expect(outputStr).toContain('├──');
      expect(outputStr).toContain('└──');
      expect(outputStr).toContain('/docs/b.md');
      expect(outputStr).toContain('/docs/c.md');
    });

    it('should indent nested dependencies correctly', () => {
      const reporter = new DependencyReporter('tree', mockLogger);
      const report: DependencyReport = {
        file: '/docs/a.md',
        incoming: [],
        outgoing: [
          {
            path: '/docs/b.md',
            depth: 1,
            children: [{ path: '/docs/c.md', depth: 2, children: [] }],
          },
        ],
        cycles: [],
        stats: { incomingCount: 0, outgoingCount: 2, cyclesDetected: 0 },
      };

      reporter.report(report, { colors: false });

      const outputStr = output.join('\n');
      expect(outputStr).toContain('└── /docs/b.md');
      expect(outputStr).toContain('    └── /docs/c.md');
    });

    it('should annotate cycles in tree output', () => {
      const reporter = new DependencyReporter('tree', mockLogger);
      const report: DependencyReport = {
        file: '/docs/a.md',
        incoming: [],
        outgoing: [
          {
            path: '/docs/b.md',
            depth: 1,
            children: [
              {
                path: '/docs/a.md',
                depth: 2,
                children: [],
                isCycle: true,
                cycleTarget: '/docs/a.md',
              },
            ],
          },
        ],
        cycles: [{ from: '/docs/b.md', to: '/docs/a.md' }],
        stats: { incomingCount: 0, outgoingCount: 1, cyclesDetected: 1 },
      };

      reporter.report(report, { colors: false });

      const outputStr = output.join('\n');
      expect(outputStr).toContain('[cycle detected]');
      expect(outputStr).toContain('1 cycle detected');
    });

    it('should show "None" when no dependencies exist', () => {
      const reporter = new DependencyReporter('tree', mockLogger);
      const report: DependencyReport = {
        file: '/docs/isolated.md',
        incoming: [],
        outgoing: [],
        cycles: [],
        stats: { incomingCount: 0, outgoingCount: 0, cyclesDetected: 0 },
      };

      reporter.report(report, { colors: false });

      const outputStr = output.join('\n');
      expect(outputStr).toContain('None');
    });

    it('should separate incoming and outgoing sections', () => {
      const reporter = new DependencyReporter('tree', mockLogger);
      const report: DependencyReport = {
        file: '/docs/middle.md',
        incoming: [{ path: '/docs/before.md', depth: 1, children: [] }],
        outgoing: [{ path: '/docs/after.md', depth: 1, children: [] }],
        cycles: [],
        stats: { incomingCount: 1, outgoingCount: 1, cyclesDetected: 0 },
      };

      reporter.report(report, { colors: false });

      const outputStr = output.join('\n');
      expect(outputStr).toContain('Incoming');
      expect(outputStr).toContain('Outgoing');
    });
  });

  describe('List format', () => {
    it('should format as flat bullet list', () => {
      const reporter = new DependencyReporter('list', mockLogger);
      const report: DependencyReport = {
        file: '/docs/a.md',
        incoming: [],
        outgoing: [
          { path: '/docs/b.md', depth: 1, children: [] },
          { path: '/docs/c.md', depth: 1, children: [] },
        ],
        cycles: [],
        stats: { incomingCount: 0, outgoingCount: 2, cyclesDetected: 0 },
      };

      reporter.report(report, { colors: false });

      const outputStr = output.join('\n');
      expect(outputStr).toContain('- /docs/b.md');
      expect(outputStr).toContain('- /docs/c.md');
    });

    it('should show summary statistics', () => {
      const reporter = new DependencyReporter('list', mockLogger);
      const report: DependencyReport = {
        file: '/docs/a.md',
        incoming: [{ path: '/docs/x.md', depth: 1, children: [] }],
        outgoing: [
          { path: '/docs/b.md', depth: 1, children: [] },
          { path: '/docs/c.md', depth: 1, children: [] },
        ],
        cycles: [],
        stats: { incomingCount: 1, outgoingCount: 2, cyclesDetected: 0 },
      };

      reporter.report(report, { colors: false });

      const outputStr = output.join('\n');
      expect(outputStr).toMatch(/Total:.*1.*incoming.*2.*outgoing/);
    });

    it('should flatten nested dependencies', () => {
      const reporter = new DependencyReporter('list', mockLogger);
      const report: DependencyReport = {
        file: '/docs/a.md',
        incoming: [],
        outgoing: [
          {
            path: '/docs/b.md',
            depth: 1,
            children: [{ path: '/docs/c.md', depth: 2, children: [] }],
          },
        ],
        cycles: [],
        stats: { incomingCount: 0, outgoingCount: 2, cyclesDetected: 0 },
      };

      reporter.report(report, { colors: false });

      const outputStr = output.join('\n');
      expect(outputStr).toContain('- /docs/b.md');
      expect(outputStr).toContain('- /docs/c.md');
    });
  });

  describe('JSON format', () => {
    it('should output valid JSON structure', () => {
      const reporter = new DependencyReporter('json', mockLogger);
      const report: DependencyReport = {
        file: '/docs/a.md',
        incoming: [],
        outgoing: [{ path: '/docs/b.md', depth: 1, children: [] }],
        cycles: [],
        stats: { incomingCount: 0, outgoingCount: 1, cyclesDetected: 0 },
      };

      reporter.report(report, { colors: false });

      const outputStr = output.join('\n');
      const parsed = JSON.parse(outputStr);

      expect(parsed).toHaveProperty('file');
      expect(parsed).toHaveProperty('incoming');
      expect(parsed).toHaveProperty('outgoing');
      expect(parsed).toHaveProperty('stats');
    });

    it('should include all report fields in JSON', () => {
      const reporter = new DependencyReporter('json', mockLogger);
      const report: DependencyReport = {
        file: '/docs/a.md',
        incoming: [{ path: '/docs/x.md', depth: 1, children: [] }],
        outgoing: [{ path: '/docs/b.md', depth: 1, children: [] }],
        cycles: [{ from: '/docs/b.md', to: '/docs/a.md' }],
        stats: { incomingCount: 1, outgoingCount: 1, cyclesDetected: 1 },
      };

      reporter.report(report, { colors: false });

      const outputStr = output.join('\n');
      const parsed = JSON.parse(outputStr);

      expect(parsed.file).toBe('/docs/a.md');
      expect(parsed.incoming).toHaveLength(1);
      expect(parsed.outgoing).toHaveLength(1);
      expect(parsed.cycles).toHaveLength(1);
      expect(parsed.stats.incomingCount).toBe(1);
      expect(parsed.stats.outgoingCount).toBe(1);
      expect(parsed.stats.cyclesDetected).toBe(1);
    });
  });
});
