import pool from '../config/database';
import db from '../config/sqlite';
import dotenv from 'dotenv';

dotenv.config();

interface LowConfidenceJob {
  id: number;
  title: string;
  job_labels: string;
  short_agency: string;
  up_grade: string;
  primary_category: string;
  classification_confidence: number;
  classification_reasoning: string;
}

async function analyzeLowConfidenceJobs(): Promise<void> {
  console.log('📊 Analyzing 30 jobs with lowest classification confidence...\n');

  try {
    // Query SQLite for lowest confidence jobs
    const jobs = db.prepare(`
      SELECT 
        id,
        title,
        job_labels,
        short_agency,
        up_grade,
        primary_category,
        classification_confidence,
        classification_reasoning
      FROM jobs
      WHERE classification_confidence IS NOT NULL
      ORDER BY classification_confidence ASC
      LIMIT 30
    `).all() as LowConfidenceJob[];

    if (jobs.length === 0) {
      console.log('No jobs found with classification confidence scores.');
      return;
    }

    console.log('═'.repeat(100));
    console.log('LOW CONFIDENCE JOBS ANALYSIS');
    console.log('═'.repeat(100));

    // Collect patterns for analysis
    const patterns: {
      noMatchingKeywords: LowConfidenceJob[];
      ambiguousTitles: LowConfidenceJob[];
      unknownAgencies: LowConfidenceJob[];
      missingLabels: LowConfidenceJob[];
    } = {
      noMatchingKeywords: [],
      ambiguousTitles: [],
      unknownAgencies: [],
      missingLabels: []
    };

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i]!;
      console.log(`\n[${i + 1}] ID: ${job.id} | Confidence: ${job.classification_confidence}%`);
      console.log(`    Title: ${job.title}`);
      console.log(`    Category: ${job.primary_category || 'UNCATEGORIZED'}`);
      console.log(`    Agency: ${job.short_agency}`);
      console.log(`    Grade: ${job.up_grade}`);
      console.log(`    Labels: ${job.job_labels?.substring(0, 100) || 'None'}...`);
      
      // Parse reasoning
      let reasoning: string[] = [];
      try {
        reasoning = JSON.parse(job.classification_reasoning || '[]');
      } catch (e) {
        reasoning = [job.classification_reasoning || 'No reasoning'];
      }
      console.log(`    Reasoning: ${reasoning.join('; ')}`);

      // Categorize the issue
      if (!job.job_labels || job.job_labels.trim() === '') {
        patterns.missingLabels.push(job);
      }
      if (reasoning.some(r => r.toLowerCase().includes('no strong match') || r.toLowerCase().includes('weak'))) {
        patterns.noMatchingKeywords.push(job);
      }
      if (reasoning.some(r => r.toLowerCase().includes('ambiguous') || r.toLowerCase().includes('multiple'))) {
        patterns.ambiguousTitles.push(job);
      }
    }

    // Summary statistics
    console.log('\n' + '═'.repeat(100));
    console.log('PATTERN SUMMARY');
    console.log('═'.repeat(100));

    // Category distribution
    const categoryCount: Record<string, number> = {};
    for (const job of jobs) {
      const cat = job.primary_category || 'UNCATEGORIZED';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    }
    console.log('\nCategory distribution in low-confidence jobs:');
    Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count} jobs`);
      });

    // Confidence range
    const confidences = jobs.map(j => j.classification_confidence);
    console.log(`\nConfidence range: ${Math.min(...confidences)}% - ${Math.max(...confidences)}%`);

    // Common title patterns
    console.log('\nCommon title patterns in low-confidence jobs:');
    const titleWords = new Map<string, number>();
    for (const job of jobs) {
      const words = job.title.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (word.length > 3) {
          titleWords.set(word, (titleWords.get(word) || 0) + 1);
        }
      }
    }
    Array.from(titleWords.entries())
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .forEach(([word, count]) => {
        console.log(`  "${word}": ${count} occurrences`);
      });

    // Agency distribution
    console.log('\nAgency distribution in low-confidence jobs:');
    const agencyCount: Record<string, number> = {};
    for (const job of jobs) {
      agencyCount[job.short_agency] = (agencyCount[job.short_agency] || 0) + 1;
    }
    Object.entries(agencyCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([agency, count]) => {
        console.log(`  ${agency}: ${count} jobs`);
      });

    // Issues summary
    console.log('\nIssue patterns:');
    console.log(`  Missing job labels: ${patterns.missingLabels.length}`);
    console.log(`  No matching keywords: ${patterns.noMatchingKeywords.length}`);
    console.log(`  Ambiguous categories: ${patterns.ambiguousTitles.length}`);

  } catch (error) {
    console.error('Error analyzing jobs:', error);
  }
}

analyzeLowConfidenceJobs();

