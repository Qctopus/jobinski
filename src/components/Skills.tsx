import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter
} from 'recharts';
import { 
  TrendingUp, Award, Users, Globe, MapPin, Clock, 
  Zap, Target, Brain, BookOpen, Calendar, Briefcase,
  ChevronRight, Search, Filter, ArrowUp, ArrowDown,
  AlertTriangle
} from 'lucide-react';
import { ProcessedJobData, FilterOptions } from '../types';
import { JobAnalyticsProcessor } from '../services/dataProcessor';

interface SkillsProps {
  data: ProcessedJobData[];
  filters: FilterOptions;
}

type SkillsTab = 'demand' | 'progression' | 'emerging' | 'geographic' | 'benchmarking' | 'intelligence';

const Skills: React.FC<SkillsProps> = ({ data, filters }) => {
  const [selectedTab, setSelectedTab] = useState<SkillsTab>('demand');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState('all');
  const processor = useMemo(() => new JobAnalyticsProcessor(), []);

  const isAgencyView = filters.selectedAgency !== 'all';
  const filteredData = useMemo(() => processor.applyFilters(data, filters), [data, filters, processor]);

  // Define types for the skills analysis
  interface SkillDemandData {
    skill: string;
    count: number;
    agencies: number;
    locations: number;
    avgGrade: number;
    demandLevel: 'High' | 'Medium' | 'Low';
    category: string;
    gradeDistribution: Array<{ grade: string; count: number }>;
  }

  interface SkillsAnalysisType {
    skillDemand: {
      topSkills: SkillDemandData[];
      byCategory: any;
      demandTrends: any;
      criticalSkills: SkillDemandData[];
    };
    careerProgression: any;
    emergingSkills: any;
    geographicDistribution: any;
    agencyBenchmarking: any;
    skillIntelligence: any;
  }

  // Comprehensive skills analysis
  const skillsAnalysis: SkillsAnalysisType = useMemo(() => {
    const analysis: SkillsAnalysisType = {
      skillDemand: calculateSkillDemand(),
      careerProgression: calculateCareerProgression(),
      emergingSkills: calculateEmergingSkills(),
      geographicDistribution: calculateGeographicDistribution(),
      agencyBenchmarking: calculateAgencyBenchmarking(),
      skillIntelligence: calculateSkillIntelligence()
    };
    return analysis;
  }, [filteredData]);

  function calculateSkillDemand(): any {
    const skillFrequency = new Map<string, {
      count: number;
      agencies: Set<string>;
      grades: Map<string, number>;
      locations: Set<string>;
      avgSalaryGrade: number;
      recentTrend: number;
    }>();

    filteredData.forEach(job => {
      if (!job.job_labels) return;
      
      const skills = job.job_labels.split(',').map(s => s.trim()).filter(s => s.length > 2);
      const agency = job.short_agency || job.long_agency || 'Unknown';
      const grade = job.up_grade || 'Unknown';
      const location = job.duty_country || 'Unknown';
      const gradeNumeric = job.grade_numeric || 0;

      skills.forEach(skill => {
        if (!skillFrequency.has(skill)) {
          skillFrequency.set(skill, {
            count: 0,
            agencies: new Set(),
            grades: new Map(),
            locations: new Set(),
            avgSalaryGrade: 0,
            recentTrend: 0
          });
        }
        
        const skillData = skillFrequency.get(skill)!;
        skillData.count++;
        skillData.agencies.add(agency);
        skillData.locations.add(location);
        skillData.grades.set(grade, (skillData.grades.get(grade) || 0) + 1);
        skillData.avgSalaryGrade += gradeNumeric;
      });
    });

    // Calculate averages and trends
    const skillDemandData = Array.from(skillFrequency.entries()).map(([skill, data]) => {
      const avgGrade = data.count > 0 ? data.avgSalaryGrade / data.count : 0;
      
      // Calculate demand level based on frequency and spread
      let demandLevel: 'High' | 'Medium' | 'Low' = 'Low';
      if (data.count > 50 && data.agencies.size > 3) demandLevel = 'High';
      else if (data.count > 20 && data.agencies.size > 2) demandLevel = 'Medium';

      // Determine skill category
      const skillLower = skill.toLowerCase();
      let category = 'General';
      if (skillLower.includes('digital') || skillLower.includes('technology') || skillLower.includes('data')) {
        category = 'Digital & Technology';
      } else if (skillLower.includes('management') || skillLower.includes('leadership')) {
        category = 'Leadership & Management';
      } else if (skillLower.includes('communication') || skillLower.includes('language')) {
        category = 'Communication';
      } else if (skillLower.includes('analysis') || skillLower.includes('research')) {
        category = 'Analytical';
      }

      return {
        skill,
        count: data.count,
        agencies: data.agencies.size,
        locations: data.locations.size,
        avgGrade: Math.round(avgGrade * 10) / 10,
        demandLevel,
        category,
        gradeDistribution: Array.from(data.grades.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([grade, count]) => ({ grade, count }))
      };
    }).sort((a, b) => b.count - a.count);

    return {
      topSkills: skillDemandData.slice(0, 20),
      byCategory: groupByCategory(skillDemandData.slice(0, 100)),
      demandTrends: calculateDemandTrends(skillDemandData.slice(0, 50)),
      criticalSkills: skillDemandData.filter(s => s.demandLevel === 'High').slice(0, 15)
    };
  }

  function calculateCareerProgression(): any {
    const gradeGroups = {
      'Entry (P1-P2)': (job: ProcessedJobData) => ['P1', 'P2', 'G1', 'G2', 'G3'].some(g => job.up_grade?.includes(g)),
      'Mid (P3-P4)': (job: ProcessedJobData) => ['P3', 'P4', 'G4', 'G5', 'G6'].some(g => job.up_grade?.includes(g)),
      'Senior (P5+)': (job: ProcessedJobData) => ['P5', 'P6', 'D1', 'D2', 'L6', 'L7'].some(g => job.up_grade?.includes(g))
    };

    const gradeSkills = Object.fromEntries(
      Object.entries(gradeGroups).map(([grade, filter]) => {
        const jobs = filteredData.filter(filter);
        const skillCounts = new Map<string, number>();
        
        jobs.forEach(job => {
          if (job.job_labels) {
            job.job_labels.split(',').forEach(skill => {
              const cleanSkill = skill.trim();
              if (cleanSkill.length > 2) {
                skillCounts.set(cleanSkill, (skillCounts.get(cleanSkill) || 0) + 1);
              }
            });
          }
        });

        const topSkills = Array.from(skillCounts.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([skill, count]) => ({
            skill,
            count,
            percentage: Math.round((count / jobs.length) * 100)
          }));

        return [grade, {
          totalJobs: jobs.length,
          topSkills,
          avgExperience: jobs.reduce((sum, job) => sum + (job.relevant_experience || 0), 0) / jobs.length
        }];
      })
    );

    // Identify skills that grow with career progression
    const progressionSkills = identifyProgressionSkills(gradeSkills);
    const competencyGaps = identifyCompetencyGaps(gradeSkills);

    return {
      gradeSkills,
      progressionSkills,
      competencyGaps,
      skillEvolution: calculateSkillEvolution(gradeSkills)
    };
  }

  function calculateEmergingSkills(): any {
    const currentYear = new Date().getFullYear();
    const recentJobs = filteredData.filter(job => job.posting_year >= currentYear - 1);
    const olderJobs = filteredData.filter(job => job.posting_year < currentYear - 1);

    const recentSkills = extractSkillCounts(recentJobs);
    const olderSkills = extractSkillCounts(olderJobs);

    const emergingSkills = Array.from(recentSkills.entries())
      .map(([skill, recentCount]) => {
        const olderCount = olderSkills.get(skill) || 0;
        const growth = olderCount > 0 ? ((recentCount - olderCount) / olderCount) * 100 : 100;
        
        return {
          skill,
          recentCount,
          olderCount,
          growth: Math.round(growth),
          isNew: olderCount === 0,
          velocity: recentCount / Math.max(recentJobs.length, 1) * 100
        };
      })
      .filter(item => item.growth > 0 || item.isNew)
      .sort((a, b) => b.growth - a.growth);

    const decliningSkills = Array.from(olderSkills.entries())
      .filter(([skill]) => !recentSkills.has(skill) || recentSkills.get(skill)! < olderSkills.get(skill)! * 0.5)
      .map(([skill, count]) => ({
        skill,
        previousCount: count,
        currentCount: recentSkills.get(skill) || 0,
        decline: Math.round(((count - (recentSkills.get(skill) || 0)) / count) * 100)
      }))
      .sort((a, b) => b.decline - a.decline);

    return {
      emerging: emergingSkills.slice(0, 15),
      declining: decliningSkills.slice(0, 10),
      newSkills: emergingSkills.filter(s => s.isNew).slice(0, 8),
      fastestGrowing: emergingSkills.filter(s => !s.isNew && s.growth > 50).slice(0, 12)
    };
  }

  function calculateGeographicDistribution(): any {
    const locationSkills = new Map<string, Map<string, number>>();
    
    filteredData.forEach(job => {
      if (!job.job_labels || !job.duty_country) return;
      
      const location = job.duty_country;
      if (!locationSkills.has(location)) {
        locationSkills.set(location, new Map());
      }
      
      const skillMap = locationSkills.get(location)!;
      job.job_labels.split(',').forEach(skill => {
        const cleanSkill = skill.trim();
        if (cleanSkill.length > 2) {
          skillMap.set(cleanSkill, (skillMap.get(cleanSkill) || 0) + 1);
        }
      });
    });

    const locationData = Array.from(locationSkills.entries())
      .filter(([, skills]) => skills.size > 0)
      .map(([location, skills]) => {
        const totalJobs = Array.from(skills.values()).reduce((sum, count) => sum + count, 0);
        const topSkills = Array.from(skills.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([skill, count]) => ({ skill, count, percentage: (count / totalJobs) * 100 }));
        
        return {
          location,
          totalJobs,
          skillCount: skills.size,
          topSkills,
          specialization: topSkills[0]?.percentage || 0
        };
      })
      .sort((a, b) => b.totalJobs - a.totalJobs);

    return {
      locationData: locationData.slice(0, 20),
      skillClusters: identifySkillClusters(locationSkills),
      regionalSpecializations: identifyRegionalSpecializations(locationData)
    };
  }

  function calculateAgencyBenchmarking(): any {
    if (isAgencyView) {
      // For agency view, show how this agency compares to others
      return compareAgencySkills();
    } else {
      // For market view, show cross-agency skill patterns
      return analyzeAgencySkillPatterns();
    }
  }

  function calculateSkillIntelligence(): any {
    const analysis = {
      skillGaps: identifySkillGaps(),
      futureSkills: predictFutureSkills(),
      recruitmentInsights: generateRecruitmentInsights(),
      talentCompetition: analyzeTalentCompetition()
    };
    
    return analysis;
  }

  // Helper functions
  function groupByCategory(skills: any[]) {
    const categories = new Map<string, any[]>();
    skills.forEach(skill => {
      if (!categories.has(skill.category)) {
        categories.set(skill.category, []);
      }
      categories.get(skill.category)!.push(skill);
    });
    return Array.from(categories.entries()).map(([category, skills]) => ({
      category,
      skills: skills.slice(0, 8),
      totalDemand: skills.reduce((sum, s) => sum + s.count, 0)
    }));
  }

  function calculateDemandTrends(skills: any[]) {
    // Simplified trend calculation - in real implementation would use time series
    return skills.map(skill => ({
      skill: skill.skill,
      trend: Math.random() > 0.5 ? 'rising' : 'stable',
      velocity: Math.floor(Math.random() * 50)
    }));
  }

  function extractSkillCounts(jobs: ProcessedJobData[]) {
    const skillCounts = new Map<string, number>();
    jobs.forEach(job => {
      if (job.job_labels) {
        job.job_labels.split(',').forEach(skill => {
          const cleanSkill = skill.trim();
          if (cleanSkill.length > 2) {
            skillCounts.set(cleanSkill, (skillCounts.get(cleanSkill) || 0) + 1);
          }
        });
      }
    });
    return skillCounts;
  }

  function identifyProgressionSkills(gradeSkills: any) {
    const allGrades = Object.keys(gradeSkills);
    const progressionSkills: any[] = [];
    
    // Find skills that appear more frequently at higher grades
    const entrySkills = new Map<string, number>(gradeSkills['Entry (P1-P2)']?.topSkills.map((s: any) => [s.skill, s.percentage]) || []);
    const seniorSkills = new Map<string, number>(gradeSkills['Senior (P5+)']?.topSkills.map((s: any) => [s.skill, s.percentage]) || []);
    
    seniorSkills.forEach((seniorPct: number, skill: string) => {
      const entryPct = entrySkills.get(skill) || 0;
      if (seniorPct > entryPct + 10) {
        progressionSkills.push({
          skill,
          entryLevel: entryPct,
          seniorLevel: seniorPct,
          growth: seniorPct - entryPct
        });
      }
    });
    
    return progressionSkills.sort((a, b) => b.growth - a.growth).slice(0, 10);
  }

  function identifyCompetencyGaps(gradeSkills: any) {
    // Identify skills that are common at senior level but rare at entry
    const gaps: any[] = [];
    const seniorSkills = gradeSkills['Senior (P5+)']?.topSkills || [];
    const entrySkills = new Set(gradeSkills['Entry (P1-P2)']?.topSkills.map((s: any) => s.skill) || []);
    
    seniorSkills.forEach((skill: any) => {
      if (!entrySkills.has(skill.skill) && skill.percentage > 20) {
        gaps.push({
          skill: skill.skill,
          seniorDemand: skill.percentage,
          gap: 'Critical competency for advancement'
        });
      }
    });
    
    return gaps.slice(0, 8);
  }

  function calculateSkillEvolution(gradeSkills: any) {
    // Show how skill requirements change across career levels
    const allSkills = new Set<string>();
    Object.values(gradeSkills).forEach((grade: any) => {
      grade.topSkills?.forEach((skill: any) => allSkills.add(skill.skill));
    });
    
    return Array.from(allSkills).slice(0, 15).map(skill => {
      const evolution = Object.entries(gradeSkills).map(([grade, data]: [string, any]) => {
        const skillData = data.topSkills?.find((s: any) => s.skill === skill);
        return {
          grade: grade.replace(/\([^)]*\)/g, '').trim(),
          percentage: skillData?.percentage || 0
        };
      });
      
      return { skill, evolution };
    });
  }

  function identifySkillClusters(locationSkills: Map<string, Map<string, number>>) {
    // Simplified clustering - group locations with similar skill patterns
    const clusters: any[] = [];
    const locations = Array.from(locationSkills.keys()).slice(0, 10);
    
    locations.forEach(location => {
      const skills = locationSkills.get(location)!;
      const topSkills = Array.from(skills.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([skill]) => skill);
      
      clusters.push({
        location,
        cluster: topSkills.join(', ')
      });
    });
    
    return clusters;
  }

  function identifyRegionalSpecializations(locationData: any[]) {
    return locationData
      .filter(loc => loc.specialization > 30)
      .map(loc => ({
        location: loc.location,
        specialization: loc.topSkills[0]?.skill || 'Unknown',
        strength: loc.specialization
      }))
      .slice(0, 8);
  }

  function compareAgencySkills(): any {
    // Compare current agency to market
    const agencyName = filters.selectedAgency;
    const marketSkills = extractSkillCounts(data);
    const agencySkills = extractSkillCounts(filteredData);
    
    const comparison = Array.from(agencySkills.entries())
      .map(([skill, agencyCount]) => {
        const marketCount = marketSkills.get(skill) || 0;
        const agencyShare = (agencyCount / filteredData.length) * 100;
        const marketShare = (marketCount / data.length) * 100;
        
        return {
          skill,
          agencyShare: Math.round(agencyShare),
          marketShare: Math.round(marketShare),
          competitive: agencyShare > marketShare,
          gap: Math.round(Math.abs(agencyShare - marketShare))
        };
      })
      .sort((a, b) => b.agencyShare - a.agencyShare);
    
    return {
      agencyName,
      strengths: comparison.filter(s => s.competitive).slice(0, 10),
      gaps: comparison.filter(s => !s.competitive && s.gap > 2).slice(0, 10),
      uniqueSkills: comparison.filter(s => s.marketShare === 0).slice(0, 5)
    };
  }

  function analyzeAgencySkillPatterns(): any {
    const agencies = [...new Set(data.map(job => job.short_agency || job.long_agency).filter(Boolean))];
    
    return agencies.slice(0, 10).map(agency => {
      const agencyJobs = data.filter(job => (job.short_agency || job.long_agency) === agency);
      const skills = extractSkillCounts(agencyJobs);
      const topSkills = Array.from(skills.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([skill, count]) => ({ skill, count }));
      
      return {
        agency,
        totalJobs: agencyJobs.length,
        topSkills,
        specialization: topSkills[0]?.count || 0
      };
    });
  }

  function identifySkillGaps(): any {
    // Identify skills with high demand but low supply
    const skillDemand = skillsAnalysis.skillDemand.topSkills;
    return skillDemand
      .filter(skill => skill.demandLevel === 'High' && skill.agencies < 3)
      .slice(0, 8)
      .map(skill => ({
        skill: skill.skill,
        demand: skill.count,
        supply: skill.agencies,
        gapLevel: 'Critical'
      }));
  }

  function predictFutureSkills(): any {
    // Based on emerging trends, predict future important skills
    const emerging = skillsAnalysis.emergingSkills.emerging;
    return emerging
      .filter((skill: any) => skill.growth > 100)
      .slice(0, 6)
      .map((skill: any) => ({
        skill: skill.skill,
        prediction: 'High growth expected',
        confidence: skill.growth > 200 ? 'High' : 'Medium'
      }));
  }

  function generateRecruitmentInsights(): any {
    return {
      hotSkills: skillsAnalysis.skillDemand.criticalSkills.slice(0, 5),
      talentPools: ['Technology professionals', 'Policy experts', 'Project managers'],
      competitiveLandscape: 'High competition for digital skills'
    };
  }

  function analyzeTalentCompetition(): any {
    const topSkills = skillsAnalysis.skillDemand.topSkills.slice(0, 10);
    return topSkills.map(skill => ({
      skill: skill.skill,
      competition: skill.agencies > 5 ? 'High' : skill.agencies > 2 ? 'Medium' : 'Low',
      agencies: skill.agencies
    }));
  }

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#059669'];

  const renderDemandAnalysis = () => (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Award className="h-5 w-5 text-blue-500" />
            <h4 className="font-semibold text-gray-900">Total Skills</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {skillsAnalysis.skillDemand.topSkills.length}
          </p>
          <p className="text-sm text-gray-600">Identified across system</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <h4 className="font-semibold text-gray-900">High Demand</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {skillsAnalysis.skillDemand.criticalSkills.length}
          </p>
          <p className="text-sm text-gray-600">Critical skills shortage</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="h-5 w-5 text-purple-500" />
            <h4 className="font-semibold text-gray-900">Global Reach</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {Math.max(...skillsAnalysis.skillDemand.topSkills.map(s => s.agencies))}
          </p>
          <p className="text-sm text-gray-600">Max agencies per skill</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-orange-500" />
            <h4 className="font-semibold text-gray-900">Top Skill</h4>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {skillsAnalysis.skillDemand.topSkills[0]?.skill || 'N/A'}
          </p>
          <p className="text-sm text-gray-600">{skillsAnalysis.skillDemand.topSkills[0]?.count || 0} positions</p>
        </div>
      </div>

      {/* Skills by Category */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Skills Demand by Category</h3>
          <p className="text-sm text-gray-600 mt-1">Most sought-after skills organized by functional area</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {skillsAnalysis.skillDemand.byCategory.slice(0, 6).map((category: any, index: number) => (
              <div key={category.category} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">{category.category}</h4>
                  <span className="text-sm text-gray-500">{category.totalDemand} total positions</span>
                </div>
                
                <div className="space-y-2">
                  {category.skills.slice(0, 5).map((skill: any, skillIndex: number) => (
                    <div key={skill.skill} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: colors[skillIndex % colors.length] }}
                        />
                        <span className="text-sm text-gray-700">{skill.skill}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{skill.count}</div>
                        <div className="text-xs text-gray-500">{skill.agencies} agencies</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Skills Chart */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Top Skills in Demand</h3>
          <p className="text-sm text-gray-600 mt-1">Most frequently requested skills across all positions</p>
        </div>
        
        <div className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={skillsAnalysis.skillDemand.topSkills.slice(0, 15)} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="skill" type="category" width={120} fontSize={11} />
              <Tooltip 
                formatter={(value: any) => [`${value} positions`, 'Demand']}
                labelFormatter={(skill: any) => `Skill: ${skill}`}
              />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Critical Skills */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Critical Skills Analysis</h3>
          <p className="text-sm text-gray-600 mt-1">High-demand skills with significant market impact</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skillsAnalysis.skillDemand.criticalSkills.map((skill, index) => (
              <div key={skill.skill} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-red-500" />
                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                      {skill.demandLevel}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{skill.count}</span>
                </div>
                
                <h4 className="font-medium text-gray-900 mb-2">{skill.skill}</h4>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Agencies:</span>
                    <span className="font-medium">{skill.agencies}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Locations:</span>
                    <span className="font-medium">{skill.locations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Grade:</span>
                    <span className="font-medium">{skill.avgGrade}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderProgressionAnalysis = () => (
    <div className="space-y-8">
      {/* Career Progression Overview */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Skills by Career Level</h3>
          <p className="text-sm text-gray-600 mt-1">How skill requirements evolve across UN grade levels</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(skillsAnalysis.careerProgression.gradeSkills).map(([grade, data]: [string, any]) => (
              <div key={grade} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{grade}</h4>
                  <span className="text-sm text-gray-600">{data.totalJobs} positions</span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Experience:</span>
                    <span className="font-medium">{Math.round(data.avgExperience)} years</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 mb-2">Top Required Skills:</p>
                  <div className="space-y-1">
                    {data.topSkills.slice(0, 5).map((skill: any) => (
                      <div key={skill.skill} className="flex justify-between text-xs">
                        <span className="text-gray-700 truncate flex-1 mr-2">{skill.skill}</span>
                        <span className="text-gray-500">{skill.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Skills that Grow with Career */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Career Progression Skills</h3>
          <p className="text-sm text-gray-600 mt-1">Skills that become more important at higher levels</p>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {skillsAnalysis.careerProgression.progressionSkills.map((skill: any, index: number) => (
              <div key={skill.skill} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">{skill.skill}</div>
                    <div className="text-sm text-gray-600">
                      Entry: {skill.entryLevel}% → Senior: {skill.seniorLevel}%
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">+{skill.growth}%</div>
                  <div className="text-xs text-gray-500">growth</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Competency Gaps */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Competency Gaps</h3>
          <p className="text-sm text-gray-600 mt-1">Critical skills for career advancement</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skillsAnalysis.careerProgression.competencyGaps.map((gap: any, index: number) => (
              <div key={gap.skill} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-orange-600" />
                  <h4 className="font-medium text-orange-900">{gap.skill}</h4>
                </div>
                <p className="text-sm text-orange-700 mb-2">{gap.gap}</p>
                <div className="text-sm text-orange-600">
                  <strong>{gap.seniorDemand}%</strong> of senior positions require this skill
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Skill Evolution Chart */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Skill Evolution Across Grades</h3>
          <p className="text-sm text-gray-600 mt-1">How specific skills change in importance by career level</p>
        </div>
        
        <div className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={skillsAnalysis.careerProgression.skillEvolution[0]?.evolution || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grade" />
              <YAxis label={{ value: 'Requirement %', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              {skillsAnalysis.careerProgression.skillEvolution.slice(0, 5).map((skillData: any, index: number) => (
                <Line
                  key={skillData.skill}
                  type="monotone"
                  dataKey="percentage"
                  data={skillData.evolution}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  name={skillData.skill}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderEmergingSkills = () => (
    <div className="space-y-8">
      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="h-5 w-5 text-green-500" />
            <h4 className="font-semibold text-gray-900">Emerging</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {skillsAnalysis.emergingSkills.emerging.length}
          </p>
          <p className="text-sm text-gray-600">Growing skills</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <ArrowUp className="h-5 w-5 text-blue-500" />
            <h4 className="font-semibold text-gray-900">New Skills</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {skillsAnalysis.emergingSkills.newSkills.length}
          </p>
          <p className="text-sm text-gray-600">First appeared recently</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <ArrowDown className="h-5 w-5 text-red-500" />
            <h4 className="font-semibold text-gray-900">Declining</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {skillsAnalysis.emergingSkills.declining.length}
          </p>
          <p className="text-sm text-gray-600">Reducing demand</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-5 w-5 text-purple-500" />
            <h4 className="font-semibold text-gray-900">Fast Growing</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {skillsAnalysis.emergingSkills.fastestGrowing.length}
          </p>
          <p className="text-sm text-gray-600">High velocity growth</p>
        </div>
      </div>

      {/* Emerging Skills */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Fastest Growing Skills</h3>
          <p className="text-sm text-gray-600 mt-1">Skills showing the highest growth in demand</p>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {skillsAnalysis.emergingSkills.emerging.slice(0, 10).map((skill: any, index: number) => (
              <div key={skill.skill} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  {skill.isNew ? (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">NEW</span>
                    </div>
                  ) : (
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  )}
                  <div>
                    <div className="font-medium text-gray-900">{skill.skill}</div>
                    <div className="text-sm text-gray-600">
                      Current: {skill.recentCount} positions | Previous: {skill.olderCount}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">+{skill.growth}%</div>
                  <div className="text-xs text-gray-500">growth</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Skills */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Newly Identified Skills</h3>
          <p className="text-sm text-gray-600 mt-1">Skills that have appeared in recent job postings</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skillsAnalysis.emergingSkills.newSkills.map((skill: any, index: number) => (
              <div key={skill.skill} className="border border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-xs font-medium text-green-600">NEW SKILL</span>
                </div>
                <h4 className="font-medium text-green-900 mb-1">{skill.skill}</h4>
                <p className="text-sm text-green-700">{skill.recentCount} recent positions</p>
                <p className="text-xs text-green-600 mt-2">
                  Velocity: {Math.round(skill.velocity)}% of recent jobs
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Declining Skills */}
      {skillsAnalysis.emergingSkills.declining.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Declining Skills</h3>
            <p className="text-sm text-gray-600 mt-1">Skills showing reduced demand</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-3">
              {skillsAnalysis.emergingSkills.declining.slice(0, 8).map((skill: any, index: number) => (
                <div key={skill.skill} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ArrowDown className="h-4 w-4 text-red-600" />
                    <div>
                      <div className="font-medium text-gray-900">{skill.skill}</div>
                      <div className="text-sm text-gray-600">
                        Previous: {skill.previousCount} → Current: {skill.currentCount}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-red-600">-{skill.decline}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderGeographicAnalysis = () => (
    <div className="space-y-8">
      {/* Geographic Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="h-5 w-5 text-blue-500" />
            <h4 className="font-semibold text-gray-900">Locations</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {skillsAnalysis.geographicDistribution.locationData.length}
          </p>
          <p className="text-sm text-gray-600">Countries with skill data</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-5 w-5 text-green-500" />
            <h4 className="font-semibold text-gray-900">Specializations</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {skillsAnalysis.geographicDistribution.regionalSpecializations.length}
          </p>
          <p className="text-sm text-gray-600">Strong regional focuses</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="h-5 w-5 text-purple-500" />
            <h4 className="font-semibold text-gray-900">Top Location</h4>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {skillsAnalysis.geographicDistribution.locationData[0]?.location || 'N/A'}
          </p>
          <p className="text-sm text-gray-600">
            {skillsAnalysis.geographicDistribution.locationData[0]?.totalJobs || 0} positions
          </p>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Skills by Location</h3>
          <p className="text-sm text-gray-600 mt-1">Geographic distribution of skill demand</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {skillsAnalysis.geographicDistribution.locationData.slice(0, 12).map((location: any, index: number) => (
              <div key={location.location} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{location.location}</h4>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{location.totalJobs}</div>
                    <div className="text-xs text-gray-500">positions</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Unique Skills:</span>
                    <span className="font-medium">{location.skillCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Specialization:</span>
                    <span className="font-medium">{Math.round(location.specialization)}%</span>
                  </div>
                </div>
                
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">Top Skills:</p>
                  <div className="space-y-1">
                    {location.topSkills.slice(0, 3).map((skill: any) => (
                      <div key={skill.skill} className="flex justify-between text-xs">
                        <span className="text-gray-700 truncate flex-1 mr-2">{skill.skill}</span>
                        <span className="text-gray-500">{Math.round(skill.percentage)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Regional Specializations */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Regional Specializations</h3>
          <p className="text-sm text-gray-600 mt-1">Locations with strong focus on specific skills</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skillsAnalysis.geographicDistribution.regionalSpecializations.map((spec: any, index: number) => (
              <div key={spec.location} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-blue-900">{spec.location}</h4>
                </div>
                <p className="text-sm text-blue-800 font-medium mb-1">{spec.specialization}</p>
                <p className="text-xs text-blue-600">
                  <strong>{Math.round(spec.strength)}%</strong> of positions focus on this skill
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Skill Clusters */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Geographic Skill Clusters</h3>
          <p className="text-sm text-gray-600 mt-1">Common skill patterns by location</p>
        </div>
        
        <div className="p-6">
          <div className="space-y-3">
            {skillsAnalysis.geographicDistribution.skillClusters.map((cluster: any, index: number) => (
              <div key={cluster.location} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-900">{cluster.location}</span>
                </div>
                <span className="text-sm text-gray-600">{cluster.cluster}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderBenchmarkingAnalysis = () => {
    if (isAgencyView) {
      const comparison = skillsAnalysis.agencyBenchmarking as any;
      return (
        <div className="space-y-8">
          {/* Agency Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {comparison.agencyName} Skills Comparison
            </h3>
            <p className="text-gray-600">How your agency's skill portfolio compares to the broader UN system</p>
          </div>

          {/* Strengths vs Gaps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Strengths */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-green-700">Competitive Strengths</h4>
                <p className="text-sm text-gray-600 mt-1">Skills where you outperform the market</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  {comparison.strengths.map((strength: any, index: number) => (
                    <div key={strength.skill} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{strength.skill}</div>
                        <div className="text-sm text-gray-600">
                          You: {strength.agencyShare}% vs Market: {strength.marketShare}%
                        </div>
                      </div>
                      <div className="text-green-600 font-bold">+{strength.gap}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gaps */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-red-700">Skill Gaps</h4>
                <p className="text-sm text-gray-600 mt-1">Areas where the market leads</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  {comparison.gaps.map((gap: any, index: number) => (
                    <div key={gap.skill} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{gap.skill}</div>
                        <div className="text-sm text-gray-600">
                          You: {gap.agencyShare}% vs Market: {gap.marketShare}%
                        </div>
                      </div>
                      <div className="text-red-600 font-bold">-{gap.gap}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Unique Skills */}
          {comparison.uniqueSkills.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-purple-700">Unique Skills</h4>
                <p className="text-sm text-gray-600 mt-1">Skills exclusive to your agency</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {comparison.uniqueSkills.map((skill: any) => (
                    <div key={skill.skill} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-4 w-4 text-purple-600" />
                        <span className="text-xs font-medium text-purple-600">UNIQUE</span>
                      </div>
                      <h5 className="font-medium text-purple-900">{skill.skill}</h5>
                      <p className="text-sm text-purple-700">{skill.agencyShare}% of your positions</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    } else {
      const patterns = skillsAnalysis.agencyBenchmarking as any[];
      return (
        <div className="space-y-8">
          {/* Cross-Agency Patterns */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Agency Skill Specializations</h3>
              <p className="text-sm text-gray-600 mt-1">How different agencies focus on specific skill areas</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {patterns.slice(0, 10).map((agency, index) => (
                  <div key={agency.agency} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{agency.agency}</h4>
                      <span className="text-sm text-gray-600">{agency.totalJobs} positions</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Specialization Score:</span>
                        <span className="font-medium">{agency.specialization}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">Top Skills:</p>
                      <div className="space-y-1">
                        {agency.topSkills.slice(0, 4).map((skill: any) => (
                          <div key={skill.skill} className="flex justify-between text-xs">
                            <span className="text-gray-700 truncate flex-1 mr-2">{skill.skill}</span>
                            <span className="text-gray-500">{skill.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderIntelligenceAnalysis = () => (
    <div className="space-y-8">
      {/* Strategic Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <h4 className="font-semibold text-gray-900">Skill Gaps</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {skillsAnalysis.skillIntelligence.skillGaps.length}
          </p>
          <p className="text-sm text-gray-600">Critical shortages</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            <h4 className="font-semibold text-gray-900">Future Skills</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {skillsAnalysis.skillIntelligence.futureSkills.length}
          </p>
          <p className="text-sm text-gray-600">Predicted growth</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="h-5 w-5 text-green-500" />
            <h4 className="font-semibold text-gray-900">Hot Skills</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {skillsAnalysis.skillIntelligence.recruitmentInsights.hotSkills.length}
          </p>
          <p className="text-sm text-gray-600">High demand</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-orange-500" />
            <h4 className="font-semibold text-gray-900">Competition</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {skillsAnalysis.skillIntelligence.talentCompetition.filter((t: any) => t.competition === 'High').length}
          </p>
          <p className="text-sm text-gray-600">High competition skills</p>
        </div>
      </div>

      {/* Skill Gaps */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Critical Skill Gaps</h3>
          <p className="text-sm text-gray-600 mt-1">Skills with high demand but limited supply</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {skillsAnalysis.skillIntelligence.skillGaps.map((gap: any, index: number) => (
              <div key={gap.skill} className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                    {gap.gapLevel}
                  </span>
                </div>
                <h4 className="font-medium text-red-900 mb-2">{gap.skill}</h4>
                <div className="space-y-1 text-sm text-red-700">
                  <div className="flex justify-between">
                    <span>Demand:</span>
                    <span className="font-medium">{gap.demand} positions</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Supply:</span>
                    <span className="font-medium">{gap.supply} agencies</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Future Skills */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Future Skill Predictions</h3>
          <p className="text-sm text-gray-600 mt-1">Skills expected to become increasingly important</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skillsAnalysis.skillIntelligence.futureSkills.map((skill: any, index: number) => (
              <div key={skill.skill} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    skill.confidence === 'High' 
                      ? 'text-green-600 bg-green-100' 
                      : 'text-yellow-600 bg-yellow-100'
                  }`}>
                    {skill.confidence} CONFIDENCE
                  </span>
                </div>
                <h4 className="font-medium text-blue-900 mb-1">{skill.skill}</h4>
                <p className="text-sm text-blue-700">{skill.prediction}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Talent Competition */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Talent Competition Analysis</h3>
          <p className="text-sm text-gray-600 mt-1">Competition level for top skills across agencies</p>
        </div>
        
        <div className="p-6">
          <div className="space-y-3">
            {skillsAnalysis.skillIntelligence.talentCompetition.map((comp: any, index: number) => (
              <div key={comp.skill} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    comp.competition === 'High' ? 'bg-red-500' :
                    comp.competition === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div>
                    <div className="font-medium text-gray-900">{comp.skill}</div>
                    <div className="text-sm text-gray-600">{comp.agencies} agencies competing</div>
                  </div>
                </div>
                <span className={`text-sm font-medium px-2 py-1 rounded ${
                  comp.competition === 'High' ? 'text-red-700 bg-red-100' :
                  comp.competition === 'Medium' ? 'text-yellow-700 bg-yellow-100' :
                  'text-green-700 bg-green-100'
                }`}>
                  {comp.competition}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategic Insights */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <h4 className="font-semibold text-purple-900 mb-4">🎯 Strategic Skills Intelligence</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h5 className="font-medium text-purple-800 mb-2">Immediate Actions:</h5>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Address critical skill gaps through targeted recruitment</li>
              <li>• Invest in emerging technologies and digital skills</li>
              <li>• Develop internal training for future skills</li>
              <li>• Monitor competitor hiring in high-demand areas</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-blue-800 mb-2">Medium-term Strategy:</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Build partnerships with skill-specialized organizations</li>
              <li>• Create career progression paths for in-demand skills</li>
              <li>• Establish centers of excellence for critical competencies</li>
              <li>• Develop cross-training programs</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-indigo-800 mb-2">Long-term Planning:</h5>
            <ul className="text-sm text-indigo-700 space-y-1">
              <li>• Anticipate future skill requirements</li>
              <li>• Build organizational learning capabilities</li>
              <li>• Create adaptive workforce strategies</li>
              <li>• Invest in continuous skill development</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'demand', label: 'Skill Demand', icon: Award },
    { id: 'progression', label: 'Career Progression', icon: TrendingUp },
    { id: 'emerging', label: 'Emerging Skills', icon: Zap },
    { id: 'geographic', label: 'Geographic Analysis', icon: Globe },
    { id: 'benchmarking', label: 'Benchmarking', icon: Target },
    { id: 'intelligence', label: 'Skills Intelligence', icon: Brain }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Comprehensive Skills Analysis</h2>
            <p className="text-gray-600 mt-1">
              {isAgencyView 
                ? `Deep insights into ${filters.selectedAgency} skill portfolio and market positioning`
                : "System-wide skill trends, emerging competencies, and strategic intelligence"
              }
            </p>
          </div>
          
          {/* Skills Filter */}
          <div className="flex items-center gap-3">
            <select
              value={selectedSkillFilter}
              onChange={(e) => setSelectedSkillFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Skills</option>
              <option value="digital">Digital & Technology</option>
              <option value="leadership">Leadership & Management</option>
              <option value="communication">Communication</option>
              <option value="analytical">Analytical</option>
            </select>
            <Search className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as SkillsTab)}
                className={`group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {selectedTab === 'demand' && renderDemandAnalysis()}
          {selectedTab === 'progression' && renderProgressionAnalysis()}
          {selectedTab === 'emerging' && renderEmergingSkills()}
          {selectedTab === 'geographic' && renderGeographicAnalysis()}
          {selectedTab === 'benchmarking' && renderBenchmarkingAnalysis()}
          {selectedTab === 'intelligence' && renderIntelligenceAnalysis()}
        </div>
      </div>
    </div>
  );
};

export default Skills;
