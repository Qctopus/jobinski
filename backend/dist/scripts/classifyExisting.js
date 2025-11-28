"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const JobService_1 = require("../services/JobService");
const database_1 = require("../config/database");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function classifyExistingJobs() {
    console.log('🚀 Starting classification of existing jobs...');
    try {
        const dbConnected = await (0, database_1.testConnection)();
        if (!dbConnected) {
            console.error('❌ Database connection failed. Exiting...');
            process.exit(1);
        }
        const jobService = new JobService_1.JobService();
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
            if (result.processed === 0) {
                console.log('\\n🎉 All jobs have been classified!');
                break;
            }
            batchNumber++;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        const stats = await jobService.getClassificationStats();
        console.log('\\n📈 Final Statistics:');
        console.log(`📊 Total Jobs: ${stats.total_jobs}`);
        console.log(`✅ Classified Jobs: ${stats.classified_jobs}`);
        console.log(`👤 User Corrected: ${stats.user_corrected_jobs}`);
        console.log(`🎯 Average Confidence: ${stats.avg_confidence.toFixed(1)}%`);
        console.log(`⚠️  Low Confidence Jobs: ${stats.low_confidence_count}`);
        console.log('\\n🏷️  Category Distribution:');
        Object.entries(stats.category_distribution)
            .sort(([, a], [, b]) => b - a)
            .forEach(([category, count]) => {
            console.log(`   ${category}: ${count} jobs`);
        });
        console.log(`\\n✨ Classification completed successfully!`);
        console.log(`📊 Total processed: ${totalProcessed}`);
        console.log(`❌ Total errors: ${totalErrors}`);
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Classification failed:', error);
        process.exit(1);
    }
}
const reportProgress = (current, total, startTime) => {
    const elapsed = Date.now() - startTime;
    const rate = current / (elapsed / 1000);
    const estimated = total / rate;
    const remaining = estimated - (elapsed / 1000);
    console.log(`📊 Progress: ${current}/${total} (${((current / total) * 100).toFixed(1)}%) - ${rate.toFixed(1)} jobs/sec - ETA: ${Math.round(remaining)}s`);
};
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
exports.default = classifyExistingJobs;
//# sourceMappingURL=classifyExisting.js.map