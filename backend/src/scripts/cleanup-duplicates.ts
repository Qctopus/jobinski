import pool from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

interface CleanupResult {
  duplicateUrlsFound: number;
  recordsDeleted: number;
  recordsKept: number;
  errors: string[];
}

/**
 * Cleanup duplicate jobs in PostgreSQL database
 * Strategy: Keep the most recently updated record for each URL, delete the rest
 */
async function cleanupDuplicates(dryRun: boolean = true): Promise<CleanupResult> {
  console.log(`\n🧹 ${dryRun ? '[DRY RUN] ' : ''}Starting duplicate cleanup...\n`);
  
  const result: CleanupResult = {
    duplicateUrlsFound: 0,
    recordsDeleted: 0,
    recordsKept: 0,
    errors: []
  };

  const client = await pool.connect();

  try {
    // Start transaction
    await client.query('BEGIN');

    // Find all duplicate URLs and count them
    const duplicateCountQuery = `
      SELECT COUNT(*) as dup_count
      FROM (
        SELECT url
        FROM jobs
        WHERE url IS NOT NULL AND url != ''
        GROUP BY url
        HAVING COUNT(*) > 1
      ) as duplicates
    `;
    
    const dupCountResult = await client.query(duplicateCountQuery);
    result.duplicateUrlsFound = parseInt(dupCountResult.rows[0].dup_count);
    
    console.log(`📊 Found ${result.duplicateUrlsFound} URLs with duplicates`);

    if (result.duplicateUrlsFound === 0) {
      console.log('✅ No duplicates found. Database is clean!');
      await client.query('ROLLBACK');
      return result;
    }

    // Get count of records that will be deleted
    // Strategy: For each duplicate URL, keep the record with the highest ID (most recent insert)
    // We could also use updated_at or created_at, but ID is more reliable
    const countToDeleteQuery = `
      SELECT COUNT(*) as delete_count
      FROM jobs j
      WHERE j.url IN (
        SELECT url
        FROM jobs
        WHERE url IS NOT NULL AND url != ''
        GROUP BY url
        HAVING COUNT(*) > 1
      )
      AND j.id NOT IN (
        SELECT MAX(id)
        FROM jobs
        WHERE url IS NOT NULL AND url != ''
        GROUP BY url
        HAVING COUNT(*) > 1
      )
    `;

    const deleteCountResult = await client.query(countToDeleteQuery);
    result.recordsDeleted = parseInt(deleteCountResult.rows[0].delete_count);
    result.recordsKept = result.duplicateUrlsFound; // One record per duplicate URL

    console.log(`📋 Records to delete: ${result.recordsDeleted}`);
    console.log(`📋 Records to keep (one per URL): ${result.recordsKept}`);

    if (dryRun) {
      console.log('\n⚠️  DRY RUN - No changes made. Run with --execute to apply changes.\n');
      
      // Show sample of what would be deleted
      const sampleQuery = `
        SELECT j.id, j.title, j.url, j.created_at
        FROM jobs j
        WHERE j.url IN (
          SELECT url
          FROM jobs
          WHERE url IS NOT NULL AND url != ''
          GROUP BY url
          HAVING COUNT(*) > 1
        )
        AND j.id NOT IN (
          SELECT MAX(id)
          FROM jobs
          WHERE url IS NOT NULL AND url != ''
          GROUP BY url
          HAVING COUNT(*) > 1
        )
        LIMIT 10
      `;
      
      const sampleResult = await client.query(sampleQuery);
      console.log('Sample records that would be deleted:');
      for (const row of sampleResult.rows) {
        console.log(`  - ID ${row.id}: ${row.title?.substring(0, 50)}...`);
      }
      
      await client.query('ROLLBACK');
    } else {
      // Execute the deletion
      console.log('\n🗑️  Deleting duplicate records...');
      
      const deleteQuery = `
        DELETE FROM jobs
        WHERE id IN (
          SELECT j.id
          FROM jobs j
          WHERE j.url IN (
            SELECT url
            FROM jobs
            WHERE url IS NOT NULL AND url != ''
            GROUP BY url
            HAVING COUNT(*) > 1
          )
          AND j.id NOT IN (
            SELECT MAX(id)
            FROM jobs
            WHERE url IS NOT NULL AND url != ''
            GROUP BY url
            HAVING COUNT(*) > 1
          )
        )
      `;

      const deleteResult = await client.query(deleteQuery);
      console.log(`✅ Deleted ${deleteResult.rowCount} records`);
      
      // Verify no duplicates remain
      const verifyQuery = `
        SELECT COUNT(*) as remaining
        FROM (
          SELECT url
          FROM jobs
          WHERE url IS NOT NULL AND url != ''
          GROUP BY url
          HAVING COUNT(*) > 1
        ) as remaining_dups
      `;
      
      const verifyResult = await client.query(verifyQuery);
      const remainingDups = parseInt(verifyResult.rows[0].remaining);
      
      if (remainingDups === 0) {
        console.log('✅ Verification passed: No duplicates remaining');
        await client.query('COMMIT');
        console.log('✅ Changes committed to database');
      } else {
        console.log(`❌ Verification failed: ${remainingDups} duplicate URLs still exist`);
        result.errors.push(`Verification failed: ${remainingDups} duplicates remaining`);
        await client.query('ROLLBACK');
        console.log('⚠️  Changes rolled back');
      }
    }

    // Final stats
    const finalCountQuery = 'SELECT COUNT(*) as total FROM jobs';
    const finalCount = await client.query(finalCountQuery);
    console.log(`\n📊 Total jobs in database after cleanup: ${finalCount.rows[0].total}`);

  } catch (error) {
    await client.query('ROLLBACK');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMessage);
    console.error('❌ Error during cleanup:', error);
  } finally {
    client.release();
  }

  return result;
}

/**
 * Add unique constraint on URL to prevent future duplicates
 */
async function addUniqueConstraint(dryRun: boolean = true): Promise<void> {
  console.log(`\n🔧 ${dryRun ? '[DRY RUN] ' : ''}Adding unique constraint on URL...\n`);
  
  const client = await pool.connect();

  try {
    // Check if constraint already exists
    const checkQuery = `
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'jobs' 
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%url%'
    `;
    
    const checkResult = await client.query(checkQuery);
    
    if (checkResult.rows.length > 0) {
      console.log('ℹ️  Unique constraint on URL already exists');
      return;
    }

    // First, check for any remaining duplicates
    const dupCheckQuery = `
      SELECT COUNT(*) as dup_count
      FROM (
        SELECT url
        FROM jobs
        WHERE url IS NOT NULL AND url != ''
        GROUP BY url
        HAVING COUNT(*) > 1
      ) as dups
    `;
    
    const dupCheck = await client.query(dupCheckQuery);
    const dupCount = parseInt(dupCheck.rows[0].dup_count);
    
    if (dupCount > 0) {
      console.log(`❌ Cannot add unique constraint: ${dupCount} duplicate URLs still exist.`);
      console.log('   Run cleanup first: npx ts-node src/scripts/cleanup-duplicates.ts --execute');
      return;
    }

    if (dryRun) {
      console.log('⚠️  DRY RUN - Would add the following constraint:');
      console.log('   CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_url_unique ON jobs(url) WHERE url IS NOT NULL AND url != \'\'');
      console.log('\n   Run with --add-constraint --execute to apply.');
    } else {
      // Create a partial unique index (allows NULL but enforces uniqueness for non-null URLs)
      await client.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_url_unique 
        ON jobs(url) 
        WHERE url IS NOT NULL AND url != ''
      `);
      console.log('✅ Unique constraint on URL created successfully');
    }

  } catch (error) {
    console.error('❌ Error adding constraint:', error);
  } finally {
    client.release();
  }
}

/**
 * Show current database statistics
 */
async function showStats(): Promise<void> {
  console.log('\n📊 Database Statistics\n');
  
  try {
    // Total jobs
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM jobs');
    console.log(`Total jobs: ${totalResult.rows[0].total}`);

    // Unique URLs
    const uniqueUrlResult = await pool.query(`
      SELECT COUNT(DISTINCT url) as unique_urls 
      FROM jobs 
      WHERE url IS NOT NULL AND url != ''
    `);
    console.log(`Unique URLs: ${uniqueUrlResult.rows[0].unique_urls}`);

    // Duplicates
    const dupResult = await pool.query(`
      SELECT COUNT(*) as dup_count
      FROM (
        SELECT url
        FROM jobs
        WHERE url IS NOT NULL AND url != ''
        GROUP BY url
        HAVING COUNT(*) > 1
      ) as dups
    `);
    console.log(`URLs with duplicates: ${dupResult.rows[0].dup_count}`);

    // Check for unique constraint
    const constraintResult = await pool.query(`
      SELECT indexname
      FROM pg_indexes 
      WHERE tablename = 'jobs' 
      AND indexname LIKE '%url%'
    `);
    console.log(`URL indexes: ${constraintResult.rows.map(r => r.indexname).join(', ') || 'None'}`);

  } catch (error) {
    console.error('Error getting stats:', error);
  }
}

// Main execution
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  const addConstraint = args.includes('--add-constraint');
  const statsOnly = args.includes('--stats');

  console.log('═'.repeat(60));
  console.log('  DUPLICATE CLEANUP UTILITY');
  console.log('═'.repeat(60));

  if (statsOnly) {
    await showStats();
    await pool.end();
    return;
  }

  if (addConstraint) {
    await addUniqueConstraint(!execute);
    await pool.end();
    return;
  }

  // Default: run cleanup
  const result = await cleanupDuplicates(!execute);

  console.log('\n═'.repeat(60));
  console.log('  SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Duplicate URLs found: ${result.duplicateUrlsFound}`);
  console.log(`  Records deleted: ${result.recordsDeleted}`);
  console.log(`  Records kept: ${result.recordsKept}`);
  if (result.errors.length > 0) {
    console.log(`  Errors: ${result.errors.join(', ')}`);
  }
  console.log('═'.repeat(60));

  if (!execute) {
    console.log('\n📌 Usage:');
    console.log('   npx ts-node src/scripts/cleanup-duplicates.ts                    # Dry run cleanup');
    console.log('   npx ts-node src/scripts/cleanup-duplicates.ts --execute          # Execute cleanup');
    console.log('   npx ts-node src/scripts/cleanup-duplicates.ts --stats            # Show stats only');
    console.log('   npx ts-node src/scripts/cleanup-duplicates.ts --add-constraint   # Check constraint (dry run)');
    console.log('   npx ts-node src/scripts/cleanup-duplicates.ts --add-constraint --execute  # Add constraint');
  }

  await pool.end();
}

main().catch(console.error);









