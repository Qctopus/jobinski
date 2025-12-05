/**
 * Migration Script: Azure PostgreSQL → Neon
 * 
 * This script copies all jobs from your Azure database to Neon.
 * 
 * Usage:
 *   1. Set NEON_DATABASE_URL environment variable (from Neon dashboard)
 *   2. Run: node scripts/migrate-to-neon.js
 */

const { Pool } = require('pg');

// Azure PostgreSQL connection (from your .env)
const AZURE_CONFIG = {
  host: 'untalent-new-db-server.postgres.database.azure.com',
  port: 5432,
  database: 'untalent',
  user: 'readonly_chris',
  password: process.env.AZURE_DB_PASSWORD, // Set this!
  ssl: { rejectUnauthorized: false }
};

// Neon connection (set NEON_DATABASE_URL from Neon dashboard)
const NEON_URL = process.env.NEON_DATABASE_URL;

async function migrate() {
  if (!AZURE_CONFIG.password) {
    console.error('❌ Error: Set AZURE_DB_PASSWORD environment variable');
    console.log('   Run: $env:AZURE_DB_PASSWORD="your-password"');
    process.exit(1);
  }

  if (!NEON_URL) {
    console.error('❌ Error: Set NEON_DATABASE_URL environment variable');
    console.log('   Get it from Neon dashboard → Connection string');
    console.log('   Run: $env:NEON_DATABASE_URL="postgresql://..."');
    process.exit(1);
  }

  console.log('🔗 Connecting to Azure PostgreSQL...');
  const azurePool = new Pool(AZURE_CONFIG);
  
  console.log('🔗 Connecting to Neon...');
  const neonPool = new Pool({ connectionString: NEON_URL, ssl: { rejectUnauthorized: false } });

  try {
    // Test connections
    await azurePool.query('SELECT 1');
    console.log('✅ Azure connection OK');
    
    await neonPool.query('SELECT 1');
    console.log('✅ Neon connection OK');

    // Get count from Azure
    const countResult = await azurePool.query('SELECT COUNT(*) FROM jobs');
    const totalJobs = parseInt(countResult.rows[0].count);
    console.log(`📊 Found ${totalJobs} jobs in Azure`);

    // Create table in Neon (if not exists)
    console.log('📝 Creating jobs table in Neon...');
    await neonPool.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        url TEXT,
        title TEXT,
        description TEXT,
        duty_station TEXT,
        duty_country TEXT,
        duty_continent TEXT,
        country_code TEXT,
        eligible_nationality TEXT,
        hs_min_exp TEXT,
        bachelor_min_exp TEXT,
        master_min_exp TEXT,
        up_grade TEXT,
        pipeline TEXT,
        department TEXT,
        long_agency TEXT,
        short_agency TEXT,
        posting_date TEXT,
        apply_until TEXT,
        languages TEXT,
        uniquecode TEXT,
        ideal_candidate TEXT,
        job_labels TEXT,
        job_labels_vectorized TEXT,
        job_candidate_vectorized TEXT,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        archived BOOLEAN DEFAULT false,
        sectoral_category TEXT,
        primary_category VARCHAR(100),
        secondary_categories JSONB,
        classification_confidence DECIMAL(5,2),
        classification_reasoning JSONB,
        is_user_corrected BOOLEAN DEFAULT false,
        user_corrected_by VARCHAR(100),
        user_corrected_at TIMESTAMP,
        classified_at TIMESTAMP,
        is_ambiguous_category BOOLEAN DEFAULT false,
        emerging_terms_found JSONB
      )
    `);
    console.log('✅ Table created');

    // Check if Neon already has data
    const neonCountResult = await neonPool.query('SELECT COUNT(*) FROM jobs');
    const existingCount = parseInt(neonCountResult.rows[0].count);
    if (existingCount > 0) {
      console.log(`⚠️  Neon already has ${existingCount} jobs`);
      console.log('   Skipping to avoid duplicates. Delete existing data first if you want to re-import.');
      console.log('   To clear: DELETE FROM jobs;');
      process.exit(0);
    }

    // Migrate in batches
    const batchSize = 500;
    let offset = 0;
    let migrated = 0;

    console.log('🚀 Starting migration...');

    while (offset < totalJobs) {
      // Fetch batch from Azure
      const result = await azurePool.query(`
        SELECT * FROM jobs ORDER BY id LIMIT $1 OFFSET $2
      `, [batchSize, offset]);

      if (result.rows.length === 0) break;

      // Insert into Neon
      for (const row of result.rows) {
        const columns = Object.keys(row);
        const values = Object.values(row);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        
        await neonPool.query(
          `INSERT INTO jobs (${columns.join(', ')}) VALUES (${placeholders})`,
          values
        );
        migrated++;
      }

      console.log(`   Migrated ${migrated}/${totalJobs} jobs...`);
      offset += batchSize;
    }

    console.log(`\n✅ Migration complete! ${migrated} jobs copied to Neon`);

    // Create indexes
    console.log('📑 Creating indexes...');
    await neonPool.query('CREATE INDEX IF NOT EXISTS idx_jobs_archived ON jobs(archived)');
    await neonPool.query('CREATE INDEX IF NOT EXISTS idx_jobs_short_agency ON jobs(short_agency)');
    await neonPool.query('CREATE INDEX IF NOT EXISTS idx_jobs_posting_date ON jobs(posting_date)');
    await neonPool.query('CREATE INDEX IF NOT EXISTS idx_jobs_apply_until ON jobs(apply_until)');
    console.log('✅ Indexes created');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await azurePool.end();
    await neonPool.end();
  }
}

migrate().catch(console.error);





