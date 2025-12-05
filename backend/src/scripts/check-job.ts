import db from '../config/sqlite';

const jobs = db.prepare(`
  SELECT id, title, primary_category, classification_confidence 
  FROM jobs 
  WHERE title LIKE '%Monitoreo%' OR title LIKE '%ENCP%'
`).all() as any[];

console.log('Found jobs:');
for (const job of jobs) {
  console.log(`ID: ${job.id}`);
  console.log(`Title: ${job.title}`);
  console.log(`Category: ${job.primary_category}`);
  console.log(`Confidence: ${job.classification_confidence}%`);
  console.log('---');
}












