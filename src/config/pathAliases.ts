/**
 * Path Alias Resolver for Production
 * 
 * Ensures TypeScript path aliases (@/, @/shared, etc) work in:
 * - Production (via compiled Node.js) ✅ Uses module-alias
 * - Development (via ts-node) ✅ Uses tsconfig-paths (via package.json dev script)
 * - Docker containers ✅ Uses module-alias
 * 
 * Problem solved:
 * - TypeScript compiler doesn't transform alias imports
 * - tsconfig-paths only works with ts-node in development
 * - Need runtime resolution in compiled production JS
 * 
 * Solution: This file registers aliases ONLY in production
 * In development, tsconfig-paths/register handles it via npm run dev script
 */

import * as moduleAlias from 'module-alias';
import { resolve } from 'path';

/**
 * Register path aliases for production
 * Only runs when NODE_ENV !== 'development'
 * In development, let tsconfig-paths handle it instead
 */
function registerPathAliasesForProduction(): void {
  // Skip registration in development - tsconfig-paths handles it
  if (process.env.NODE_ENV === 'development') {
    return;
  }

  const baseDir = resolve(__dirname);

  // Register all aliases for production/staging/test
  moduleAlias.addAliases({
    '@': resolve(baseDir),
    '@config': resolve(baseDir, 'config'),
    '@modules': resolve(baseDir, 'modules'),
    '@shared': resolve(baseDir, 'shared'),
    '@middlewares': resolve(baseDir, 'middlewares'),
  });

  if (process.env.DEBUG_ALIAS) {
    console.log(`✅ Path aliases registered for production`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   Base directory: ${baseDir}`);
  }
}

// Register immediately on module load (production only)
registerPathAliasesForProduction();

export { registerPathAliasesForProduction };
