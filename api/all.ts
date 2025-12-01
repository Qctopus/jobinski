import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as fs from 'fs';
import * as path from 'path';

function loadJobs(): any[] {
  try {
    const dataPath = path.join(process.cwd(), 'api', 'jobs-data.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(rawData);
  } catch {
    return [];
  }
}

// Compute basic analytics from the job data
function computeAnalytics(jobs: any[], agencyFilter?: string) {
  const filteredJobs = agencyFilter && agencyFilter !== 'all' 
    ? jobs.filter(j => j.short_agency === agencyFilter || j.long_agency?.includes(agencyFilter))
    : jobs;

  // Category distribution
  const categoryMap = new Map<string, number>();
  filteredJobs.forEach(job => {
    const cat = job.primary_category || 'Other';
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
  });
  const categories = Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count, percentage: (count / filteredJobs.length) * 100 }))
    .sort((a, b) => b.count - a.count);

  // Agency distribution
  const agencyMap = new Map<string, number>();
  jobs.forEach(job => {
    const agency = job.short_agency || 'Unknown';
    agencyMap.set(agency, (agencyMap.get(agency) || 0) + 1);
  });
  const agencies = Array.from(agencyMap.entries())
    .map(([name, count]) => ({ name, count, percentage: (count / jobs.length) * 100 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Grade distribution
  const gradeMap = new Map<string, number>();
  filteredJobs.forEach(job => {
    const grade = job.up_grade || 'Unknown';
    gradeMap.set(grade, (gradeMap.get(grade) || 0) + 1);
  });
  const grades = Array.from(gradeMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Location distribution
  const locationMap = new Map<string, number>();
  filteredJobs.forEach(job => {
    const location = job.duty_country || job.duty_station || 'Unknown';
    locationMap.set(location, (locationMap.get(location) || 0) + 1);
  });
  const locations = Array.from(locationMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // Active vs expired
  const now = new Date();
  const activeJobs = filteredJobs.filter(j => {
    if (!j.apply_until) return true;
    return new Date(j.apply_until) >= now;
  });

  return {
    overview: {
      totalJobs: filteredJobs.length,
      activeJobs: activeJobs.length,
      totalAgencies: agencyMap.size,
      uniqueLocations: locationMap.size,
      avgApplicationWindow: 30
    },
    categories,
    agencies,
    grades,
    locations,
    temporal: {
      monthly: [],
      weekly: []
    },
    workforce: {
      grades,
      seniorityDistribution: []
    },
    skills: {
      topSkills: [],
      emergingSkills: []
    },
    competitive: {
      marketShare: agencies
    }
  };
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const jobs = loadJobs();
  const { agency } = req.query;
  
  const analytics = computeAnalytics(jobs, agency as string);
  
  res.status(200).json({
    success: true,
    data: analytics,
    cached: true,
    timestamp: new Date().toISOString()
  });
}

