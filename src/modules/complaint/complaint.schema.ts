export const complaintTypeDefs = `#graphql
  type Complaint {
    id: ID!
    complaintNumber: String!
    title: String!
    description: String!
    category: String!
    source: String!
    severity: String!
    status: String!
    reportedDate: String!
    customerName: String
    customerEmail: String
    customerPhone: String
    findings: String
    rootCause: String
    riskAutoCreated: Boolean!
    capaAutoCreated: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type ComplaintInvestigation {
    id: ID!
    status: String!
    startDate: String!
    endDate: String
    methodology: String
    findings: String
    recommendation: String
  }

  type ComplaintAttachment {
    id: ID!
    filename: String!
    fileUrl: String!
    fileType: String!
    fileSize: Int!
    uploadedAt: String!
    description: String
  }

  type ComplaintStatistics {
    total: Int!
    open: Int!
    high: Int!
    critical: Int!
  }

  type ComplaintPayload {
    success: Boolean!
    message: String
    data: Complaint
  }

  type ComplaintsPayload {
    success: Boolean!
    message: String
    data: [Complaint!]
    total: Int!
  }

  type InvestigationPayload {
    success: Boolean!
    message: String
    data: ComplaintInvestigation
  }

  type AttachmentPayload {
    success: Boolean!
    message: String
    data: ComplaintAttachment
  }

  extend type Query {
    complaint(id: ID!): ComplaintPayload!
    complaints(skip: Int, take: Int): ComplaintsPayload!
    complaintsByStatus(status: String!, skip: Int, take: Int): ComplaintsPayload!
    complaintsBySeverity(severity: String!, skip: Int, take: Int): ComplaintsPayload!
    complaintAttachments(complaintId: ID!): [ComplaintAttachment!]!
    complaintStatistics: ComplaintStatistics!
  }

  extend type Mutation {
    createComplaint(
      title: String!
      description: String!
      category: String!
      source: String!
      severity: String
      reportedDate: String!
      customerName: String
      customerEmail: String
      customerPhone: String
      reportedBy: String
    ): ComplaintPayload!

    updateComplaint(
      id: ID!
      title: String
      status: String
      findings: String
      rootCause: String
    ): ComplaintPayload!

    startInvestigation(
      complaintId: ID!
      methodology: String
      immediateActions: String
    ): InvestigationPayload!

    closeInvestigation(
      complaintId: ID!
      findings: String!
    ): ComplaintPayload!

    addComplaintAttachment(
      complaintId: ID!
      filename: String!
      fileUrl: String!
      fileType: String!
      fileSize: Int!
      description: String
    ): AttachmentPayload!

    linkComplaintToRisk(
      complaintId: ID!
      riskId: ID!
    ): ComplaintPayload!

    deleteComplaint(id: ID!): Boolean!
  }
`;
