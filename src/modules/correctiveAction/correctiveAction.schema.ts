export const correctiveActionTypeDefs = `#graphql
  enum ActionStatus {
    PENDING
    IN_PROGRESS
    DONE
  }

  type CorrectiveAction {
    id: ID!
    action: String!
    status: ActionStatus!
    nonConformanceId: String!
    nonConformance: NonConformance!
    assignedToId: String
    assignedTo: User
    dueDate: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type CorrectiveActionList {
    data: [CorrectiveAction!]!
    pagination: PaginationInfo!
  }

  input CreateCorrectiveActionInput {
    action: String!
    nonConformanceId: String!
    assignedToId: String
    dueDate: DateTime
  }

  input UpdateCorrectiveActionInput {
    action: String
    assignedToId: String
    dueDate: DateTime
    status: ActionStatus
  }

  extend type Query {
    correctiveActions(
      pagination: PaginationInput
      status: ActionStatus
      nonConformanceId: String
      assignedToId: String
    ): CorrectiveActionList!
    correctiveAction(id: ID!): CorrectiveAction!
  }

  extend type Mutation {
    createCorrectiveAction(input: CreateCorrectiveActionInput!): CorrectiveAction!
    updateCorrectiveAction(id: ID!, input: UpdateCorrectiveActionInput!): CorrectiveAction!
    completeCorrectiveAction(id: ID!): CorrectiveAction!
  }
`;
