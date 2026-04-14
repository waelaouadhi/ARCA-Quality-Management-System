export const workflowTypeDefs = `
  extend type Query {
    getAvailableTransitions(instanceId: String!): [String!]!
    getWorkflowInstance(instanceId: String!): WorkflowInstancePayload
    getWorkflowHistory(resourceType: String!, resourceId: String!): [WorkflowEventPayload!]!
  }

  extend type Mutation {
    transitionWorkflow(instanceId: String!, targetStepId: String!, comment: String): WorkflowInstancePayload!
  }

  type WorkflowInstancePayload {
    id: String!
    workflowId: String!
    resourceType: String!
    resourceId: String!
    currentStepId: String
    status: String!
    contextData: String
    startedAt: String!
    completedAt: String
  }

  type WorkflowEventPayload {
    id: String!
    instanceId: String!
    eventType: String!
    fromStep: String
    toStep: String
    performedBy: String!
    performedAt: String!
    comment: String
  }
`;
