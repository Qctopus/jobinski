import pool from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

interface DuplicateResult {
  url: string;
  count: number;
  ids: number[];
  titles: string[];
  posting_dates: string[];
  created_ats: string[];
}

async function findDuplicatesByUrl(): Promise<void> {
  console.log('🔍 Searching for duplicate jobs by URL...\n');

  try {
    // Find URLs that appear more than once
    const duplicateUrlsQuery = `
      SELECT url, COUNT(*) as count
      FROM jobs
      WHERE url IS NOT NULL AND url != ''
      GROUP BY url
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;

    const duplicateUrls = await pool.query(duplicateUrlsQuery);
    
    if (duplicateUrls.rows.length === 0) {
      console.log('✅ No duplicate URLs found in the database.');
      await pool.end();
      return;
    }

    console.log(`❌ Found ${duplicateUrls.rows.length} URLs with duplicates:\n`);
    console.log('=' .repeat(80));

    // Get details for each duplicate
    for (const dup of duplicateUrls.rows.slice(0, 20)) { // Limit to first 20
      const detailsQuery = `
        SELECT id, title, url, posting_date, created_at, short_agency
        FROM jobs
        WHERE url = $1
        ORDER BY id
      `;
      
      const details = await pool.query(detailsQuery, [dup.url]);
      
      console.log(`\n📋 URL appearing ${dup.count} times:`);
      console.log(`   ${dup.url?.substring(0, 100)}...`);
      console.log('\n   Duplicates:');
      
      for (const job of details.rows) {
        console.log(`   - ID: ${job.id}`);
        console.log(`     Title: ${job.title?.substring(0, 60)}...`);
        console.log(`     Agency: ${job.short_agency}`);
        console.log(`     Posted: ${job.posting_date}`);
        console.log(`     Created: ${job.created_at}`);
        console.log('');
      }
      console.log('-'.repeat(80));
    }

    // Summary statistics
    console.log('\n📊 SUMMARY:');
    console.log(`   Total URLs with duplicates: ${duplicateUrls.rows.length}`);
    
    const totalDups = duplicateUrls.rows.reduce((sum: number, r: any) => sum + Number(r.count), 0);
    const extraRecords = totalDups - duplicateUrls.rows.length;
    console.log(`   Total duplicate records: ${totalDups}`);
    console.log(`   Extra records that could be removed: ${extraRecords}`);

    // Check if duplicates have same or different titles
    const titleAnalysisQuery = `
      WITH duplicate_urls AS (
        SELECT url
        FROM jobs
        WHERE url IS NOT NULL AND url != ''
        GROUP BY url
        HAVING COUNT(*) > 1
      ),
      duplicate_jobs AS (
        SELECT j.url, j.title
        FROM jobs j
        INNER JOIN duplicate_urls d ON j.url = d.url
      )
      SELECT 
        url,
        COUNT(DISTINCT title) as distinct_titles,
        array_agg(DISTINCT title) as titles
      FROM duplicate_jobs
      GROUP BY url
      HAVING COUNT(DISTINCT title) > 1
      LIMIT 10
    `;

    const titleAnalysis = await pool.query(titleAnalysisQuery);
    
    if (titleAnalysis.rows.length > 0) {
      console.log('\n⚠️  DUPLICATES WITH DIFFERENT TITLES (same URL, different title):');
      for (const row of titleAnalysis.rows) {
        console.log(`\n   URL: ${row.url?.substring(0, 80)}...`);
        console.log(`   Distinct titles (${row.distinct_titles}):`);
        for (const title of row.titles) {
          console.log(`     - ${title?.substring(0, 70)}...`);
        }
      }
    } else {
      console.log('\n   All duplicates have identical titles.');
    }

    // Check for uniquecode duplicates
    console.log('\n\n🔍 Checking uniquecode duplicates...');
    const uniquecodeQuery = `
      SELECT uniquecode, COUNT(*) as count
      FROM jobs
      WHERE uniquecode IS NOT NULL AND uniquecode != ''
      GROUP BY uniquecode
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 10
    `;

    const uniquecodeDups = await pool.query(uniquecodeQuery);
    if (uniquecodeDups.rows.length > 0) {
      console.log(`   Found ${uniquecodeDups.rows.length} uniquecodes with duplicates`);
      for (const uc of uniquecodeDups.rows) {
        console.log(`   - ${uc.uniquecode}: ${uc.count} occurrences`);
      }
    } else {
      console.log('   No duplicate uniquecodes found.');
    }

  } catch (error) {
    console.error('Error finding duplicates:', error);
  } finally {
    await pool.end();
  }
}

// Search for specific job by partial title
async function searchByTitle(searchTerm: string): Promise<void> {
  console.log(`\n🔍 Searching for jobs containing: "${searchTerm}"\n`);
  
  try {
    const query = `
      SELECT id, title, url, short_agency, posting_date, created_at
      FROM jobs
      WHERE title ILIKE $1
      ORDER BY id
    `;
    
    const result = await pool.query(query, [`%${searchTerm}%`]);
    
    if (result.rows.length === 0) {
      console.log('No jobs found matching that search term.');
      return;
    }

    console.log(`Found ${result.rows.length} matching jobs:\n`);
    
    for (const job of result.rows) {
      console.log(`ID: ${job.id}`);
      console.log(`Title: ${job.title}`);
      console.log(`URL: ${job.url}`);
      console.log(`Agency: ${job.short_agency}`);
      console.log(`Posted: ${job.posting_date}`);
      console.log(`Created: ${job.created_at}`);
      console.log('-'.repeat(60));
    }
    
  } catch (error) {
    console.error('Error searching:', error);
  }
}

// Main execution
async function main(): Promise<void> {
  const searchTerm = process.argv[2];
  
  if (searchTerm) {
    await searchByTitle(searchTerm);
  }
  
  await findDuplicatesByUrl();
}

main().catch(console.error);






