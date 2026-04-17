import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import config from './config';
import logger from './config/logger';
import { authTypeDefs, authResolvers } from './modules/auth';
import { userTypeDefs, userResolvers } from './modules/user';
import { formatError } from './shared/utils/errorHandler';
import { verifyToken } from './shared/utils/jwt';

// Import Prisma with proper error handling
let prisma: any;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
} catch (error) {
  logger.warn('Prisma client initialization skipped - running in limited mode');
}

const baseTypeDefs = `#graphql
  scalar DateTime
  type Query { _empty: String }
  type Mutation { _empty: String }
`;

const baseResolvers = {
  Query: { _empty: () => 'QMS Server Running' },
  Mutation: { _empty: () => 'Mutations ready' },
};

const typeDefs = [baseTypeDefs, authTypeDefs, userTypeDefs];

const resolvers = {
  Query: {
    ...baseResolvers.Query,
    ...authResolvers.Query,
    ...userResolvers.Query,
  },
  Mutation: {
    ...baseResolvers.Mutation,
    ...authResolvers.Mutation,
    ...userResolvers.Mutation,
  },
};

async function startServer() {
  const app = express();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError,
  });

  await server.start();

  app.use(cors({ origin: config.cors.origin || '*' }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ 
      status: 'ok', 
      message: 'QMS Backend is operational',
      timestamp: new Date().toISOString(),
      env: config.app.env,
      database: prisma ? 'connected' : 'disconnected',
    });
  });

  // @ts-ignore
  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }: any) => {
      const authHeader = req.headers.authorization || '';
      let user: any = undefined;

      if (authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          user = verifyToken(token);
        } catch (error) {
          // Invalid token
        }
      }

      return { user };
    },
  }));

  app.listen(config.app.port, () => {
    logger.info(`Server ready at http://localhost:${config.app.port}/graphql`);
    logger.info(`Health check at http://localhost:${config.app.port}/health`);
    logger.info(`Environment: ${config.app.env}`);
    logger.info(`Database: ${prisma ? 'Connected' : 'Not configured'}`);
  });

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down');
    if (prisma) await prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down');
    if (prisma) await prisma.$disconnect();
    process.exit(0);
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
