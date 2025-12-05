import db from '../config/sqlite';

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
console.log('=' .repeat(80));

for (const search of queries) {
  const jobs = db.prepare(`
    SELECT id, title, primary_category, classification_confidence 
    FROM jobs 
    WHERE title LIKE ?
    LIMIT 3
  `).all(`%${search}%`) as any[];

  if (jobs.length > 0) {
    console.log(`\n🔍 "${search}":`);
    for (const job of jobs) {
      console.log(`   ${job.title.substring(0, 60)}...`);
      console.log(`   → ${job.primary_category} (${job.classification_confidence}%)`);
    }
  }
}












