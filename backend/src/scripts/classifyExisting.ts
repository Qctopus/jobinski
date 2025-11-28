import { JobService } from '../services/JobService';
import { testConnection } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script to classify all existing jobs in the database
 * This should be run after migration to categorize existing jobs
 */
async function classifyExistingJobs() {
  console.log('🚀 Starting classification of existing jobs...');

  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Database connection failed. Exiting...');
      process.exit(1);
    }

    const jobService = new JobService();
    const batchSize = parseInt(process.env.CLASSIFICATION_BATCH_SIZE || '100');
    
    let totalProcessed = 0;
    let totalErrors = 0;
    let batchNumber = 1;

    console.log(`📊 Processing in batches of ${batchSize}...`);

    while (true) {
      console.log(`\\n📦 Processing batch ${batchNumber}...`);
      
      const result = await jobService.batchClassifyJobs(batchSize);
      
      totalProcessed += result.processed;
      totalErrors += result.errors;
      
      console.log(`✅ Batch ${batchNumber} completed: ${result.processed} processed, ${result.errors} errors`);
      
      // If no jobs were processed, we're done
      if (result.processed === 0) {
        console.log('\\n🎉 All jobs have been classified!');
        break;
      }
      
      batchNumber++;
      
      // Add a small delay between batches to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Get final statistics
    const stats = await jobService.getClassificationStats();
    
    console.log('\\n📈 Final Statistics:');
    console.log(`📊 Total Jobs: ${stats.total_jobs}`);
    console.log(`✅ Classified Jobs: ${stats.classified_jobs}`);
    console.log(`👤 User Corrected: ${stats.user_corrected_jobs}`);
    console.log(`🎯 Average Confidence: ${stats.avg_confidence.toFixed(1)}%`);
    console.log(`⚠️  Low Confidence Jobs: ${stats.low_confidence_count}`);
    
    console.log('\\n🏷️  Category Distribution:');
    Object.entries(stats.category_distribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count} jobs`);
      });

    console.log(`\\n✨ Classification completed successfully!`);
    console.log(`📊 Total processed: ${totalProcessed}`);
    console.log(`❌ Total errors: ${totalErrors}`);
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Classification failed:', error);
    process.exit(1);
  }
}

// Add progress reporting for long-running operations
const reportProgress = (current: number, total: number, startTime: number) => {
  const elapsed = Date.now() - startTime;
  const rate = current / (elapsed / 1000);
  const estimated = total / rate;
  const remaining = estimated - (elapsed / 1000);
  
  console.log(`📊 Progress: ${current}/${total} (${((current/total)*100).toFixed(1)}%) - ${rate.toFixed(1)} jobs/sec - ETA: ${Math.round(remaining)}s`);
};

// Run the script if this file is executed directly
if (require.main === module) {
  classifyExistingJobs()
    .then(() => {
      console.log('🎯 Script completed successfully');
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export default classifyExistingJobs;









