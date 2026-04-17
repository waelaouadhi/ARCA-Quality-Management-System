/**
 * Unified ID Validation Utilities
 * Ensures consistent ID format validation across the application
 * 
 * Used by all modules for entity ID validation
 */

import { z } from 'zod';

/**
 * CUID format specification:
 * - Length: 25 characters
 * - Characters: [a-z0-9]+ only
 * - Example: c0ldwxvzrn000qzrmn831aljf
 * - Prisma default: cuid()
 */

const CUID_REGEX = /^[a-z0-9]{25}$/;
const CUID_LENGTH = 25;

/**
 * Base CUID validator
 * Reusable across all entity ID schemas
 */
export const CuidSchema = z
  .string()
  .length(CUID_LENGTH, `ID must be exactly ${CUID_LENGTH} characters`)
  .regex(CUID_REGEX, 'ID must contain only lowercase letters and numbers')
  .describe('Prisma CUID identifier');

/**
 * Generic entity ID validator
 * Use this for all entity-specific validators
 */
export const EntityIdSchema = CuidSchema.describe('Entity ID');

/**
 * User ID validator (specific)
 */
export const UserIdSchema = CuidSchema.describe('User ID');

/**
 * Non-Conformance ID validator
 */
export const NonConformanceIdSchema = CuidSchema.describe('Non-Conformance ID');

/**
 * Corrective Action ID validator
 */
export const CorrectiveActionIdSchema = CuidSchema.describe('Corrective Action ID');

/**
 * Document ID validator
 */
export const DocumentIdSchema = CuidSchema.describe('Document ID');

/**
 * SLA Rule ID validator
 */
export const SLARuleIdSchema = CuidSchema.describe('SLA Rule ID');

/**
 * Validate multiple IDs (for batch operations)
 */
export const MultipleIdsSchema = z.array(CuidSchema, {
  errorMap: () => ({ message: 'All IDs must be valid Prisma cuid format' }),
});

/**
 * Type exports for TypeScript
 */
export type EntityId = z.infer<typeof EntityIdSchema>;
export type UserId = z.infer<typeof UserIdSchema>;
export type NonConformanceId = z.infer<typeof NonConformanceIdSchema>;
export type CorrectiveActionId = z.infer<typeof CorrectiveActionIdSchema>;
export type DocumentId = z.infer<typeof DocumentIdSchema>;
export type SLARuleId = z.infer<typeof SLARuleIdSchema>;

/**
 * Validation helper functions
 */
export function validateEntityId(id: unknown): id is string {
  try {
    CuidSchema.parse(id);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse and validate entity ID with error handling
 */
export function parseEntityId(id: unknown): string {
  try {
    return CuidSchema.parse(id);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid entity ID: ${error.errors[0].message}`);
    }
    throw error;
  }
}

/**
 * Batch validate multiple IDs
 */
export function parseMultipleIds(ids: unknown): string[] {
  try {
    return MultipleIdsSchema.parse(ids);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid IDs: ${error.errors[0].message}`);
    }
    throw error;
  }
}
