/**
 * Environment Variable Validation & Configuration
 * 
 * Ensures all required environment variables are set with secure defaults
 * Fails fast if critical variables are missing or invalid
 * 
 * Usage:
 *   import { config } from '@/config/env';
 *   const port = config.PORT;
 */

import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env file FIRST
dotenv.config();

/**
 * Environment variable schema
 * Define all required and optional variables with validation
 */
const EnvSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'staging', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  APP_NAME: z.string().default('QMS-Backend'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // JWT - SECURITY CRITICAL
  JWT_SECRET: z
    .string()
    .min(32, '❌ SECURITY ERROR: JWT_SECRET must be at least 32 characters (256 bits minimum)')
    .refine(
      (val) => /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{32,}$/.test(val),
      'JWT_SECRET must contain mix of uppercase, lowercase, numbers, and special characters'
    ),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // CORS
  CORS_ORIGIN: z.string().url('CORS_ORIGIN must be a valid URL'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Optional - for specific integrations
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
}).passthrough();

/**
 * Type for environment variables
 */
export type EnvConfig = z.infer<typeof EnvSchema>;

/**
 * Load and validate environment variables
 * Throws on startup if validation fails (fail-fast approach)
 */
function loadEnv(): EnvConfig {
  try {
    return EnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('\n╔════════════════════════════════════════════════════════════════╗');
      console.error('║           🚨 ENVIRONMENT CONFIGURATION ERROR 🚨              ║');
      console.error('╚════════════════════════════════════════════════════════════════╝\n');

      error.errors.forEach((err) => {
        console.error(`❌ ${err.path.join('.')}: ${err.message}`);
      });

      console.error('\n📋 Required environment variables:');
      console.error('   - NODE_ENV (development | production | staging | test)');
      console.error('   - PORT (1-65535, default: 4000)');
      console.error('   - DATABASE_URL (valid URL to PostgreSQL)');
      console.error('   - JWT_SECRET (32+ chars, mixed case, numbers, symbols)');
      console.error('   - CORS_ORIGIN (valid URL)');
      console.error('   - LOG_LEVEL (error | warn | info | debug)');

      console.error('\n💡 Copy .env.example to .env and update values:');
      console.error('   cp .env.example .env');
      console.error('   # Edit .env with production values\n');

      process.exit(1);
    }
    throw error;
  }
}

/**
 * Validate JWT secret strength (additional security check)
 */
function validateJWTSecret(secret: string): void {
  const issues: string[] = [];

  if (secret.length < 32) issues.push(`Too short: ${secret.length} chars (need 32+)`);
  if (!/[a-z]/.test(secret)) issues.push('Missing lowercase letters');
  if (!/[A-Z]/.test(secret)) issues.push('Missing uppercase letters');
  if (!/[0-9]/.test(secret)) issues.push('Missing numbers');
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(secret))
    issues.push('Missing special characters');

  if (issues.length > 0 && process.env.NODE_ENV === 'production') {
    console.error('\n🔐 JWT_SECRET SECURITY WARNINGS:');
    issues.forEach((issue) => console.error(`  ⚠️  ${issue}`));
    console.error('\n⚡ Strong JWT secrets prevent token forgery attacks\n');
    process.exit(1);
  }
}

/**
 * Load config
 */
const config = loadEnv();

/**
 * Validate JWT secret if production
 */
if (config.NODE_ENV === 'production') {
  validateJWTSecret(config.JWT_SECRET);
}

export { config };

/**
 * Convenience exports for common config values
 */
export const {
  NODE_ENV,
  PORT,
  APP_NAME,
  DATABASE_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  CORS_ORIGIN,
  LOG_LEVEL,
} = config;

export default config;
