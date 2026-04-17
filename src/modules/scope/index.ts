/**
 * Scope Module - DISABLED
 * 
 * ⚠️ This module has been disabled due to the following issues:
 * 
 * MISSING DEPENDENCIES:
 * - Prisma models (Scope, UserScope) don't exist in prisma/schema.prisma
 * - These models are required but not defined in the database schema
 * 
 * DISABLED FILES (renamed to .disabled.ts):
 * - scope.service.ts (all Prisma queries reference non-existent models)
 * 
 * TO RE-ENABLE THIS MODULE:
 * 1. Add Scope and UserScope models to prisma/schema.prisma
 *    Example:
 *    model Scope {
 *      id        String   @id @default(cuid())
 *      name      String   @unique
 *      description String?
 *      isActive  Boolean  @default(true)
 *      createdAt DateTime @default(now())
 *      updatedAt DateTime @updatedAt
 *    }
 *    
 *    model UserScope {
 *      id        String   @id @default(cuid())
 *      userId    String
 *      scopeId   String
 *      user      User     @relation(fields: [userId], references: [id])
 *      scope     Scope    @relation(fields: [scopeId], references: [id])
 *      createdAt DateTime @default(now())
 *    }
 * 
 * 2. Run "npx prisma migrate" to create the migration
 * 3. Rename scope.service.ts.disabled to scope.service.ts
 * 4. Restore exports below
 */

// Module is disabled - no exports
export {};

