import { homedir } from 'os';
import { join, resolve } from 'path';

/**
 * Get user config directory path
 */
export function getUserConfigDir(): string {
  return join(homedir(), '.config', 'doc-lint');
}

/**
 * Get user config file path
 */
export function getUserConfigPath(): string {
  return join(getUserConfigDir(), 'config.json');
}

/**
 * Get project config file path (use cosmiconfig instead)
 */
export function getProjectConfigPath(): string {
  return resolve(process.cwd(), '.doclintrc');
}

/**
 * Resolve tilde in paths
 */
export function resolveTilde(filepath: string): string {
  if (filepath.startsWith('~/')) {
    return join(homedir(), filepath.slice(2));
  }
  return filepath;
}
