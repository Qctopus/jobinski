"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function verifyUniqueCounts() {
    console.log('📊 Verifying job counts in PostgreSQL database...\n');
    try {
        const totalResult = await database_1.default.query('SELECT COUNT(*) as total FROM jobs');
        const totalJobs = parseInt(totalResult.rows[0].total);
        const uniqueUrlResult = await database_1.default.query(`
      SELECT COUNT(DISTINCT url) as unique_urls 
      FROM jobs 
      WHERE url IS NOT NULL AND url != ''
    `);
        const uniqueUrls = parseInt(uniqueUrlResult.rows[0].unique_urls);
        const nullUrlResult = await database_1.default.query(`
      SELECT COUNT(*) as null_urls 
      FROM jobs 
      WHERE url IS NULL OR url = ''
    `);
        const nullUrls = parseInt(nullUrlResult.rows[0].null_urls);
        const duplicateRecords = totalJobs - uniqueUrls - nullUrls;
        console.log('═'.repeat(50));
        console.log(`  Total records in database:    ${totalJobs.toLocaleString()}`);
        console.log(`  Unique URLs (non-empty):      ${uniqueUrls.toLocaleString()}`);
        console.log(`  Records with NULL/empty URL:  ${nullUrls.toLocaleString()}`);
        console.log('═'.repeat(50));
        console.log(`  Unique jobs after cleanup:    ${(uniqueUrls + nullUrls).toLocaleString()}`);
        console.log(`  Duplicate records to remove:  ${duplicateRecords.toLocaleString()}`);
        console.log('═'.repeat(50));
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        await database_1.default.end();
    }
}
verifyUniqueCounts();
//# sourceMappingURL=verify-counts.js.map