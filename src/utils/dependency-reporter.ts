import chalk from 'chalk';
import { DependencyReport, DependencyNode } from '../core/dependency-analyzer.js';
import { Logger } from './logger.js';

export type OutputFormat = 'tree' | 'list' | 'json';

export class DependencyReporter {
  constructor(
    private format: OutputFormat,
    private logger: Logger
  ) {}

  /**
   * Report dependency analysis results
   */
  report(
    report: DependencyReport,
    options: { colors: boolean; showIncoming?: boolean; showOutgoing?: boolean }
  ): void {
    const showIncoming = options.showIncoming ?? true;
    const showOutgoing = options.showOutgoing ?? true;

    if (this.format === 'json') {
      this.reportJson(report);
    } else if (this.format === 'list') {
      this.reportList(report, options.colors, showIncoming, showOutgoing);
    } else {
      this.reportTree(report, options.colors, showIncoming, showOutgoing);
    }
  }

  /**
   * Format as tree with box-drawing characters
   */
  private reportTree(
    report: DependencyReport,
    colors: boolean,
    showIncoming: boolean,
    showOutgoing: boolean
  ): void {
    this.logger.line();
    this.logger.log(colors ? chalk.bold(report.file) : report.file);
    this.logger.log(colors ? chalk.gray('─'.repeat(50)) : '-'.repeat(50));
    this.logger.line();

    // Incoming section
    if (showIncoming) {
      if (report.incoming.length > 0) {
        const title = `Incoming (${report.stats.incomingCount} file${report.stats.incomingCount === 1 ? '' : 's'} reference${report.stats.incomingCount === 1 ? 's' : ''} this):`;
        this.logger.log(colors ? chalk.cyan(title) : title);
        this.printTree(report.incoming, '', true, colors);
        this.logger.line();
      } else {
        this.logger.log(colors ? chalk.cyan('Incoming:') : 'Incoming:');
        this.logger.log(colors ? chalk.gray('None') : 'None');
        this.logger.line();
      }
    }

    // Outgoing section
    if (showOutgoing) {
      if (report.outgoing.length > 0) {
        const title = `Outgoing (${report.stats.outgoingCount} file${report.stats.outgoingCount === 1 ? '' : 's'} referenced by this):`;
        this.logger.log(colors ? chalk.magenta(title) : title);
        this.printTree(report.outgoing, '', true, colors);
        this.logger.line();
      } else {
        this.logger.log(colors ? chalk.magenta('Outgoing:') : 'Outgoing:');
        this.logger.log(colors ? chalk.gray('None') : 'None');
        this.logger.line();
      }
    }

    // Cycles section
    if (report.cycles.length > 0) {
      const title = `${report.cycles.length} cycle${report.cycles.length === 1 ? '' : 's'} detected:`;
      this.logger.log(colors ? chalk.yellow(title) : title);
      for (const cycle of report.cycles) {
        const cycleStr = `${cycle.from} → ${cycle.to}`;
        this.logger.log(colors ? chalk.yellow(`  - ${cycleStr}`) : `  - ${cycleStr}`);
      }
    }
  }

  /**
   * Print dependency tree recursively
   */
  private printTree(
    nodes: DependencyNode[],
    prefix: string,
    isRoot: boolean,
    colors: boolean
  ): void {
    nodes.forEach((node, index) => {
      const isLast = index === nodes.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const fullPrefix = isRoot ? connector : prefix + connector;

      let nodeStr = fullPrefix + node.path;

      if (node.isCycle) {
        const cycleNote = ' [cycle detected]';
        nodeStr += colors ? chalk.yellow(cycleNote) : cycleNote;
      }

      this.logger.log(nodeStr);

      if (node.children.length > 0 && !node.isCycle) {
        const childPrefix = isRoot
          ? isLast
            ? '    '
            : '│   '
          : prefix + (isLast ? '    ' : '│   ');
        this.printTree(node.children, childPrefix, false, colors);
      }
    });
  }

  /**
   * Format as flat list
   */
  private reportList(
    report: DependencyReport,
    colors: boolean,
    showIncoming: boolean,
    showOutgoing: boolean
  ): void {
    this.logger.line();
    this.logger.log(colors ? chalk.bold(report.file) : report.file);
    this.logger.log(colors ? chalk.gray('─'.repeat(50)) : '-'.repeat(50));
    this.logger.line();

    // Incoming section
    if (showIncoming) {
      if (report.incoming.length > 0) {
        this.logger.log(colors ? chalk.cyan('Incoming:') : 'Incoming:');
        const incomingFlat = this.flattenTree(report.incoming);
        incomingFlat.forEach(path => {
          this.logger.log(`- ${path}`);
        });
        this.logger.line();
      } else {
        this.logger.log(colors ? chalk.cyan('Incoming:') : 'Incoming:');
        this.logger.log(colors ? chalk.gray('None') : 'None');
        this.logger.line();
      }
    }

    // Outgoing section
    if (showOutgoing) {
      if (report.outgoing.length > 0) {
        this.logger.log(colors ? chalk.magenta('Outgoing:') : 'Outgoing:');
        const outgoingFlat = this.flattenTree(report.outgoing);
        outgoingFlat.forEach(path => {
          this.logger.log(`- ${path}`);
        });
        this.logger.line();
      } else {
        this.logger.log(colors ? chalk.magenta('Outgoing:') : 'Outgoing:');
        this.logger.log(colors ? chalk.gray('None') : 'None');
        this.logger.line();
      }
    }

    // Summary
    this.logger.log(
      `Total: ${report.stats.incomingCount} incoming, ${report.stats.outgoingCount} outgoing`
    );

    if (report.cycles.length > 0) {
      this.logger.log(
        colors
          ? chalk.yellow(`${report.cycles.length} cycle(s) detected`)
          : `${report.cycles.length} cycle(s) detected`
      );
    }
  }

  /**
   * Flatten tree to list of paths
   */
  private flattenTree(nodes: DependencyNode[]): string[] {
    const paths: string[] = [];
    const seen = new Set<string>();

    const traverse = (node: DependencyNode) => {
      if (!seen.has(node.path)) {
        paths.push(node.path);
        seen.add(node.path);
      }
      for (const child of node.children) {
        if (!child.isCycle) {
          traverse(child);
        }
      }
    };

    nodes.forEach(traverse);
    return paths;
  }

  /**
   * Format as JSON
   */
  private reportJson(report: DependencyReport): void {
    console.log(JSON.stringify(report, null, 2));
  }
}
