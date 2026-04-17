export const nonConformanceTypeDefs = `#graphql
  enum Severity {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  enum NCStatus {
    OPEN
    IN_PROGRESS
    RESOLVED
    CLOSED
  }

  type NonConformance {
    id: ID!
    title: String!
    description: String!
    severity: Severity!
    status: NCStatus!
    reportedById: String!
    reportedBy: User!
    correctiveActions: [CorrectiveAction!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type NonConformanceList {
    data: [NonConformance!]!
    pagination: PaginationInfo!
  }

  input CreateNonConformanceInput {
    title: String!
    description: String!
    severity: Severity
  }

  input UpdateNonConformanceInput {
    title: String
    description: String
    severity: Severity
    status: NCStatus
  }

  extend type Query {
    nonConformances(
      pagination: PaginationInput
      status: NCStatus
      severity: Severity
      reportedById: String
    ): NonConformanceList!
    nonConformance(id: ID!): NonConformance!
  }

  extend type Mutation {
    createNonConformance(input: CreateNonConformanceInput!): NonConformance!
    updateNonConformance(id: ID!, input: UpdateNonConformanceInput!): NonConformance!
    closeNonConformance(id: ID!): NonConformance!
  }
`;
