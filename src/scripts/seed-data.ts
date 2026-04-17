import prisma from '../config/database';
import { hashPassword } from '../shared/utils/password';
import logger from '../config/logger';

async function seed() {
  try {
    logger.info('Seeding test data...');

    // Create test user
    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        id: 'test-user-001',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: await hashPassword('password123'),
        role: 'ADMIN',
      },
    });

    logger.info(`✓ Test user created: ${user.email}`);

    // Create test document
    const document = await prisma.document.upsert({
      where: { id: 'doc-001' },
      update: {},
      create: {
        id: 'doc-001',
        title: 'Test Document',
        content: 'This is a test document for CRUD operations',
        status: 'APPROVED',
        version: 1,
        createdById: user.id,
      },
    });

    logger.info(`✓ Test document created: ${document.title}`);
    logger.info('Seeding complete!');
  } catch (error) {
    logger.error('Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
