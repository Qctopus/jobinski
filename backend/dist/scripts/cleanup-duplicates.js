"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function cleanupDuplicates(dryRun = true) {
    console.log(`\n🧹 ${dryRun ? '[DRY RUN] ' : ''}Starting duplicate cleanup...\n`);
    const result = {
        duplicateUrlsFound: 0,
        recordsDeleted: 0,
        recordsKept: 0,
        errors: []
    };
    const client = await database_1.default.connect();
    try {
        await client.query('BEGIN');
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
        result.recordsKept = result.duplicateUrlsFound;
        console.log(`📋 Records to delete: ${result.recordsDeleted}`);
        console.log(`📋 Records to keep (one per URL): ${result.recordsKept}`);
        if (dryRun) {
            console.log('\n⚠️  DRY RUN - No changes made. Run with --execute to apply changes.\n');
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
        }
        else {
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
            }
            else {
                console.log(`❌ Verification failed: ${remainingDups} duplicate URLs still exist`);
                result.errors.push(`Verification failed: ${remainingDups} duplicates remaining`);
                await client.query('ROLLBACK');
                console.log('⚠️  Changes rolled back');
            }
        }
        const finalCountQuery = 'SELECT COUNT(*) as total FROM jobs';
        const finalCount = await client.query(finalCountQuery);
        console.log(`\n📊 Total jobs in database after cleanup: ${finalCount.rows[0].total}`);
    }
    catch (error) {
        await client.query('ROLLBACK');
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(errorMessage);
        console.error('❌ Error during cleanup:', error);
    }
    finally {
        client.release();
    }
    return result;
}
async function addUniqueConstraint(dryRun = true) {
    console.log(`\n🔧 ${dryRun ? '[DRY RUN] ' : ''}Adding unique constraint on URL...\n`);
    const client = await database_1.default.connect();
    try {
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
        }
        else {
            await client.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_url_unique 
        ON jobs(url) 
        WHERE url IS NOT NULL AND url != ''
      `);
            console.log('✅ Unique constraint on URL created successfully');
        }
    }
    catch (error) {
        console.error('❌ Error adding constraint:', error);
    }
    finally {
        client.release();
    }
}
async function showStats() {
    console.log('\n📊 Database Statistics\n');
    try {
        const totalResult = await database_1.default.query('SELECT COUNT(*) as total FROM jobs');
        console.log(`Total jobs: ${totalResult.rows[0].total}`);
        const uniqueUrlResult = await database_1.default.query(`
      SELECT COUNT(DISTINCT url) as unique_urls 
      FROM jobs 
      WHERE url IS NOT NULL AND url != ''
    `);
        console.log(`Unique URLs: ${uniqueUrlResult.rows[0].unique_urls}`);
        const dupResult = await database_1.default.query(`
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
        const constraintResult = await database_1.default.query(`
      SELECT indexname
      FROM pg_indexes 
      WHERE tablename = 'jobs' 
      AND indexname LIKE '%url%'
    `);
        console.log(`URL indexes: ${constraintResult.rows.map(r => r.indexname).join(', ') || 'None'}`);
    }
    catch (error) {
        console.error('Error getting stats:', error);
    }
}
async function main() {
    const args = process.argv.slice(2);
    const execute = args.includes('--execute');
    const addConstraint = args.includes('--add-constraint');
    const statsOnly = args.includes('--stats');
    console.log('═'.repeat(60));
    console.log('  DUPLICATE CLEANUP UTILITY');
    console.log('═'.repeat(60));
    if (statsOnly) {
        await showStats();
        await database_1.default.end();
        return;
    }
    if (addConstraint) {
        await addUniqueConstraint(!execute);
        await database_1.default.end();
        return;
    }
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
    await database_1.default.end();
}
main().catch(console.error);
//# sourceMappingURL=cleanup-duplicates.js.map