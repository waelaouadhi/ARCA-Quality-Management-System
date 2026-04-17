import { PrismaClient, Prisma } from '@prisma/client';
import logger from './logger';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

// Log queries in development
prisma.$on('query', (e: Prisma.QueryEvent) => {
  logger.debug('Query: ' + e.query);
  logger.debug('Duration: ' + e.duration + 'ms');
});

prisma.$on('error', (e: Prisma.LogEvent) => {
  logger.error('Prisma Error: ' + e.message);
});

export default prisma;
