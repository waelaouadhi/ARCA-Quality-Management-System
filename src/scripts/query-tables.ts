import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔌 Connecting to PostgreSQL...\n');
    
    // Test connection
    const result = await prisma.$queryRaw`SELECT version();`;
    console.log('✅ PostgreSQL Connected!');
    console.log('📊 Version:', (result as any)[0].version);
    console.log('\n' + '═'.repeat(80));
    
    // Get all tables
    console.log('\n📋 TABLES IN DATABASE:\n');
    
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    if ((tables as any[]).length === 0) {
      console.log('ℹ️  No tables yet. Run migration first:\n');
      console.log('   npx prisma migrate dev --name add_escalation_system\n');
    } else {
      (tables as any[]).forEach((t, i) => {
        console.log(`  ${i + 1}. ${t.table_name}`);
      });
      
      console.log('\n' + '═'.repeat(80));
      console.log('\n🔍 TABLE DETAILS:\n');
      
      // Get table info
      for (const table of (tables as any[])) {
        const columns = await prisma.$queryRaw`
          SELECT 
            column_name,
            data_type,
            is_nullable
          FROM information_schema.columns
          WHERE table_name = ${table.table_name}
          ORDER BY ordinal_position;
        `;
        
        console.log(`\n📌 ${table.table_name}`);
        console.log('   ' + '─'.repeat(70));
        
        (columns as any[]).forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'nullable' : 'required';
          console.log(`   • ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} [${nullable}]`);
        });
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Possible causes:');
    console.error('   • PostgreSQL is not running');
    console.error('   • Database connection string is invalid');
    console.error('   • Database does not exist');
    console.error('\n📌 Current DATABASE_URL:');
    console.error('   ' + process.env.DATABASE_URL);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
