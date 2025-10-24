import { Logger } from '../../src/utils/logger.js';

/**
 * Mock logger for testing
 * Captures all log messages instead of outputting them
 */
export class MockLogger extends Logger {
  public logs: Array<{ level: string; message: string; error?: Error }> = [];

  constructor() {
    super(false); // No colors
  }

  override header(message: string): void {
    this.logs.push({ level: 'header', message });
  }

  override info(message: string): void {
    this.logs.push({ level: 'info', message });
  }

  override error(message: string, error?: Error): void {
    this.logs.push({ level: 'error', message, error });
  }

  override success(message: string): void {
    this.logs.push({ level: 'success', message });
  }

  override log(message: string): void {
    this.logs.push({ level: 'log', message });
  }

  override line(): void {
    this.logs.push({ level: 'line', message: '' });
  }

  /**
   * Get all log messages of a specific level
   * @param level - Optional log level to filter by
   * @returns Array of log messages
   */
  getLogs(level?: string): string[] {
    const filtered = level ? this.logs.filter(log => log.level === level) : this.logs;
    return filtered.map(log => log.message);
  }

  /**
   * Clear all captured logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Check if a specific message was logged
   * @param message - Message to search for
   * @returns True if message was found
   */
  hasLog(message: string): boolean {
    return this.logs.some(log => log.message.includes(message));
  }

  /**
   * Get the number of logs at a specific level
   * @param level - Log level
   * @returns Count of logs at that level
   */
  getLogCount(level?: string): number {
    if (level) {
      return this.logs.filter(log => log.level === level).length;
    }
    return this.logs.length;
  }
}
