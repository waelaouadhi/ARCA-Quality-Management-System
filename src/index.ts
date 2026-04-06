import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware, ExpressContextFunctionArgument } from '@apollo/server/express4';
import cors from 'cors';
import config from './config';
import logger from './config/logger';
import prisma from './config/database';
import { typeDefs, resolvers } from './graphql';
import { formatError } from '@/shared/utils/errorHandler';
import { AuthContext } from '@/shared/types/context';
import { JWTPayload, verifyToken } from '@/shared/utils/jwt';

async function startServer() {
  const app = express();

  const server = new ApolloServer<AuthContext>({
    typeDefs,
    resolvers,
    formatError,
  });

  await server.start();

  app.use(cors({ origin: config.cors.origin }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use(
    '/graphql',
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }: ExpressContextFunctionArgument): Promise<AuthContext> => {
        const authHeader = req.headers.authorization || '';
        let user: JWTPayload | undefined;

        if (authHeader.startsWith('Bearer ')) {
          try {
            const token = authHeader.substring(7);
            user = verifyToken(token);
          } catch {
            // Invalid token
          }
        }

        return { user };
      },
    })
  );

  app.listen(config.app.port, () => {
    logger.info(`🚀 Server ready at http://localhost:${config.app.port}/graphql`);
    logger.info(`📊 Health check at http://localhost:${config.app.port}/health`);
    logger.info(`🌍 Environment: ${config.app.env}`);
  });

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await prisma.$disconnect();
    process.exit(0);
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
