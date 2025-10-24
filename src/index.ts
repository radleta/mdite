#!/usr/bin/env node

import { cli } from './cli.js';

// Run CLI with top-level error handler
cli().catch((error: Error) => {
  console.error('Fatal error:', error.message);
  if (process.env['DEBUG']) {
    console.error(error.stack);
  }
  process.exit(1);
});
