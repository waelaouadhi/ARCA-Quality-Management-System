export const baseTypeDefs = `#graphql
  scalar DateTime

  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }

  type Subscription {
    _empty: String
  }
`;

export const baseResolvers = {
  Query: {
    _empty: () => 'GraphQL server is running',
  },
  Mutation: {
    _empty: () => 'Mutations ready',
  },
};
