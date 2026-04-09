// Postbuild step: copy functions/ into dist/functions/
// so `wrangler pages deploy ./dist` picks them up as Pages Functions.
//
// We keep functions/ at the project root for developer convenience,
// but wrangler looks for them inside the deploy directory.

import { cpSync, rmSync, existsSync } from 'node:fs';

if (!existsSync('functions')) {
  console.log('  (no functions/ directory — skipping)');
  process.exit(0);
}

rmSync('dist/functions', { recursive: true, force: true });
cpSync('functions', 'dist/functions', { recursive: true });
console.log('  ✓ Bundled functions/ into dist/functions/');
