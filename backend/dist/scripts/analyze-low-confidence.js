"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite_1 = __importDefault(require("../config/sqlite"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function analyzeLowConfidenceJobs() {
    console.log('📊 Analyzing 30 jobs with lowest classification confidence...\n');
    try {
        const jobs = sqlite_1.default.prepare(`
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
    `).all();
        if (jobs.length === 0) {
            console.log('No jobs found with classification confidence scores.');
            return;
        }
        console.log('═'.repeat(100));
        console.log('LOW CONFIDENCE JOBS ANALYSIS');
        console.log('═'.repeat(100));
        const patterns = {
            noMatchingKeywords: [],
            ambiguousTitles: [],
            unknownAgencies: [],
            missingLabels: []
        };
        for (let i = 0; i < jobs.length; i++) {
            const job = jobs[i];
            console.log(`\n[${i + 1}] ID: ${job.id} | Confidence: ${job.classification_confidence}%`);
            console.log(`    Title: ${job.title}`);
            console.log(`    Category: ${job.primary_category || 'UNCATEGORIZED'}`);
            console.log(`    Agency: ${job.short_agency}`);
            console.log(`    Grade: ${job.up_grade}`);
            console.log(`    Labels: ${job.job_labels?.substring(0, 100) || 'None'}...`);
            let reasoning = [];
            try {
                reasoning = JSON.parse(job.classification_reasoning || '[]');
            }
            catch (e) {
                reasoning = [job.classification_reasoning || 'No reasoning'];
            }
            console.log(`    Reasoning: ${reasoning.join('; ')}`);
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
        console.log('\n' + '═'.repeat(100));
        console.log('PATTERN SUMMARY');
        console.log('═'.repeat(100));
        const categoryCount = {};
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
        const confidences = jobs.map(j => j.classification_confidence);
        console.log(`\nConfidence range: ${Math.min(...confidences)}% - ${Math.max(...confidences)}%`);
        console.log('\nCommon title patterns in low-confidence jobs:');
        const titleWords = new Map();
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
        console.log('\nAgency distribution in low-confidence jobs:');
        const agencyCount = {};
        for (const job of jobs) {
            agencyCount[job.short_agency] = (agencyCount[job.short_agency] || 0) + 1;
        }
        Object.entries(agencyCount)
            .sort((a, b) => b[1] - a[1])
            .forEach(([agency, count]) => {
            console.log(`  ${agency}: ${count} jobs`);
        });
        console.log('\nIssue patterns:');
        console.log(`  Missing job labels: ${patterns.missingLabels.length}`);
        console.log(`  No matching keywords: ${patterns.noMatchingKeywords.length}`);
        console.log(`  Ambiguous categories: ${patterns.ambiguousTitles.length}`);
    }
    catch (error) {
        console.error('Error analyzing jobs:', error);
    }
}
analyzeLowConfidenceJobs();
//# sourceMappingURL=analyze-low-confidence.js.map