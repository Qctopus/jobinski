/**
 * Migration Script: Local SQLite → Neon PostgreSQL
 */

const { Pool } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');

const SQLITE_PATH = path.join(__dirname, '..', 'backend', 'data', 'jobs_cache.db');
const NEON_URL = process.env.NEON_DATABASE_URL;

async function migrate() {
  if (!NEON_URL) {
    console.error('❌ Set NEON_DATABASE_URL');
    process.exit(1);
  }

  console.log(`📂 Opening SQLite: ${SQLITE_PATH}`);
  const sqliteDb = new Database(SQLITE_PATH, { readonly: true });
  console.log('✅ SQLite OK');
  
  console.log('🔗 Connecting to Neon...');
  const neonPool = new Pool({ connectionString: NEON_URL, ssl: { rejectUnauthorized: false } });
  await neonPool.query('SELECT 1');
  console.log('✅ Neon OK');

  try {
    const countResult = sqliteDb.prepare('SELECT COUNT(*) as total FROM jobs').get();
    const totalJobs = countResult.total;
    console.log(`📊 Found ${totalJobs} jobs`);

    // Drop and create table with TEXT columns (safest)
    console.log('📝 Creating table...');
    await neonPool.query('DROP TABLE IF EXISTS jobs CASCADE');
    
    const cols = sqliteDb.prepare('PRAGMA table_info(jobs)').all();
    const colDefs = cols.map(c => `"${c.name}" TEXT`).join(', ');
    await neonPool.query(`CREATE TABLE jobs (${colDefs})`);
    console.log('✅ Table created');

    // Migrate
    const batchSize = 200;
    let offset = 0;
    let migrated = 0;

    console.log('🚀 Migrating...');

    while (offset < totalJobs) {
      const rows = sqliteDb.prepare(`SELECT * FROM jobs LIMIT ? OFFSET ?`).all(batchSize, offset);
      if (rows.length === 0) break;

      for (const row of rows) {
        const columns = Object.keys(row);
        const values = columns.map(k => {
          const v = row[k];
          if (v === null || v === undefined || v === 'null') return null;
          return String(v);
        });
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const colNames = columns.map(c => `"${c}"`).join(', ');
        
        await neonPool.query(`INSERT INTO jobs (${colNames}) VALUES (${placeholders})`, values);
        migrated++;
      }

      process.stdout.write(`\r   ${migrated}/${totalJobs} jobs...`);
      offset += batchSize;
    }

    console.log(`\n✅ Migrated ${migrated} jobs!`);

    console.log('📑 Creating indexes...');
    await neonPool.query('CREATE INDEX IF NOT EXISTS idx_jobs_archived ON jobs(archived)');
    await neonPool.query('CREATE INDEX IF NOT EXISTS idx_jobs_short_agency ON jobs(short_agency)');
    await neonPool.query('CREATE INDEX IF NOT EXISTS idx_jobs_posting_date ON jobs(posting_date)');
    await neonPool.query('CREATE INDEX IF NOT EXISTS idx_jobs_apply_until ON jobs(apply_until)');
    console.log('✅ Indexes created');

    console.log('\n🎉 Done! Add DATABASE_URL to Vercel and redeploy.');

  } finally {
    sqliteDb.close();
    await neonPool.end();
  }
}

migrate().catch(e => { console.error('❌', e.message); process.exit(1); });
