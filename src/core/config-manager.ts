import { cosmiconfig } from 'cosmiconfig';
import {
  RuntimeConfig,
  ProjectConfig,
  UserConfig,
  ProjectConfigSchema,
  UserConfigSchema,
  DEFAULT_CONFIG,
  CliOptions,
} from '../types/config.js';
import { getUserConfigPath } from '../utils/paths.js';
import { InvalidConfigError } from '../utils/errors.js';
import { existsSync, readFileSync } from 'fs';

/**
 * Configuration manager with layered config resolution
 * Priority: CLI flags → Project config → User config → Defaults
 */
export class ConfigManager {
  private runtimeConfig: RuntimeConfig;

  private constructor(config: RuntimeConfig) {
    this.runtimeConfig = config;
  }

  /**
   * Load configuration from all sources
   */
  static async load(cliOptions?: CliOptions): Promise<ConfigManager> {
    // Start with defaults
    let config: RuntimeConfig = { ...DEFAULT_CONFIG };

    // Layer 1: User config (~/.config/mdite/config.json)
    const userConfig = await ConfigManager.loadUserConfig();
    if (userConfig) {
      config = ConfigManager.mergeUserConfig(config, userConfig);
    }

    // Layer 2: Project config (cosmiconfig search)
    const projectConfig = await ConfigManager.loadProjectConfig(cliOptions?.config);
    if (projectConfig) {
      config = ConfigManager.mergeProjectConfig(config, projectConfig);
    }

    // Layer 3: CLI options (highest priority)
    if (cliOptions) {
      config = ConfigManager.mergeCliOptions(config, cliOptions);
    }

    return new ConfigManager(config);
  }

  /**
   * Load user config from home directory
   */
  private static async loadUserConfig(): Promise<UserConfig | null> {
    const configPath = getUserConfigPath();

    if (!existsSync(configPath)) {
      return null;
    }

    try {
      const content = readFileSync(configPath, 'utf-8');
      const data = JSON.parse(content);
      return UserConfigSchema.parse(data);
    } catch (error) {
      throw new InvalidConfigError(`User config validation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Load project config using cosmiconfig
   */
  private static async loadProjectConfig(explicitPath?: string): Promise<ProjectConfig | null> {
    const explorer = cosmiconfig('mdite');

    try {
      const result = explicitPath ? await explorer.load(explicitPath) : await explorer.search();

      if (!result) {
        return null;
      }

      return ProjectConfigSchema.parse(result.config);
    } catch (error) {
      throw new InvalidConfigError(`Project config validation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Merge user config into runtime config
   */
  private static mergeUserConfig(config: RuntimeConfig, userConfig: UserConfig): RuntimeConfig {
    return {
      ...config,
      entrypoint: userConfig.defaultEntrypoint || config.entrypoint,
      format: userConfig.defaultFormat || config.format,
      colors: userConfig.colors ?? config.colors,
      verbose: userConfig.verbose ?? config.verbose,
      rules: {
        ...config.rules,
        ...(userConfig.rules || {}),
      },
    };
  }

  /**
   * Merge project config into runtime config
   */
  private static mergeProjectConfig(
    config: RuntimeConfig,
    projectConfig: ProjectConfig
  ): RuntimeConfig {
    return {
      ...config,
      entrypoint: projectConfig.entrypoint || config.entrypoint,
      rules: {
        ...config.rules,
        ...(projectConfig.rules || {}),
      },
    };
  }

  /**
   * Merge CLI options into runtime config (highest priority)
   */
  private static mergeCliOptions(config: RuntimeConfig, cliOptions: CliOptions): RuntimeConfig {
    const merged = { ...config };

    if (cliOptions.entrypoint !== undefined) {
      merged.entrypoint = cliOptions.entrypoint;
    }
    if (cliOptions.format !== undefined) {
      merged.format = cliOptions.format;
    }
    if (cliOptions.colors !== undefined) {
      merged.colors = cliOptions.colors;
    }
    if (cliOptions.verbose !== undefined) {
      merged.verbose = cliOptions.verbose;
    }

    return merged;
  }

  /**
   * Get runtime configuration
   */
  getConfig(): RuntimeConfig {
    return { ...this.runtimeConfig };
  }

  /**
   * Get specific config value
   */
  get<K extends keyof RuntimeConfig>(key: K): RuntimeConfig[K] {
    return this.runtimeConfig[key];
  }

  /**
   * Check if a rule is enabled
   */
  isRuleEnabled(ruleName: string): boolean {
    const severity = this.runtimeConfig.rules[ruleName];
    return severity === 'error' || severity === 'warn';
  }

  /**
   * Get rule severity
   */
  getRuleSeverity(ruleName: string): string {
    return this.runtimeConfig.rules[ruleName] || 'off';
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use ConfigManager.load() static method instead
   */
  async load(cliOptions: Record<string, unknown> = {}): Promise<RuntimeConfig> {
    const manager = await ConfigManager.load(cliOptions as CliOptions);
    return manager.getConfig();
  }
}
