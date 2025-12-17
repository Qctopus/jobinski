import pool from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

async function inspectPostgresJob() {
    console.log('📊 Inspecting one ACTIVE job from Postgres...\n');

    try {
        // Try to find a job that is supposedly NOT archived
        const result = await pool.query("SELECT id, archived FROM jobs WHERE archived = false OR archived::text = '0' OR archived IS NULL LIMIT 1");

        if (result.rows.length === 0) {
            console.log('❌ No active jobs found in Postgres!');
            // Check counts
            const count = await pool.query("SELECT count(*) FROM jobs");
            console.log('Total jobs in Postgres:', count.rows[0].count);
            return;
        }

        const job = result.rows[0];

        console.log('Raw Job ID:', job.id);
        console.log('Type of archived:', typeof job.archived);
        console.log('Value of archived:', job.archived);

        // Test the logic used in SyncService
        const isArchivedLogic = Boolean(job.archived) && Number(job.archived) !== 0;
        console.log('Calculated isArchived (current SyncService logic):', isArchivedLogic);

        // Test fix logic
        const isArchivedFixed = job.archived === true || job.archived === 'true' || job.archived === 1;
        console.log('Calculated isArchived (proposed simple logic):', isArchivedFixed);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

inspectPostgresJob();
