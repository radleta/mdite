import { z } from 'zod';

export const DocLintConfigSchema = z.object({
  entrypoint: z.string().default('README.md'),
  rules: z.record(z.enum(['error', 'warn', 'off'])).default({}),
  frontmatterSchema: z.any().optional(),
  extends: z.array(z.string()).optional(),
});

export type DocLintConfig = z.infer<typeof DocLintConfigSchema>;

export const DEFAULT_CONFIG: DocLintConfig = {
  entrypoint: 'README.md',
  rules: {
    'orphan-files': 'error',
    'dead-link': 'error',
    'dead-anchor': 'error',
  },
};
