"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite_1 = __importDefault(require("../config/sqlite"));
const jobs = sqlite_1.default.prepare(`
  SELECT id, title, primary_category, classification_confidence 
  FROM jobs 
  WHERE title LIKE '%Monitoreo%' OR title LIKE '%ENCP%'
`).all();
console.log('Found jobs:');
for (const job of jobs) {
    console.log(`ID: ${job.id}`);
    console.log(`Title: ${job.title}`);
    console.log(`Category: ${job.primary_category}`);
    console.log(`Confidence: ${job.classification_confidence}%`);
    console.log('---');
}
//# sourceMappingURL=check-job.js.map