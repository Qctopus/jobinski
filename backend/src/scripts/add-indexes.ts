import pool from '../config/database';

async function addPerformanceIndexes() {
    const client = await pool.connect();

    try {
        console.log('🚀 Adding performance indexes...');

        await client.query('BEGIN');

        // Add indexes for frequently queried columns
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_jobs_apply_until ON jobs(apply_until)',
            'CREATE INDEX IF NOT EXISTS idx_jobs_archived ON jobs(archived)',
            'CREATE INDEX IF NOT EXISTS idx_jobs_sectoral_category ON jobs(sectoral_category)',
            'CREATE INDEX IF NOT EXISTS idx_jobs_status_filter ON jobs(archived, apply_until)', // Composite index for status filtering
        ];

        for (const indexSql of indexes) {
            console.log(`Creating index: ${indexSql}`);
            await client.query(indexSql);
        }

        await client.query('COMMIT');
        console.log('✅ All performance indexes created successfully!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error creating indexes:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run if executed directly
if (require.main === module) {
    addPerformanceIndexes()
        .then(() => {
            console.log('✨ Index creation complete');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Index creation failed:', error);
            process.exit(1);
        });
}

export default addPerformanceIndexes;
