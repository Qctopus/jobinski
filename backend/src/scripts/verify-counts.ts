import pool from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

async function verifyUniqueCounts(): Promise<void> {
  console.log('📊 Verifying job counts in PostgreSQL database...\n');

  try {
    // Total jobs
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM jobs');
    const totalJobs = parseInt(totalResult.rows[0].total);
    
    // Unique URLs (non-null, non-empty)
    const uniqueUrlResult = await pool.query(`
      SELECT COUNT(DISTINCT url) as unique_urls 
      FROM jobs 
      WHERE url IS NOT NULL AND url != ''
    `);
    const uniqueUrls = parseInt(uniqueUrlResult.rows[0].unique_urls);
    
    // Jobs with NULL or empty URL
    const nullUrlResult = await pool.query(`
      SELECT COUNT(*) as null_urls 
      FROM jobs 
      WHERE url IS NULL OR url = ''
    `);
    const nullUrls = parseInt(nullUrlResult.rows[0].null_urls);
    
    // Calculate duplicates
    const duplicateRecords = totalJobs - uniqueUrls - nullUrls;
    
    console.log('═'.repeat(50));
    console.log(`  Total records in database:    ${totalJobs.toLocaleString()}`);
    console.log(`  Unique URLs (non-empty):      ${uniqueUrls.toLocaleString()}`);
    console.log(`  Records with NULL/empty URL:  ${nullUrls.toLocaleString()}`);
    console.log('═'.repeat(50));
    console.log(`  Unique jobs after cleanup:    ${(uniqueUrls + nullUrls).toLocaleString()}`);
    console.log(`  Duplicate records to remove:  ${duplicateRecords.toLocaleString()}`);
    console.log('═'.repeat(50));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

verifyUniqueCounts();

