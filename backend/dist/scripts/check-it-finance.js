"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.join(__dirname, '../../data/jobs_cache.db');
const db = new better_sqlite3_1.default(dbPath);
const searches = [
    'Information Technology Assistant',
    'Finance Intern',
    'IT Assistant',
    'ICT',
    'Budget',
    'Accountant'
];
console.log('Checking IT and Finance job classifications:\n');
console.log('='.repeat(100));
for (const search of searches) {
    const jobs = db.prepare(`
    SELECT title, primary_category, classification_confidence 
    FROM jobs 
    WHERE title LIKE ? 
    ORDER BY classification_confidence ASC 
    LIMIT 3
  `).all(`%${search}%`);
    if (jobs.length > 0) {
        console.log(`\n🔍 "${search}":`);
        for (const job of jobs) {
            const title = job.title.length > 60 ? job.title.substring(0, 60) + '...' : job.title;
            const confidence = Math.round(job.classification_confidence * 100);
            console.log(`   ${title}`);
            console.log(`   → ${job.primary_category} (${confidence}%)`);
        }
    }
}
db.close();
//# sourceMappingURL=check-it-finance.js.map