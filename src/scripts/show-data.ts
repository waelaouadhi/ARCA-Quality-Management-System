import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('\n📊 QUERYING DATABASE DATA\n');
    
    // Get counts
    const userCount = await prisma.user.count();
    const auditCount = await prisma.auditLog.count();
    const docCount = await prisma.document.count();
    
    console.log('═'.repeat(80));
    console.log('📈 RECORD COUNTS');
    console.log('═'.repeat(80));
    console.log(`\n  Users:               ${userCount || '0'}`);
    console.log(`  Documents:           ${docCount || '0'}`);
    console.log(`  AuditLogs:           ${auditCount || '0'}`);
    
    // Show sample users
    if (userCount > 0) {
      console.log('\n' + '═'.repeat(80));
      console.log('👥 SAMPLE USERS (First 5)');
      console.log('═'.repeat(80));
      
      const users = await prisma.user.findMany({ take: 5 });
      users.forEach((u, i) => {
        console.log(`\n  ${i + 1}. ${u.firstName} ${u.lastName}`);
        console.log(`     Email: ${u.email}`);
        console.log(`     Role: ${u.role}`);
        console.log(`     Created: ${new Date(u.createdAt).toLocaleDateString()}`);
      });
    }
    
    // Show sample Documents
    if (docCount > 0) {
      console.log('\n' + '═'.repeat(80));
      console.log('📄 SAMPLE DOCUMENTS (First 3)');
      console.log('═'.repeat(80));
      
      const docs = await prisma.document.findMany({ take: 3 });
      docs.forEach((d, i) => {
        console.log(`\n  ${i + 1}. ${d.title}`);
        console.log(`     Version: ${d.version}`);
        console.log(`     Status: ${d.status}`);
        console.log(`     Created: ${new Date(d.createdAt).toLocaleDateString()}`);
      });
    }
    
    // Raw query to show actual table structure
    console.log('\n' + '═'.repeat(80));
    console.log('🔍 ACTUAL DATABASE TABLE STRUCTURE');
    console.log('═'.repeat(80));
    
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    (tables as any[]).forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.table_name}`);
    });
    
    console.log('\n' + '═'.repeat(80));
    console.log('⚠️  NOTE: Escalation tables not yet deployed');
    console.log('═'.repeat(80));
    console.log('\nTo add escalation system:');
    console.log('  $ npx prisma migrate dev --name add_escalation_system');
    console.log('\nThis will add 5 more tables:');
    console.log('  • SLARule');
    console.log('  • NonConformanceEscalation');
    console.log('  • CorrectiveActionEscalation');
    console.log('  • EscalationHistory');
    console.log('  • Notification\n');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
