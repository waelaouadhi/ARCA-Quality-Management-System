import prisma from '@/config/database';

export interface TestAuthUser {
  userId: string;
  email: string;
  role: string;
}

export async function resetDatabase(): Promise<void> {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations';
  `;

  if (tables.length === 0) {
    return;
  }

  const tableList = tables.map((t) => `"${t.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);
}

export async function ensureUsers(users: TestAuthUser[]): Promise<void> {
  await Promise.all(
    users.map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: {
          id: user.userId,
          role: user.role as 'ADMIN' | 'MANAGER' | 'USER',
        },
        create: {
          id: user.userId,
          email: user.email,
          firstName: user.role,
          lastName: 'TestUser',
          password: 'hashed-password',
          role: user.role as 'ADMIN' | 'MANAGER' | 'USER',
        },
      })
    )
  );
}
