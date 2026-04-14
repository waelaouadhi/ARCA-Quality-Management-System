export const dashboardTypeDefs = `#graphql
  type SeverityBreakdown {
    severity: String!
    count: Int!
    percentage: Float!
  }

  type ExecutiveDashboard {
    openNCCount: Int!
    overdueNCPercentage: Float!
    ncBySeverity: [SeverityBreakdown!]!
    capaCompletionRate: Float!
    overdueCAPA Percentage: Float!
    slaViolations: Int!
    docsAwaitingReview: Int!
    activeEscalations: Int!
    generatedAt: DateTime!
  }

  extend type Query {
    getDashboard: ExecutiveDashboard!
  }

  extend type Mutation {
    refreshDashboardMetrics: ExecutiveDashboard!
  }
`;
