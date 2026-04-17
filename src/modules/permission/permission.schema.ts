export const permissionTypeDefs = `#graphql
  type Permission {
    id: ID!
    name: String!
    resource: String!
    action: String!
    description: String
    category: String!
    isActive: Boolean!
  }

  type UserPermissionGrant {
    id: ID!
    user: User!
    permission: Permission!
    granted: Boolean!
    reason: String
    grantedBy: String
    grantedAt: DateTime!
    expiresAt: DateTime
  }

  type RolePermissionMapping {
    id: ID!
    role: Role!
    permission: Permission!
  }

  extend type Query {
    getPermissions(filter: String): [Permission!]!
    getRolePermissions(role: Role!): [RolePermissionMapping!]!
    getUserPermissions(userId: ID!): [UserPermissionGrant!]!
  }

  extend type Mutation {
    grantPermissionToUser(userId: ID!, permissionId: ID!, reason: String): UserPermissionGrant!
    revokePermissionFromUser(userId: ID!, permissionId: ID!): UserPermissionGrant!
  }
`;
