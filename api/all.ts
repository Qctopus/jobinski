import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const sql = getDb();
    const { agency } = req.query;
    
    // Base filter for active jobs
    const baseFilter = agency && agency !== 'all' 
      ? sql`WHERE archived = false AND (short_agency = ${agency} OR long_agency LIKE ${'%' + agency + '%'})`
      : sql`WHERE archived = false`;
    
    // Get overview stats
    const overviewResult = await sql`
      SELECT 
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN apply_until::timestamp > NOW() THEN 1 END) as active_jobs,
        COUNT(DISTINCT short_agency) as total_agencies,
        COUNT(DISTINCT duty_country) as unique_locations
      FROM jobs
      WHERE archived = false
      ${agency && agency !== 'all' ? sql`AND (short_agency = ${agency} OR long_agency LIKE ${'%' + agency + '%'})` : sql``}
    `;
    
    // Get category distribution
    const categoryResult = await sql`
      SELECT 
        COALESCE(primary_category, sectoral_category, 'Other') as name,
        COUNT(*) as count
      FROM jobs
      WHERE archived = false
      ${agency && agency !== 'all' ? sql`AND (short_agency = ${agency} OR long_agency LIKE ${'%' + agency + '%'})` : sql``}
      GROUP BY COALESCE(primary_category, sectoral_category, 'Other')
      ORDER BY count DESC
      LIMIT 15
    `;
    
    // Get agency distribution
    const agencyResult = await sql`
      SELECT 
        short_agency as name,
        COUNT(*) as count
      FROM jobs
      WHERE archived = false AND short_agency IS NOT NULL
      GROUP BY short_agency
      ORDER BY count DESC
      LIMIT 20
    `;
    
    // Get grade distribution  
    const gradeResult = await sql`
      SELECT 
        up_grade as name,
        COUNT(*) as count
      FROM jobs
      WHERE archived = false AND up_grade IS NOT NULL
      ${agency && agency !== 'all' ? sql`AND (short_agency = ${agency} OR long_agency LIKE ${'%' + agency + '%'})` : sql``}
      GROUP BY up_grade
      ORDER BY count DESC
    `;
    
    // Get location distribution
    const locationResult = await sql`
      SELECT 
        duty_country as name,
        COUNT(*) as count
      FROM jobs
      WHERE archived = false AND duty_country IS NOT NULL
      ${agency && agency !== 'all' ? sql`AND (short_agency = ${agency} OR long_agency LIKE ${'%' + agency + '%'})` : sql``}
      GROUP BY duty_country
      ORDER BY count DESC
      LIMIT 15
    `;
    
    const overview = overviewResult[0] || {};
    const totalJobs = parseInt(overview.total_jobs || '0');
    
    // Format categories with percentages
    const categories = categoryResult.map(r => ({
      name: r.name,
      count: parseInt(r.count),
      percentage: totalJobs > 0 ? (parseInt(r.count) / totalJobs) * 100 : 0
    }));
    
    // Format agencies with percentages (from full market)
    const totalMarket = parseInt(overviewResult[0]?.total_jobs || '0');
    const agencies = agencyResult.map(r => ({
      name: r.name,
      count: parseInt(r.count),
      percentage: totalMarket > 0 ? (parseInt(r.count) / totalMarket) * 100 : 0
    }));
    
    const grades = gradeResult.map(r => ({
      name: r.name,
      count: parseInt(r.count)
    }));
    
    const locations = locationResult.map(r => ({
      name: r.name,
      count: parseInt(r.count)
    }));
    
    return res.status(200).json({
      success: true,
      data: {
        overview: {
          totalJobs,
          activeJobs: parseInt(overview.active_jobs || '0'),
          totalAgencies: parseInt(overview.total_agencies || '0'),
          uniqueLocations: parseInt(overview.unique_locations || '0'),
          avgApplicationWindow: 30
        },
        categories,
        agencies,
        grades,
        locations,
        temporal: { monthly: [], weekly: [] },
        workforce: { grades, seniorityDistribution: [] },
        skills: { topSkills: [], emergingSkills: [] },
        competitive: { marketShare: agencies }
      },
      cached: false,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
