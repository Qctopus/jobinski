/**
 * Push to Neon Script
 * Syncs data from local SQLite to Neon PostgreSQL
 * 
 * Usage: npm run push:neon
 */

import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import db from '../config/sqlite';

async function pushToNeon() {
  console.log('═'.repeat(60));
  console.log('🚀 Push to Neon - Sync local SQLite to Neon PostgreSQL');
  console.log('═'.repeat(60));

  const neonUrl = process.env.NEON_DATABASE_URL;
  
  if (!neonUrl) {
    console.error('❌ NEON_DATABASE_URL not found in .env file!');
    console.log('');
    console.log('Add this to your backend/.env file:');
    console.log('NEON_DATABASE_URL=postgresql://user:pass@your-host.neon.tech/neondb?sslmode=require');
    process.exit(1);
  }

  console.log('📍 Neon URL:', neonUrl.replace(/:[^:@]+@/, ':****@'));

  // Create Neon connection
  let neonPool: Pool;
  try {
    neonPool = new Pool({
      connectionString: neonUrl,
      ssl: { rejectUnauthorized: false },
      max: 5,
      connectionTimeoutMillis: 10000,
    });

    // Test connection
    const client = await neonPool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Connected to Neon successfully!');
  } catch (error: any) {
    console.error('❌ Failed to connect to Neon:', error.message);
    process.exit(1);
  }

  try {
    // Get all jobs from local SQLite
    console.log('');
    console.log('📊 Reading jobs from local SQLite...');
    const jobs = db.prepare('SELECT * FROM jobs').all() as any[];
    console.log(`   Found ${jobs.length} jobs in local database`);

    if (jobs.length === 0) {
      console.log('⚠️ No jobs to sync. Run sync first: npm run sync:dev');
      await neonPool.end();
      process.exit(0);
    }

    // Check if jobs table exists in Neon
    console.log('');
    console.log('📋 Checking Neon table structure...');
    const tableCheck = await neonPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'jobs'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('⚠️ Jobs table does not exist in Neon. Creating...');
      await createJobsTable(neonPool);
    }

    // Sync jobs to Neon
    console.log('');
    console.log('📤 Pushing jobs to Neon...');
    let updated = 0;
    let inserted = 0;
    let errors = 0;

    const BATCH_SIZE = 50;
    for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
      const batch = jobs.slice(i, i + BATCH_SIZE);
      
      for (const job of batch) {
        try {
          // Upsert: insert or update on conflict
          const result = await neonPool.query(`
            INSERT INTO jobs (
              id, title, description, job_labels, short_agency, long_agency,
              duty_station, duty_country, duty_continent, country_code,
              eligible_nationality, hs_min_exp, bachelor_min_exp, master_min_exp,
              up_grade, pipeline, department, posting_date, apply_until,
              url, languages, uniquecode, ideal_candidate, sectoral_category,
              archived, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
              $11, $12, $13, $14, $15, $16, $17, $18, $19,
              $20, $21, $22, $23, $24, $25, $26, $27
            )
            ON CONFLICT (id) DO UPDATE SET
              title = EXCLUDED.title,
              description = EXCLUDED.description,
              job_labels = EXCLUDED.job_labels,
              short_agency = EXCLUDED.short_agency,
              long_agency = EXCLUDED.long_agency,
              duty_station = EXCLUDED.duty_station,
              duty_country = EXCLUDED.duty_country,
              duty_continent = EXCLUDED.duty_continent,
              country_code = EXCLUDED.country_code,
              up_grade = EXCLUDED.up_grade,
              posting_date = EXCLUDED.posting_date,
              apply_until = EXCLUDED.apply_until,
              url = EXCLUDED.url,
              sectoral_category = EXCLUDED.sectoral_category,
              archived = EXCLUDED.archived,
              updated_at = NOW()
            RETURNING (xmax = 0) AS inserted
          `, [
            job.id,
            job.title || '',
            job.description || '',
            job.job_labels || '',
            job.short_agency || '',
            job.long_agency || '',
            job.duty_station || '',
            job.duty_country || '',
            job.duty_continent || '',
            job.country_code || '',
            job.eligible_nationality || '',
            job.hs_min_exp,
            job.bachelor_min_exp,
            job.master_min_exp,
            job.up_grade || '',
            job.pipeline || '',
            job.department || '',
            job.posting_date || null,
            job.apply_until || null,
            job.url || '',
            job.languages || '',
            job.uniquecode || '',
            job.ideal_candidate || '',
            job.primary_category || job.sectoral_category || '',
            job.archived ? true : false,
            new Date().toISOString(),
            new Date().toISOString()
          ]);

          if (result.rows[0]?.inserted) {
            inserted++;
          } else {
            updated++;
          }
        } catch (e: any) {
          errors++;
          if (errors <= 5) {
            console.warn(`   Error on job ${job.id}: ${e.message}`);
          }
        }
      }

      // Progress update
      const progress = Math.min(i + BATCH_SIZE, jobs.length);
      process.stdout.write(`\r   Progress: ${progress}/${jobs.length} (${Math.round(progress/jobs.length*100)}%)`);
    }

    console.log(''); // New line after progress
    console.log('');
    console.log('═'.repeat(60));
    console.log('✅ Push to Neon complete!');
    console.log(`   📥 Inserted: ${inserted}`);
    console.log(`   📝 Updated: ${updated}`);
    if (errors > 0) {
      console.log(`   ⚠️ Errors: ${errors}`);
    }
    console.log('═'.repeat(60));

    await neonPool.end();
    
  } catch (error: any) {
    console.error('❌ Push failed:', error.message);
    await neonPool.end();
    process.exit(1);
  }
}

async function createJobsTable(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      title TEXT,
      description TEXT,
      job_labels TEXT,
      short_agency VARCHAR(50),
      long_agency VARCHAR(255),
      duty_station VARCHAR(255),
      duty_country VARCHAR(100),
      duty_continent VARCHAR(50),
      country_code VARCHAR(10),
      eligible_nationality TEXT,
      hs_min_exp INTEGER,
      bachelor_min_exp INTEGER,
      master_min_exp INTEGER,
      up_grade VARCHAR(50),
      pipeline VARCHAR(100),
      department VARCHAR(255),
      posting_date TIMESTAMP,
      apply_until TIMESTAMP,
      url TEXT,
      languages TEXT,
      uniquecode VARCHAR(100),
      ideal_candidate TEXT,
      sectoral_category VARCHAR(100),
      archived BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('✅ Jobs table created in Neon');
}

pushToNeon();

