/**
 * RBAC Seeding Script
 * 
 * Populates the database with:
 * 1. All permissions from existing authorization system
 * 2. Role-permission mappings (ADMIN, MANAGER, USER) as RolePermission records
 * 3. Default permissions for existing users
 * 
 * This script is safe to run multiple times (idempotent).
 * Run after: npx prisma migrate deploy
 */

import prisma from '@/config/database';
import { ROLE_PERMISSIONS } from '@/shared/utils/permissions';

/**
 * Get all unique permissions across all roles
 */
function getAllPermissions(): string[] {
  const allPerms = new Set<string>();
  Object.values(ROLE_PERMISSIONS).forEach((perms: string[]) => {
    perms.forEach((p: string) => allPerms.add(p));
  });
  return Array.from(allPerms).sort();
}

/**
 * Seed all permissions into the database
 */
async function seedPermissions(): Promise<number> {
  console.log('📋 Seeding permissions...');

  const allPermissions = getAllPermissions();
  let createdCount = 0;

  for (const permissionName of allPermissions) {
    // Parse permission: "resource:action" → { resource, action }
    const parts = permissionName.split(':');
    const resource = parts[0];
    const action = parts.slice(1).join(':'); // Handle actions with colons

    const permission = await prisma.permission.upsert({
      where: { name: permissionName },
      update: {}, // No updates if already exists
      create: {
        name: permissionName,
        resource,
        action,
        description: `${action} on ${resource}`, // e.g., "create on document"
        category: 'general',
      },
    });

    createdCount++;
    if (createdCount % 20 === 0) {
      console.log(`  ✓ Created ${createdCount}/${allPermissions.length} permissions...`);
    }
  }

  console.log(`✅ Seeded ${createdCount} permissions`);
  return createdCount;
}

/**
 * Seed role-permission mappings
 */
async function seedRolePermissions(): Promise<number> {
  console.log('\n🔐 Seeding role permissions...');

  const roles = ['ADMIN', 'MANAGER', 'USER'] as const;
  let totalMappings = 0;

  for (const role of roles) {
    const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];

    for (const permissionName of permissions) {
      // Get or create the permission
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName },
      });

      if (!permission) {
        console.warn(`⚠️  Permission not found: ${permissionName}`);
        continue;
      }

      // Create or update the role-permission mapping
      await prisma.rolePermission.upsert({
        where: {
          role_permissionId: {
            role,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          role,
          permissionId: permission.id,
        },
      });

      totalMappings++;
    }

    const permCount = permissions.length;
    console.log(`  ✓ ${role} role: ${permCount} permissions`);
  }

  console.log(`✅ Seeded ${totalMappings} role-permission mappings`);
  return totalMappings;
}

/**
 * Seed default permissions for existing users
 * Assigns role-based permissions to all active users
 */
async function seedUserPermissions(): Promise<number> {
  console.log('\n👥 Seeding user permissions from roles...');

  const users = await prisma.user.findMany({
    where: {},
  });

  console.log(`  Found ${users.length} active users`);

  let totalAssigned = 0;

  for (const user of users) {
    const userRole = user.role as 'ADMIN' | 'MANAGER' | 'USER' | null;

    if (!userRole) {
      console.warn(`  ⚠️  User ${user.id} has no role assigned`);
      continue;
    }

    // Get role permissions from ROLE_PERMISSIONS
    const rolePermissions = ROLE_PERMISSIONS[userRole];

    // Assign permissions to user (from their role)
    for (const permissionName of rolePermissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName },
      });

      if (!permission) {
        console.warn(`  ⚠️  Permission not found: ${permissionName}`);
        continue;
      }

      await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId: user.id,
            permissionId: permission.id,
          },
        },
        update: {
          grantedAt: new Date(),
          grantedBy: 'system:seed', // System seeding
        },
        create: {
          userId: user.id,
          permissionId: permission.id,
          grantedAt: new Date(),
          grantedBy: 'system:seed',
          granted: true, // All role permissions are allowed (granted=true, not 'allow')
        },
      });

      totalAssigned++;
    }

    console.log(`  ✓ User ${user.id} (${userRole}): ${rolePermissions.length} permissions`);
  }

  console.log(`✅ Assigned ${totalAssigned} permissions to users`);
  return totalAssigned;
}

/**
 * Verify seeding was successful
 */
async function verifySeed(): Promise<boolean> {
  console.log('\n🔍 Verifying seed data...');

  const permissionCount = await prisma.permission.count();
  const rolePermissionCount = await prisma.rolePermission.count();
  const userPermissionCount = await prisma.userPermission.count();

  const allPerms = getAllPermissions();
  console.log(`
  📊 Seed Statistics:
     ✓ Permissions: ${permissionCount} (expected: ${allPerms.length})
     ✓ Role-Permission Mappings: ${rolePermissionCount}
     ✓ User-Permission Mappings: ${userPermissionCount}
  `);

  const expected = allPerms.length;
  if (permissionCount !== expected) {
    console.error(
      `❌ Permission count mismatch! Got ${permissionCount}, expected ${expected}`
    );
    return false;
  }

  if (rolePermissionCount === 0) {
    console.error('❌ No role-permission mappings created!');
    return false;
  }

  console.log('✅ Seed verification passed!');
  return true;
}

/**
 * Main seeding function
 */
export async function seedRBAC() {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  PHASE 1 STEP 5: RBAC DATABASE SEEDING');
    console.log('═══════════════════════════════════════════════════════');

    const permCount = await seedPermissions();
    const rolePermCount = await seedRolePermissions();
    const userPermCount = await seedUserPermissions();

    const verified = await verifySeed();

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  SEEDING SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`
  ✅ Permissions:       ${permCount} created
  ✅ Role Permissions:  ${rolePermCount} mapped
  ✅ User Permissions:  ${userPermCount} assigned
  ✅ Verification:      ${verified ? 'PASSED' : 'FAILED'}
    `);

    if (verified) {
      console.log('🎉 RBAC seeding completed successfully!');
      return true;
    } else {
      console.error('❌ Seeding verification failed!');
      return false;
    }
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// ===== SCRIPT EXECUTION =====
// Run seeding if this file is executed directly
if (require.main === module) {
  seedRBAC()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}


