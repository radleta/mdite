import { cosmiconfig } from 'cosmiconfig';
import { DocLintConfig, DocLintConfigSchema, DEFAULT_CONFIG } from '../types/config.js';
import { InvalidConfigError } from '../utils/errors.js';

export class ConfigManager {
  async load(cliOptions: Record<string, unknown> = {}): Promise<DocLintConfig> {
    // 1. Search for config file
    const explorer = cosmiconfig('doclint');
    const result = await explorer.search();

    const fileConfig = result?.config || {};

    // 2. Merge: defaults < file < CLI
    const merged = {
      ...DEFAULT_CONFIG,
      ...fileConfig,
      ...cliOptions,
    };

    // 3. Validate with Zod
    try {
      return DocLintConfigSchema.parse(merged);
    } catch (error: any) {
      throw new InvalidConfigError(error.message);
    }
  }
}
