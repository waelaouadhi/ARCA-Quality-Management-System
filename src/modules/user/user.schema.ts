export const userTypeDefs = `#graphql
  input PaginationInput {
    page: Int
    limit: Int
  }

  type PaginationInfo {
    page: Int!
    limit: Int!
    total: Int!
    totalPages: Int!
    hasNext: Boolean!
    hasPrev: Boolean!
  }

  type UserList {
    data: [User!]!
    pagination: PaginationInfo!
  }

  input UpdateUserInput {
    firstName: String
    lastName: String
    role: Role
  }

  extend type Query {
    users(pagination: PaginationInput): UserList!
    user(id: ID!): User!
  }

  extend type Mutation {
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
  }
`;
