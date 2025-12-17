/**
 * Fix Script: Set all jobs to archived = 'false'
 */

const { Pool } = require('pg');

const NEON_URL = process.env.NEON_DATABASE_URL;

async function fix() {
  if (!NEON_URL) {
    console.error('❌ Set NEON_DATABASE_URL');
    process.exit(1);
  }

  console.log('🔗 Connecting to Neon...');
  const pool = new Pool({ connectionString: NEON_URL, ssl: { rejectUnauthorized: false } });

  try {
    // Check current status
    const before = await pool.query(`SELECT archived, count(*) FROM jobs GROUP BY archived`);
    console.log('📊 Current distribution:', before.rows);

    // Update
    console.log('📝 Updating all jobs to archived = "false"...');
    const result = await pool.query(`UPDATE jobs SET archived = 'false'`);
    console.log(`✅ Updated ${result.rowCount} jobs`);

    // Verify
    const after = await pool.query(`SELECT archived, count(*) FROM jobs GROUP BY archived`);
    console.log('📊 New distribution:', after.rows);

  } catch (e) {
    console.error('❌ Error:', e);
  } finally {
    await pool.end();
  }
}

fix();





