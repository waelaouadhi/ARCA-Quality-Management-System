/**
 * Secure Data Filtering - Type Definitions
 * Database-level authorization filters for role and scope-based access
 */

import { Prisma } from '@prisma/client';

/**
 * Role-based data filter constraints
 */
export interface RoleBasedFilter {
  role: 'ADMIN' | 'MANAGER' | 'USER';
  userId: string;
}

/**
 * Multi-scope user definition
 * A user can have access to multiple scopes (departments, teams, projects)
 */
export interface MultiScopeUser {
  userId: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  scopes: string[]; // IDs of departments, teams, projects user has access to
  createdDepartmentId?: string; // Department where user was created
}

/**
 * Secure filter constraints
 */
export interface SecureFilterConstraints {
  // User context
  user: RoleBasedFilter;
  
  // Scope context (optional)
  scopes?: string[];
  
  // Time-based constraints (optional)
  beforeDate?: Date;
  afterDate?: Date;
  
  // Status constraints (optional)
  allowedStatuses?: string[];
  
  // Exclude deleted/archived (optional)
  includeDeleted?: boolean;
  includeArchived?: boolean;
}

/**
 * Query result with metadata about filtering
 */
export interface SecureQueryResult<T> {
  data: T[];
  total: number;
  filtered: boolean;
  filterApplied: {
    role: string;
    scopes?: string[];
    constraints: string[];
  };
}

/**
 * Filter definition for a specific entity
 */
export interface EntityFilterDefinition {
  // Which fields can users of each role access without restriction
  roleAccessRules: {
    ADMIN: AccessRule;
    MANAGER: AccessRule;
    USER: AccessRule;
  };
  
  // Scope-based filtering
  scopeField?: string; // Field name that defines scope (e.g., 'departmentId')
  
  // Ownership-based filtering
  ownershipFields?: {
    creator?: string;      // Field: who created this
    assignee?: string;     // Field: who this is assigned to
    owner?: string;        // Field: who owns this
  };
  
  // Status field info
  statusField?: string;
  defaultAllowedStatuses?: string[];
  
  // Soft delete support
  deletedAtField?: string;
}

/**
 * Access rule for a role
 */
export interface AccessRule {
  // Can user access all records?
  canAccessAll: boolean;
  
  // Or only specific fields/records?
  accessPatterns: AccessPattern[];
  
  // Field-level masking
  fieldMasking?: {
    [fieldName: string]: boolean; // true = hide field
  };
}

/**
 * How a role can access records
 */
export interface AccessPattern {
  type: 'ADMIN' | 'OWN_RECORDS' | 'SCOPE' | 'CUSTOM';
  
  // For type = 'OWN_RECORDS'
  ownershipField?: string;
  
  // For type = 'SCOPE'
  scopeField?: string;
  
  // For type = 'CUSTOM'
  customFilter?: (user: RoleBasedFilter) => Prisma.NonConformanceWhereInput;
}

/**
 * Performance metrics for filtering
 */
export interface FilterPerformanceMetrics {
  queryExecutionMs: number;
  dbFilteredRows: number;
  appFilteredRows: number;
  indexUsed: boolean;
  totalRowsScanned: number;
}

/**
 * Bad approach: fetch all, filter in app
 * (INSECURE & SLOW)
 */
export interface UnsecureApproach {
  description: 'Fetch all data, filter in application';
  risks: string[];
  performance: 'POOR';
  dataLeakage: true;
}

/**
 * Good approach: filter in database
 * (SECURE & FAST)
 */
export interface SecureApproach {
  description: 'Apply filters at database query level';
  risks: string[];
  performance: 'EXCELLENT';
  dataLeakage: false;
  indexSupport: boolean;
}
