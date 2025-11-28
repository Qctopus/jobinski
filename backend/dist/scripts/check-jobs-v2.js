"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite_1 = __importDefault(require("../config/sqlite"));
const queries = [
    'Roster of Interns',
    'Economist Intern',
    'Team assistant',
    'Driver',
    'Editing and proofreading',
    'Firearms',
    'Knowledge Management',
    'conference services',
    'asistencia técnica en los procesos tecnológicos',
    'Housing policies',
    'Digital Media',
    'Pricing Agent',
    'Tax Publications',
    'Foster Care',
    'Archivist',
    'Sanctions Expert',
    'HEATING, VENTILATION',
    'Statistics Division'
];
console.log('Checking specific job classifications:\n');
console.log('='.repeat(100));
for (const search of queries) {
    const jobs = sqlite_1.default.prepare(`
    SELECT id, title, primary_category, classification_confidence 
    FROM jobs 
    WHERE title LIKE ?
    LIMIT 2
  `).all(`%${search}%`);
    if (jobs.length > 0) {
        console.log(`\n🔍 "${search}":`);
        for (const job of jobs) {
            const title = job.title.length > 65 ? job.title.substring(0, 65) + '...' : job.title;
            console.log(`   ${title}`);
            console.log(`   → ${job.primary_category} (${job.classification_confidence}%)`);
        }
    }
    else {
        console.log(`\n🔍 "${search}": No matches found`);
    }
}
//# sourceMappingURL=check-jobs-v2.js.map