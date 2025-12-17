import pool from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

async function checkSchema() {
    console.log('📊 Checking schema for "archived" column in Postgres...\n');

    try {
        const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'jobs' AND column_name = 'archived'
    `);

        if (result.rows.length === 0) {
            console.log('Column not found!');
        } else {
            console.log('Column details:', result.rows[0]);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkSchema();
