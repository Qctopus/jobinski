import db from '../config/sqlite';

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
console.log('=' .repeat(100));

for (const search of queries) {
  const jobs = db.prepare(`
    SELECT id, title, primary_category, classification_confidence 
    FROM jobs 
    WHERE title LIKE ?
    LIMIT 2
  `).all(`%${search}%`) as any[];

  if (jobs.length > 0) {
    console.log(`\n🔍 "${search}":`);
    for (const job of jobs) {
      const title = job.title.length > 65 ? job.title.substring(0, 65) + '...' : job.title;
      console.log(`   ${title}`);
      console.log(`   → ${job.primary_category} (${job.classification_confidence}%)`);
    }
  } else {
    console.log(`\n🔍 "${search}": No matches found`);
  }
}

