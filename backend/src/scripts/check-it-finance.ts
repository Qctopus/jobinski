import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../data/jobs_cache.db');
const db = new Database(dbPath);

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
  `).all(`%${search}%`) as any[];
  
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














