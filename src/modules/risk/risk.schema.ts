export const riskTypeDefs = `#graphql
  type RiskControl {
    id: String!
    riskId: String!
    name: String!
    controlType: String!
    description: String
    effectivenessRating: Int
    status: String!
    createdAt: String!
    updatedAt: String!
  }

  type RiskAssessment {
    id: String!
    riskId: String!
    probability: Int!
    impact: Int!
    overallRisk: Int!
    assessmentDate: String!
    assessor: User!
    createdAt: String!
  }

  type Risk {
    id: String!
    riskNumber: String!
    title: String!
    description: String
    riskType: String!
    process: String!
    status: String!
    inherentProbability: Int!
    inherentImpact: Int!
    inherentRisk: Int
    residualProbability: Int
    residualImpact: Int
    residualRisk: Int
    owner: User
    controls: [RiskControl!]!
    assessments: [RiskAssessment!]!
    createdBy: User!
    createdAt: String!
    updatedAt: String!
  }

  type RiskPayload {
    success: Boolean!
    message: String
    data: Risk
  }

  type RisksPayload {
    success: Boolean!
    message: String
    data: [Risk!]
    total: Int!
    skip: Int!
    take: Int!
  }

  type ControlPayload {
    success: Boolean!
    message: String
    data: RiskControl
  }

  type AssessmentPayload {
    success: Boolean!
    message: String
    data: RiskAssessment
  }

  extend type Query {
    getRisks(skip: Int, take: Int, status: String, riskType: String): RisksPayload!
    getRiskById(id: String!): RiskPayload!
    getRiskControls(riskId: String!): [RiskControl!]!
    getRiskAssessments(riskId: String!): [RiskAssessment!]!
  }

  extend type Mutation {
    createRisk(
      title: String!
      description: String
      riskType: String!
      process: String!
      inherentProbability: Int!
      inherentImpact: Int!
      ownerId: String
    ): RiskPayload!

    updateRisk(
      id: String!
      title: String
      description: String
      status: String
      residualProbability: Int
      residualImpact: Int
      ownerId: String
    ): RiskPayload!

    createRiskControl(
      riskId: String!
      name: String!
      controlType: String!
      description: String
    ): ControlPayload!

    createRiskAssessment(
      riskId: String!
      probability: Int!
      impact: Int!
    ): AssessmentPayload!
  }
`;
