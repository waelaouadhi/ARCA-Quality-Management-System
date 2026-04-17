export const auditTypeDefs = `#graphql
  type AuditTemplate {
    id: String!
    name: String!
    description: String
    createdAt: String!
    updatedAt: String!
  }

  type AuditQuestion {
    id: String!
    templateId: String!
    question: String!
    type: String!
    required: Boolean!
  }

  type AuditFinding {
    id: String!
    auditId: String!
    description: String!
    severity: String!
    status: String!
    linkedCapaId: String
    capaAutoCreated: Boolean
    createdAt: String!
    updatedAt: String!
  }

  type Audit {
    id: String!
    auditNumber: String!
    title: String!
    description: String
    auditType: String!
    auditScope: String!
    auditDate: String!
    status: String!
    templateId: String
    template: AuditTemplate
    findings: [AuditFinding!]!
    createdBy: User!
    createdAt: String!
    updatedAt: String!
    completedAt: String
  }

  type AuditPayload {
    success: Boolean!
    message: String
    data: Audit
  }

  type AuditsPayload {
    success: Boolean!
    message: String
    data: [Audit!]
    total: Int!
    skip: Int!
    take: Int!
  }

  type FindingPayload {
    success: Boolean!
    message: String
    data: AuditFinding
  }

  type TemplatePayload {
    success: Boolean!
    message: String
    data: AuditTemplate
  }

  type TemplatesPayload {
    success: Boolean!
    message: String
    data: [AuditTemplate!]
  }

  extend type Query {
    getAudits(skip: Int, take: Int, status: String, auditType: String): AuditsPayload!
    getAuditById(id: String!): AuditPayload!
    getAuditTemplates: TemplatesPayload!
  }

  extend type Mutation {
    createAudit(
      title: String!
      description: String
      auditType: String!
      auditScope: String!
      auditDate: String!
      templateId: String
      auditTeamIds: [String!]
    ): AuditPayload!

    updateAudit(
      id: String!
      title: String
      description: String
      status: String
    ): AuditPayload!

    createAuditFinding(
      auditId: String!
      description: String!
      severity: String!
    ): FindingPayload!

    createAuditTemplate(
      name: String!
      description: String
      questions: [String!]
    ): TemplatePayload!
  }
`;
