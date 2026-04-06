import express, { Express } from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import cors from 'cors';
import config from './config';

const typeDefs = `#graphql
  type Query {
    hello: String!
    health: String!
    version: String!
  }

  type Mutation {
    echo(message: String!): String!
  }
`;

const resolvers = {
  Query: {
    hello: () => 'QMS Backend is running!',
    health: () => 'Server is healthy and operational',
    version: () => '1.0.0',
  },
  Mutation: {
    echo: (_: unknown, { message }: { message: string }) => `Echo: ${message}`,
  },
};

export async function createDemoApp(): Promise<Express> {
  const app = express();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    plugins: [
      ApolloServerPluginLandingPageLocalDefault({
        embed: true,
        includeCookies: true,
      }),
    ],
  });

  await server.start();

  app.use(cors({ origin: config.cors.origin || '*' }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      message: 'QMS Backend is running',
      timestamp: new Date().toISOString(),
      env: config.app.env,
    });
  });

  app.use(
    '/graphql',
    express.json(),
    (req, _res, next) => {
      if (req.body === undefined) req.body = {};
      next();
    },
    // @ts-ignore Apollo + Express type mismatch in this setup
    expressMiddleware(server)
  );

  return app;
}
