import pool from '../config/database';
import dotenv from 'dotenv';
dotenv.config();

async function checkAzureDistribution() {
    console.log('📊 Checking distribution of "archived" column in Azure DB...\n');

    try {
        const result = await pool.query(`
      SELECT archived, COUNT(*) as count 
      FROM jobs 
      GROUP BY archived
    `);

        console.log('Distribution:');
        result.rows.forEach(row => {
            console.log(`Value: ${row.archived} (Type: ${typeof row.archived}) - Count: ${row.count}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkAzureDistribution();
