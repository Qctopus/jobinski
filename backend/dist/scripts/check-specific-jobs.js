"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite_1 = __importDefault(require("../config/sqlite"));
const queries = [
    'Human Resource Assistant',
    'Project Analyst',
    'UX/UI Advisor',
    'Fitness Instructor',
    'Sapeur-Pompier',
    'Sécurité',
    'Data Migration',
    'Master Data Management',
    'Security Risk',
    'Grants Coordinator',
    'Team assistant'
];
console.log('Checking specific job classifications:\n');
console.log('='.repeat(80));
for (const search of queries) {
    const jobs = sqlite_1.default.prepare(`
    SELECT id, title, primary_category, classification_confidence 
    FROM jobs 
    WHERE title LIKE ?
    LIMIT 3
  `).all(`%${search}%`);
    if (jobs.length > 0) {
        console.log(`\n🔍 "${search}":`);
        for (const job of jobs) {
            console.log(`   ${job.title.substring(0, 60)}...`);
            console.log(`   → ${job.primary_category} (${job.classification_confidence}%)`);
        }
    }
}
//# sourceMappingURL=check-specific-jobs.js.map