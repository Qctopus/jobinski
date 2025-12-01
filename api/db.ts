/**
 * Neon Database Connection for Vercel Serverless
 * Uses @neondatabase/serverless for edge-compatible PostgreSQL access
 */
import { neon } from '@neondatabase/serverless';

// Initialize Neon client - uses DATABASE_URL environment variable
export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  return neon(databaseUrl);
}

// Helper to format jobs for the frontend
export function formatJob(row: any) {
  return {
    id: String(row.id),
    url: row.url || '',
    title: row.title || '',
    description: row.description || '',
    duty_station: row.duty_station || '',
    duty_country: row.duty_country || '',
    duty_continent: row.duty_continent || '',
    country_code: row.country_code || '',
    eligible_nationality: row.eligible_nationality || '',
    hs_min_exp: row.hs_min_exp || null,
    bachelor_min_exp: row.bachelor_min_exp || null,
    master_min_exp: row.master_min_exp || null,
    up_grade: row.up_grade || '',
    pipeline: row.pipeline || '',
    department: row.department || '',
    long_agency: row.long_agency || '',
    short_agency: row.short_agency || '',
    posting_date: row.posting_date || '',
    apply_until: row.apply_until || '',
    languages: row.languages || '',
    uniquecode: row.uniquecode || '',
    ideal_candidate: row.ideal_candidate || '',
    job_labels: row.job_labels || '',
    archived: Boolean(row.archived),
    sectoral_category: row.sectoral_category || '',
    primary_category: row.primary_category || row.sectoral_category || 'operations-administration',
    secondary_categories: row.secondary_categories || [],
    classification_confidence: row.classification_confidence || 50,
    seniority_level: row.seniority_level || 'Mid',
    location_type: row.location_type || 'Field',
    is_home_based: (row.duty_station || '').toLowerCase().includes('home')
  };
}

