import pool from '../config/database';

async function checkSchema() {
    try {
        // Get table structure
        const structureQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'jobs' AND table_schema = 'public'
      ORDER BY ordinal_position
    `;

        const result = await pool.query(structureQuery);
        console.log('\n📊 Jobs Table Structure:');
        console.log('========================');
        result.rows.forEach(row => {
            console.log(`${row.column_name.padEnd(35)} ${row.data_type.padEnd(25)} ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        // Check sample data
        const sampleQuery = `
      SELECT 
        id, title, 
        posting_date, apply_until,
        primary_category, classification_confidence,
        sectoral_category
      FROM jobs 
      LIMIT 5
    `;

        const sampleResult = await pool.query(sampleQuery);
        console.log('\n📝 Sample Data (first 5 rows):');
        console.log('==============================');
        console.log(JSON.stringify(sampleResult.rows, null, 2));

        // Check data types of date columns
        const dateCheckQuery = `
      SELECT 
        pg_typeof(posting_date) as posting_date_type,
        pg_typeof(apply_until) as apply_until_type
      FROM jobs 
      LIMIT 1
    `;

        const dateResult = await pool.query(dateCheckQuery);
        console.log('\n📅 Date Column Types:');
        console.log('====================');
        console.log(JSON.stringify(dateResult.rows[0], null, 2));

        // Check category distribution
        const categoryQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(primary_category) as with_primary_category,
        COUNT(sectoral_category) as with_sectoral_category
      FROM jobs
    `;

        const categoryResult = await pool.query(categoryQuery);
        console.log('\n📈 Category Distribution:');
        console.log('========================');
        console.log(JSON.stringify(categoryResult.rows[0], null, 2));

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        await pool.end();
        process.exit(1);
    }
}

checkSchema();
