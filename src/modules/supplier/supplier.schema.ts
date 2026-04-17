export const supplierTypeDefs = `#graphql
  type Supplier {
    id: ID!
    supplierNumber: String!
    supplierCode: String
    name: String!
    description: String
    category: String!
    status: String!
    primaryContact: String
    phone: String
    email: String
    website: String
    ratingScore: Float!
    qualityRating: Float
    complianceScore: Float!
    deliveryRating: Float
    riskLevel: String
    notes: String
    lastAuditDate: String
    lastAuditScore: Float
    createdAt: String!
    updatedAt: String!
  }

  type SupplierContact {
    id: ID!
    name: String!
    role: String!
    email: String!
    phone: String
    createdAt: String!
  }

  type SupplierAudit {
    id: ID!
    auditNumber: String!
    auditDate: String!
    auditType: String!
    auditScore: Float!
    status: String!
    createdAt: String!
    updatedAt: String!
  }

  type SupplierAuditFinding {
    id: ID!
    severity: String!
    description: String!
    evidence: String
    createdAt: String!
  }

  type SupplierEvaluation {
    id: ID!
    evaluationDate: String!
    qualityScore: Float!
    deliveryScore: Float!
    priceScore: Float!
    overallScore: Float!
    notes: String
    createdAt: String!
  }

  type SupplierIssue {
    id: ID!
    description: String!
    severity: String!
    status: String!
    createdAt: String!
    updatedAt: String!
  }

  type SupplierStatistics {
    totalSuppliers: Int!
    activeSuppliers: Int!
    suspendedSuppliers: Int!
    avgRating: Float!
  }

  type SupplierPayload {
    success: Boolean!
    message: String
    data: Supplier
  }

  type SuppliersPayload {
    success: Boolean!
    message: String
    data: [Supplier!]
    total: Int!
  }

  type SupplierContactPayload {
    success: Boolean!
    message: String
    data: SupplierContact
  }

  type SupplierAuditPayload {
    success: Boolean!
    message: String
    data: SupplierAudit
  }

  type SupplierAuditFindingPayload {
    success: Boolean!
    message: String
    data: SupplierAuditFinding
  }

  type SupplierEvaluationPayload {
    success: Boolean!
    message: String
    data: SupplierEvaluation
  }

  type SupplierIssuePayload {
    success: Boolean!
    message: String
    data: SupplierIssue
  }

  extend type Query {
    supplier(id: ID!): SupplierPayload!
    suppliers(skip: Int, take: Int): SuppliersPayload!
    suppliersByCategory(category: String!, skip: Int, take: Int): SuppliersPayload!
    suppliersByStatus(status: String!, skip: Int, take: Int): SuppliersPayload!
    supplierContacts(supplierId: ID!): SupplierContactPayload!
    supplierAudits(supplierId: ID!, skip: Int, take: Int): SuppliersPayload!
    supplierAuditFindings(auditId: ID!): [SupplierAuditFinding!]!
    supplierEvaluations(supplierId: ID!, skip: Int, take: Int): SuppliersPayload!
    supplierIssues(supplierId: ID!, skip: Int, take: Int): SuppliersPayload!
    topSuppliers(limit: Int): SuppliersPayload!
    lowPerformingSuppliers(complianceThreshold: Int, limit: Int): SuppliersPayload!
    supplierStatistics: SupplierStatistics!
  }

  extend type Mutation {
    createSupplier(
      name: String!
      description: String
      category: String!
      primaryContact: String
      phone: String
      email: String
      code: String
      address: String
      website: String
    ): SupplierPayload!

    updateSupplier(
      id: ID!
      name: String
      description: String
      category: String
      status: String
      primaryContact: String
      phone: String
      email: String
      website: String
      ratingScore: Float
      qualityRating: Float
      complianceScore: Float
      deliveryRating: Float
      riskLevel: String
      notes: String
    ): SupplierPayload!

    deleteSupplier(id: ID!): Boolean!

    addSupplierContact(
      supplierId: ID!
      name: String!
      role: String!
      email: String!
      phone: String
    ): SupplierContactPayload!

    createSupplierAudit(
      supplierId: ID!
      auditDate: String!
      auditType: String!
      auditScore: Float!
    ): SupplierAuditPayload!

    addAuditFinding(
      auditId: ID!
      severity: String!
      description: String!
      evidence: String
    ): SupplierAuditFindingPayload!

    createSupplierEvaluation(
      supplierId: ID!
      evaluationDate: String!
      qualityScore: Float!
      deliveryScore: Float!
      priceScore: Float!
      notes: String
    ): SupplierEvaluationPayload!

    createSupplierIssue(
      supplierId: ID!
      auditId: ID
      description: String!
      severity: String!
    ): SupplierIssuePayload!

    updateSupplierIssueStatus(
      issueId: ID!
      status: String!
    ): SupplierIssuePayload!

    linkSupplierIssueToCAPA(
      issueId: ID!
      capaId: ID!
    ): SupplierIssuePayload!
  }
`;
