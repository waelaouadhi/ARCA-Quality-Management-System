export const documentTypeDefs = `#graphql
  enum DocStatus {
    DRAFT
    REVIEW
    APPROVED
    ARCHIVED
  }

  type Document {
    id: ID!
    title: String!
    content: String
    version: Int!
    status: DocStatus!
    createdById: String!
    createdBy: User!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type DocumentList {
    data: [Document!]!
    pagination: PaginationInfo!
  }

  input CreateDocumentInput {
    title: String!
    content: String
  }

  input UpdateDocumentInput {
    title: String
    content: String
    version: Int
    status: DocStatus
  }

  extend type Query {
    documents(pagination: PaginationInput, status: DocStatus): DocumentList!
    document(id: ID!): Document!
  }

  extend type Mutation {
    createDocument(input: CreateDocumentInput!): Document!
    updateDocument(id: ID!, input: UpdateDocumentInput!): Document!
    archiveDocument(id: ID!): Document!
  }
`;
