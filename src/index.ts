import * as moduleAlias from 'module-alias';
import { resolve } from 'path';

// Register path aliases BEFORE any other imports (production only)
if (process.env.NODE_ENV !== 'development') {
  const baseDir = resolve(__dirname);
  moduleAlias.addAliases({
    '@': baseDir,
    '@config': resolve(baseDir, 'config'),
    '@modules': resolve(baseDir, 'modules'),
    '@shared': resolve(baseDir, 'shared'),
    '@middlewares': resolve(baseDir, 'middlewares'),
  });
}

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
import { getMetricsContentType, getMetricsSnapshot, metricsMiddleware } from '@/shared/utils/metrics';

async function startServer() {
  const app = express();

  const server = new ApolloServer<AuthContext>({
    typeDefs,
    resolvers,
    formatError,
    introspection: true,
    csrfPrevention: config.app.env === 'production',
  });

  await server.start();

  const configuredOrigins = config.cors.origin
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  const allowedOrigins = new Set(configuredOrigins);
  for (const origin of configuredOrigins) {
    if (origin.startsWith('http://')) {
      allowedOrigins.add(origin.replace('http://', 'https://'));
    }
    if (origin.startsWith('https://')) {
      allowedOrigins.add(origin.replace('https://', 'http://'));
    }
    if (origin.includes('127.0.0.1')) {
      allowedOrigins.add(origin.replace('127.0.0.1', 'localhost'));
    }
    if (origin.includes('localhost')) {
      allowedOrigins.add(origin.replace('localhost', '127.0.0.1'));
    }
  }

  if (allowedOrigins.size === 0) {
    allowedOrigins.add('http://127.0.0.1:8080');
    allowedOrigins.add('http://localhost:8080');
    allowedOrigins.add('https://127.0.0.1:8080');
    allowedOrigins.add('https://localhost:8080');
  }
  allowedOrigins.add(`http://localhost:${config.app.port}`);
  allowedOrigins.add(`http://127.0.0.1:${config.app.port}`);
  allowedOrigins.add(`https://localhost:${config.app.port}`);
  allowedOrigins.add(`https://127.0.0.1:${config.app.port}`);
  allowedOrigins.add('https://studio.apollographql.com');

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(metricsMiddleware);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/metrics', async (_req, res) => {
    try {
      res.setHeader('Content-Type', getMetricsContentType());
      res.send(await getMetricsSnapshot());
    } catch (error) {
      logger.error('Failed to render metrics endpoint', error);
      res.status(500).json({ error: 'failed_to_render_metrics' });
    }
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
