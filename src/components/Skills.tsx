import React, { useMemo } from 'react';
import { BarChart, LineChart, AreaChart } from './charts';
import { 
  TrendingUp, Award, Users, Globe, MapPin, Clock, 
  Zap, Target, Brain, BookOpen, Briefcase,
  ArrowUp, ArrowDown, AlertTriangle,
  Lightbulb, Star, Activity, BarChart3
} from 'lucide-react';
import { ProcessedJobData, FilterOptions } from '../types';
import { JOB_CLASSIFICATION_DICTIONARY } from '../dictionary';
import { useDataProcessing } from '../contexts/DataProcessingContext';

interface SkillsProps {
  data: ProcessedJobData[];
  filters: FilterOptions;
}

const Skills: React.FC<SkillsProps> = ({ data, filters }) => {
  const dataProcessing = useDataProcessing();

  const isAgencyView = filters.selectedAgency !== 'all';
  const filteredData = useMemo(() => {
    if (!data || !dataProcessing || !dataProcessing.getFilteredData) {
      return [];
    }
    try {
      const result = dataProcessing.getFilteredData(data, filters);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error filtering data:', error);
      return [];
    }
  }, [data, filters, dataProcessing]);

  // Enhanced skills analysis using context
  const skillsAnalysis = useMemo(() => {
    if (!filteredData || filteredData.length === 0 || !dataProcessing || !dataProcessing.getSkillsAnalysis) {
      return {
        topSkills: [],
        skillTrends: [],
        emergingSkills: [],
        skillsByCategory: [],
        rareSkills: []
      };
    }
    try {
      const result = dataProcessing.getSkillsAnalysis(filteredData);
      return result || {
        topSkills: [],
        skillTrends: [],
        emergingSkills: [],
        skillsByCategory: [],
        rareSkills: []
      };
    } catch (error) {
      console.error('Error analyzing skills:', error);
      return {
        topSkills: [],
        skillTrends: [],
        emergingSkills: [],
        skillsByCategory: [],
        rareSkills: []
      };
    }
  }, [filteredData, dataProcessing]);

  // Career progression analysis with real data
  const careerProgression = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return {};
    }
    
    const gradeMapping = {
      'Entry Level': (grade: string) => ['P1', 'P2', 'G1', 'G2', 'G3', 'NOA', 'NOB'].some(g => grade?.includes(g)),
      'Mid Level': (grade: string) => ['P3', 'P4', 'G4', 'G5', 'G6', 'NOC', 'NOD'].some(g => grade?.includes(g)),
      'Senior Level': (grade: string) => ['P5', 'P6', 'G7', 'G8', 'L6', 'L7'].some(g => grade?.includes(g)),
      'Executive': (grade: string) => ['D1', 'D2', 'ASG', 'USG'].some(g => grade?.includes(g))
    };

    const progressionData = Object.fromEntries(
      Object.entries(gradeMapping).map(([level, gradeFilter]) => {
        const levelJobs = filteredData.filter(job => gradeFilter(job.up_grade || ''));
        const skillCounts = new Map<string, number>();
        
        levelJobs.forEach(job => {
          if (job.job_labels) {
            job.job_labels.split(',').forEach(skill => {
              const cleanSkill = skill.trim();
              if (cleanSkill.length > 1) {
                skillCounts.set(cleanSkill, (skillCounts.get(cleanSkill) || 0) + 1);
              }
            });
          }
        });

        const topSkills = Array.from(skillCounts.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 6)
          .map(([skill, count]) => ({
            skill,
            count,
            percentage: levelJobs.length > 0 ? Math.round((count / levelJobs.length) * 100) : 0
          }));

        return [level, { totalJobs: levelJobs.length, topSkills }];
      })
    );

    return progressionData;
  }, [filteredData]);

  // Geographic distribution with real location data
  const geographicDistribution = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return [];
    }
    
    const locationSkills = new Map<string, { skills: Map<string, number>; totalJobs: number }>();
    
    filteredData.forEach(job => {
      if (!job.job_labels || !job.duty_country) return;
      
      const location = job.duty_country;
      if (!locationSkills.has(location)) {
        locationSkills.set(location, { skills: new Map(), totalJobs: 0 });
      }
      
      const locationData = locationSkills.get(location)!;
      locationData.totalJobs++;
      
      job.job_labels.split(',').forEach(skill => {
        const cleanSkill = skill.trim();
        if (cleanSkill.length > 1) {
          locationData.skills.set(cleanSkill, (locationData.skills.get(cleanSkill) || 0) + 1);
        }
      });
    });

    return Array.from(locationSkills.entries())
      .filter(([, data]) => data.totalJobs >= 3) // Only locations with meaningful data
      .map(([location, data]) => {
        const topSkills = Array.from(data.skills.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([skill, count]) => ({ 
            skill, 
            count, 
            percentage: Math.round((count / data.totalJobs) * 100) 
          }));
        
        return {
          location,
          totalJobs: data.totalJobs,
          topSkills,
          skillDiversity: data.skills.size
        };
      })
      .sort((a, b) => b.totalJobs - a.totalJobs)
      .slice(0, 12);
  }, [filteredData]);

  // Agency comparison analysis
  const agencyAnalysis = useMemo(() => {
    if (!filteredData || filteredData.length === 0 || !data || data.length === 0) {
      return {
        isAgencyView: false,
        topSkills: []
      };
    }
    
    if (isAgencyView) {
      // Single agency view - compare to market
      const agencySkills = extractSkillCounts(filteredData);
      const marketSkills = extractSkillCounts(data);
      
      const comparison = Array.from(agencySkills.entries())
        .map(([skill, agencyCount]) => {
          const marketCount = marketSkills.get(skill) || 0;
          const agencyShare = (agencyCount / filteredData.length) * 100;
          const marketShare = marketCount > 0 ? (marketCount / data.length) * 100 : 0;
          const isStrength = agencyShare > marketShare;
          
          return {
            skill,
            agencyCount,
            marketCount,
            agencyShare: Math.round(agencyShare * 10) / 10,
            marketShare: Math.round(marketShare * 10) / 10,
            isStrength,
            gap: Math.round(Math.abs(agencyShare - marketShare) * 10) / 10
          };
        })
        .sort((a, b) => b.agencyCount - a.agencyCount);
      
      return {
        isAgencyView: true,
        agencyName: filters.selectedAgency,
        strengths: comparison.filter(s => s.isStrength && s.gap > 1).slice(0, 6),
        gaps: comparison.filter(s => !s.isStrength && s.gap > 1).slice(0, 6),
        topSkills: comparison.slice(0, 8)
      };
    } else {
      // Market view - show agency specializations
      const agencies = [...new Set(data.map(job => job.short_agency || job.long_agency).filter(Boolean))];
      
      return {
        isAgencyView: false,
        agencySpecializations: agencies
          .map(agency => {
            const agencyJobs = data.filter(job => (job.short_agency || job.long_agency) === agency);
            if (agencyJobs.length < 5) return null; // Filter small agencies
            
            const skills = extractSkillCounts(agencyJobs);
            const topSkills = Array.from(skills.entries())
              .sort(([,a], [,b]) => b - a)
              .slice(0, 4)
              .map(([skill, count]) => ({ skill, count }));
            
            return {
              agency,
              totalJobs: agencyJobs.length,
              topSkills
            };
          })
          .filter(Boolean)
          .sort((a, b) => b!.totalJobs - a!.totalJobs)
          .slice(0, 8)
      };
    }
  }, [filteredData, data, isAgencyView, filters.selectedAgency]);

  // Language analysis using context
  const languageAnalysis = useMemo(() => {
    try {
      const result = dataProcessing.getLanguageAnalysis(filteredData);
      return result || {
        requiredLanguages: [],
        desiredLanguages: [],
        multilingualJobsPercentage: 0,
        averageLanguageCount: 0,
        topLanguagePairs: [],
        agencyLanguageProfiles: []
      };
    } catch (error) {
      console.error('Error analyzing languages:', error);
      return {
        requiredLanguages: [],
        desiredLanguages: [],
        multilingualJobsPercentage: 0,
        averageLanguageCount: 0,
        topLanguagePairs: [],
        agencyLanguageProfiles: []
      };
    }
  }, [filteredData, dataProcessing]);

  // Helper functions
  function isDigitalSkill(skill: string): boolean {
    const digitalCategory = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === 'digital-technology');
    const digitalKeywords = digitalCategory ? [...digitalCategory.coreKeywords, ...digitalCategory.supportKeywords] : [];
    return digitalKeywords.some(keyword => skill.toLowerCase().includes(keyword.toLowerCase()));
  }

  function calculateAvgGrade(grades: string[]): number {
    const gradeValues: { [key: string]: number } = {
      'P1': 1, 'P2': 2, 'P3': 3, 'P4': 4, 'P5': 5, 'P6': 6,
      'G1': 1, 'G2': 2, 'G3': 3, 'G4': 4, 'G5': 5, 'G6': 6, 'G7': 7, 'G8': 8,
      'D1': 7, 'D2': 8, 'NOA': 1, 'NOB': 2, 'NOC': 3, 'NOD': 4
    };
    
    const validGrades = grades.filter(g => Object.keys(gradeValues).some(gv => g?.includes(gv)));
    if (validGrades.length === 0) return 0;
    
    const total = validGrades.reduce((sum, grade) => {
      const gradeKey = Object.keys(gradeValues).find(gv => grade.includes(gv));
      return sum + (gradeKey ? gradeValues[gradeKey] : 0);
    }, 0);
    
    return Math.round((total / validGrades.length) * 10) / 10;
  }

  function calculateTalentCompetition(skills: any[], jobs: ProcessedJobData[]) {
    return skills.slice(0, 10).map(skill => {
      // Find jobs requiring this skill
      const skillJobs = jobs.filter(job => 
        job.job_labels?.toLowerCase().includes(skill.skill.toLowerCase())
      );
      
      // Get all grade levels for this skill
      const skillGradeCounts = new Map<string, number>();
      skillJobs.forEach(job => {
        const grade = job.up_grade || '';
        if (grade.trim()) {
          skillGradeCounts.set(grade, (skillGradeCounts.get(grade) || 0) + 1);
        }
      });
      
      // Find most common grade
      let mostCommonGrade = 'N/A';
      let maxCount = 0;
      skillGradeCounts.forEach((count, grade) => {
        if (count > maxCount) {
          maxCount = count;
          mostCommonGrade = grade;
        }
      });
      
      // Calculate grade distribution percentage for most common grade
      const gradeDistribution = skillJobs.length > 0 ? 
        Math.round((maxCount / skillJobs.length) * 100) : 0;
      
      // Calculate urgency based on application window
      const urgentJobs = skillJobs.filter(job => {
        return job.application_window_days && job.application_window_days <= 21;
      }).length;
      
      const urgencyRate = skillJobs.length > 0 ? 
        Math.round((urgentJobs / skillJobs.length) * 100) : 0;
      
      // Calculate market heat (multiple agencies competing)
      const competitionLevel = skill.agencies >= 5 ? 'High' : 
                              skill.agencies >= 3 ? 'Medium' : 'Low';
      
      return {
        skill: skill.skill,
        positions: skill.count,
        agencies: skill.agencies,
        mostCommonGrade,
        gradeDistribution,
        urgencyRate,
        competitionLevel
      };
    });
  }

  function calculateSkillTrends(jobs: ProcessedJobData[]) {
    // Group jobs by year and skill
    const skillsByYear = new Map<number, Map<string, number>>();
    
    jobs.forEach(job => {
      const year = job.posting_year;
      if (!year || !job.job_labels) return;
      
      if (!skillsByYear.has(year)) {
        skillsByYear.set(year, new Map());
      }
      
      const yearMap = skillsByYear.get(year)!;
      const skills = job.job_labels.split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 2);
      
      skills.forEach(skill => {
        yearMap.set(skill, (yearMap.get(skill) || 0) + 1);
      });
    });
    
    // Calculate trends for top skills
    const allYears = Array.from(skillsByYear.keys()).sort();
    if (allYears.length < 2) return [];
    
    const firstYear = allYears[0];
    const lastYear = allYears[allYears.length - 1];
    
    // Get skills that appear in both first and last year
    const firstYearSkills = skillsByYear.get(firstYear) || new Map();
    const lastYearSkills = skillsByYear.get(lastYear) || new Map();
    
    const trends: any[] = [];
    
    // Calculate growth for skills present in multiple years
    firstYearSkills.forEach((firstCount, skill) => {
      const lastCount = lastYearSkills.get(skill) || 0;
      if (firstCount >= 5 && (lastCount > 0 || firstCount > 0)) { // Only include significant skills
        const growthRate = firstCount > 0 ? 
          Math.round(((lastCount - firstCount) / firstCount) * 100) : 0;
        
        trends.push({
          skill,
          firstYear,
          lastYear,
          firstYearCount: firstCount,
          lastYearCount: lastCount,
          growthRate,
          totalPositions: firstCount + lastCount,
          trend: growthRate > 20 ? 'Rising' : growthRate < -20 ? 'Declining' : 'Stable'
        });
      }
    });
    
    // Also check for new skills (only in last year)
    lastYearSkills.forEach((lastCount, skill) => {
      if (!firstYearSkills.has(skill) && lastCount >= 3) {
        trends.push({
          skill,
          firstYear,
          lastYear,
          firstYearCount: 0,
          lastYearCount: lastCount,
          growthRate: 999, // Mark as new
          totalPositions: lastCount,
          trend: 'Emerging'
        });
      }
    });
    
    return trends
      .sort((a, b) => Math.abs(b.growthRate) - Math.abs(a.growthRate))
      .slice(0, 12);
  }

  function categorizeSkills(allJobs: ProcessedJobData[]) {
    // Build categories from dictionary
    const categories = JOB_CLASSIFICATION_DICTIONARY.reduce((acc, category) => {
      // Map main categories to skill keywords
      if (['digital-technology', 'communication-advocacy', 'operations-logistics'].includes(category.id)) {
        acc[category.name] = category.coreKeywords.slice(0, 8); // Use first 8 core keywords
      }
      return acc;
    }, {} as Record<string, string[]>);
    
    // Add skill-specific categories not in main dictionary
    categories['Leadership & Management'] = ['management', 'leadership', 'strategy', 'coordination', 'supervision', 'governance'];
    categories['Technical & Analytical'] = ['analysis', 'research', 'evaluation', 'assessment', 'monitoring', 'technical'];
    
    // Count unique jobs per category (no double counting)
    return Object.entries(categories).map(([categoryName, keywords]) => {
      const categoryJobs = new Set<string>();
      const categorySkills = new Map<string, number>();
      
      allJobs.forEach(job => {
        if (!job.job_labels) return;
        
        const jobSkills = job.job_labels.split(',').map(s => s.trim().toLowerCase());
        const hasRelevantSkill = jobSkills.some(skill => 
          keywords.some(keyword => skill.includes(keyword))
        );
        
        if (hasRelevantSkill) {
          categoryJobs.add(job.id); // Count unique jobs only
          
          // Track individual skills within this category
          jobSkills.forEach(skill => {
            if (keywords.some(keyword => skill.includes(keyword))) {
              categorySkills.set(skill, (categorySkills.get(skill) || 0) + 1);
            }
          });
        }
      });
      
      const topSkills = Array.from(categorySkills.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 6)
        .map(([skill, count]) => ({ skill, count }));
      
      return {
        category: categoryName,
        totalPositions: categoryJobs.size, // Unique job count
        skills: topSkills,
        avgGrowth: 0 // Remove misleading growth calculation
      };
    }).filter(cat => cat.totalPositions > 0);
  }

  function extractSkillCounts(jobs: ProcessedJobData[]) {
    const skillCounts = new Map<string, number>();
    jobs.forEach(job => {
      if (job.job_labels) {
        job.job_labels.split(',').forEach(skill => {
          const cleanSkill = skill.trim();
          if (cleanSkill.length > 1) {
            skillCounts.set(cleanSkill, (skillCounts.get(cleanSkill) || 0) + 1);
          }
        });
      }
    });
    return skillCounts;
  }

  // Calculate key metrics for dashboard cards
  const keyMetrics = useMemo(() => {
    if (!skillsAnalysis || !filteredData || !Array.isArray(filteredData)) {
      return {
        topSkill: 'N/A',
        topSkillCount: 0,
        trendingSkill: 'N/A',
        trendingGrowth: 0,
        digitalMaturity: 0,
        mostCompetitive: 'N/A',
        competitiveAgencies: 0
      };
    }

    const topSkill = skillsAnalysis.topSkills?.[0];
    const digitalSkills = Array.isArray(skillsAnalysis.digitalSkills) ? skillsAnalysis.digitalSkills : [];
    const digitalPercentage = digitalSkills.length > 0 && filteredData.length > 0 ? 
      Math.round((digitalSkills.reduce((sum, s) => sum + (s?.count || 0), 0) / filteredData.length) * 100) : 0;
    const skillTrends = Array.isArray(skillsAnalysis.skillTrends) ? skillsAnalysis.skillTrends : [];
    const fastestGrowing = skillTrends.find(s => s && s.growthRate > 0 && s.growthRate < 999);
    const topSkills = Array.isArray(skillsAnalysis.topSkills) ? skillsAnalysis.topSkills : [];
    const mostCompetitive = topSkills.find(s => s && s.agencies >= 3);
    
    return {
      topSkill: topSkill?.skill || 'N/A',
      topSkillCount: topSkill?.count || 0,
      trendingSkill: fastestGrowing?.skill || 'N/A',
      trendingGrowth: fastestGrowing?.growthRate || 0,
      digitalMaturity: digitalPercentage,
      mostCompetitive: mostCompetitive?.skill || 'N/A',
      competitiveAgencies: mostCompetitive?.agencies || 0
    };
  }, [skillsAnalysis, filteredData]);

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#059669'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Skills Intelligence Center</h2>
            <p className="text-gray-600 mt-1">
              {isAgencyView 
                ? `Strategic skills analysis for ${filters.selectedAgency} (${filteredData.length} positions)`
                : `Market-wide skills analysis (${filteredData.length} positions)`
              }
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              Analyzing {filteredData.length} positions
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: SKILLS MARKET INTELLIGENCE */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          Skills Market Intelligence
        </h3>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <h4 className="font-semibold text-gray-900">Top Skill</h4>
            </div>
            <p className="text-xl font-bold text-gray-900">{keyMetrics.topSkill}</p>
            <p className="text-sm text-gray-600">{keyMetrics.topSkillCount} positions</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <h4 className="font-semibold text-gray-900">Trending Skills</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900">+{keyMetrics.trendingGrowth}%</p>
            <p className="text-sm text-gray-600">{keyMetrics.trendingSkill}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-5 w-5 text-blue-500" />
              <h4 className="font-semibold text-gray-900">Digital Maturity</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900">{keyMetrics.digitalMaturity}%</p>
            <p className="text-sm text-gray-600">Tech skill adoption</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="h-5 w-5 text-purple-500" />
              <h4 className="font-semibold text-gray-900">Most Competitive</h4>
            </div>
            <p className="text-lg font-bold text-gray-900">{keyMetrics.mostCompetitive}</p>
            <p className="text-sm text-gray-600">{keyMetrics.competitiveAgencies} agencies</p>
          </div>
        </div>

        {/* Skills Demand Chart - Fixed implementation */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">Top 15 Skills by Demand</h4>
            <p className="text-sm text-gray-600 mt-1">Most frequently requested skills across positions</p>
          </div>
          
          <div className="p-6">
            {(skillsAnalysis?.topSkills?.length || 0) > 0 ? (
              <div className="space-y-3">
                {(skillsAnalysis.topSkills || []).map((skill, index) => (
                  <div key={skill.skill} className="flex items-center gap-3">
                    <div className="w-32 text-sm text-gray-700 truncate">{skill.skill}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                      <div 
                        className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-300"
                        style={{ 
                          width: `${Math.max(5, (skill.count / skillsAnalysis.topSkills[0].count) * 100)}%` 
                        }}
                      >
                        <span className="text-white text-xs font-medium">{skill.count}</span>
                      </div>
                    </div>
                    <div className="w-16 text-xs text-gray-500 text-right">
                      {skill.agencies} agencies
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No skill data available for current filters</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Skills by Category and Shortage Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Skills by Category */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">Skills by Category</h4>
              <p className="text-sm text-gray-600 mt-1">Demand organized by functional area</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {skillsAnalysis.skillsByCategory.map((category, index) => (
                  <div key={category.category} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-900">{category.category}</h5>
                      <div className="text-right">
                        <span className="text-sm text-gray-500">{category.totalPositions} positions</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {category.skills.slice(0, 4).map((skill: any, skillIndex: number) => (
                        <div key={skill.skill} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: colors[skillIndex % colors.length] }}
                            />
                            <span className="text-gray-700">{skill.skill}</span>
                          </div>
                          <span className="text-gray-500">{skill.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Talent Competition Analysis */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">Talent Market Dynamics</h4>
              <p className="text-sm text-gray-600 mt-1">Grade premiums, urgency rates, and competitive positioning for top skills</p>
            </div>
            
            <div className="p-6">
              {(skillsAnalysis?.talentCompetition?.length || 0) > 0 ? (
                <div className="space-y-3">
                  {(skillsAnalysis?.talentCompetition || []).slice(0, 8).map((skill, index) => (
                    <div key={skill.skill} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">{skill.skill}</div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            skill.competitionLevel === 'High' ? 'bg-red-100 text-red-700' :
                            skill.competitionLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {skill.competitionLevel} Competition
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Positions</div>
                          <div className="font-medium">{skill.positions}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Common Grade</div>
                          <div className="font-medium">{skill.mostCommonGrade}</div>
                          <div className="text-xs text-gray-400">{skill.gradeDistribution}% of positions</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Agencies</div>
                          <div className="font-medium">{skill.agencies} agencies</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Quick Hiring</div>
                          <div className={`font-medium ${skill.urgencyRate > 20 ? 'text-orange-600' : 'text-gray-600'}`}>
                            {skill.urgencyRate > 0 ? `${skill.urgencyRate}%` : 'N/A'}
                          </div>
                          <div className="text-xs text-gray-400">≤21 days window</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Target className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>Insufficient data for talent market analysis</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: STRATEGIC WORKFORCE INSIGHTS */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-green-600" />
          Strategic Workforce Insights
        </h3>

        {/* Career Progression Analysis */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">Career Progression Skill Requirements</h4>
            <p className="text-sm text-gray-600 mt-1">How skill requirements evolve across seniority levels</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(careerProgression).map(([level, data]: [string, any]) => (
                <div key={level} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold text-gray-900">{level}</h5>
                    <span className="text-sm text-gray-600">{data.totalJobs} jobs</span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 mb-2">Top Skills:</p>
                    {data.topSkills.map((skill: any) => (
                      <div key={skill.skill} className="flex justify-between text-xs">
                        <span className="text-gray-700 truncate flex-1 mr-2">{skill.skill}</span>
                        <span className="text-gray-500">{skill.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Agency Analysis and Geographic Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agency Skill Analysis */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">
                {isAgencyView ? `${agencyAnalysis.agencyName} vs Market` : 'Agency Skill Specializations'}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {isAgencyView ? 'Competitive positioning analysis' : 'How different agencies specialize'}
              </p>
            </div>
            
            <div className="p-6">
              {agencyAnalysis.isAgencyView ? (
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium text-green-700 mb-2">Competitive Strengths</h5>
                    <div className="space-y-2">
                      {(agencyAnalysis.strengths || []).length > 0 ? (agencyAnalysis.strengths || []).map((strength: any) => (
                        <div key={strength.skill} className="flex justify-between text-sm">
                          <span className="text-gray-700">{strength.skill}</span>
                          <span className="text-green-600 font-medium">+{strength.gap}%</span>
                        </div>
                      )) : (
                        <p className="text-sm text-gray-500">No significant strengths detected</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-red-700 mb-2">Development Areas</h5>
                    <div className="space-y-2">
                      {(agencyAnalysis.gaps || []).length > 0 ? (agencyAnalysis.gaps || []).map((gap: any) => (
                        <div key={gap.skill} className="flex justify-between text-sm">
                          <span className="text-gray-700">{gap.skill}</span>
                          <span className="text-red-600 font-medium">-{gap.gap}%</span>
                        </div>
                      )) : (
                        <p className="text-sm text-gray-500">No significant gaps detected</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {agencyAnalysis.agencySpecializations?.map((agency: any) => (
                    <div key={agency.agency} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{agency.agency}</h5>
                        <span className="text-sm text-gray-600">{agency.totalJobs} jobs</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {agency.topSkills.map((skill: any) => (
                          <div key={skill.skill} className="text-gray-700 truncate">
                            • {skill.skill}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Geographic Skill Distribution */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">Geographic Skill Distribution</h4>
              <p className="text-sm text-gray-600 mt-1">Where different expertise is concentrated globally</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                {geographicDistribution.map((location, index) => (
                  <div key={location.location} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{location.location}</h5>
                      <span className="text-sm text-gray-600">{location.totalJobs} positions</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {location.topSkills.map((skill: any, skillIdx: number) => (
                        <span 
                          key={skill.skill}
                          className="text-xs px-2 py-1 rounded"
                          style={{ 
                            backgroundColor: `${colors[skillIdx % colors.length]}20`,
                            color: colors[skillIdx % colors.length]
                          }}
                        >
                          {skill.skill} ({skill.percentage}%)
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Language Requirements Analysis */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">Language Requirements Analysis</h4>
            <p className="text-sm text-gray-600 mt-1">Multilingual opportunities and language skill demand</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Required Languages</h5>
                <div className="space-y-2">
                  {(languageAnalysis?.requiredLanguages || []).slice(0, 5).map(([lang, count]: [string, number]) => (
                    <div key={lang} className="flex justify-between text-sm">
                      <span className="text-gray-700">{lang}</span>
                      <span className="text-gray-500">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Desired Languages</h5>
                <div className="space-y-2">
                  {(languageAnalysis?.desiredLanguages || []).slice(0, 5).map(([lang, count]: [string, number]) => (
                    <div key={lang} className="flex justify-between text-sm">
                      <span className="text-gray-700">{lang}</span>
                      <span className="text-gray-500">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Key Statistics</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Multilingual Jobs:</span>
                    <span className="font-medium">{Math.round(languageAnalysis?.multilingualJobsPercentage || 0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Languages:</span>
                    <span className="font-medium">{languageAnalysis?.averageLanguageCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: EMERGING TRENDS & INTELLIGENCE */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-purple-600" />
          Emerging Trends & Intelligence
        </h3>

        {/* Emerging Skills and Digital Maturity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Emerging Skills */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">Emerging Skill Trends</h4>
              <p className="text-sm text-gray-600 mt-1">Skills showing significant growth momentum</p>
            </div>
            
            <div className="p-6">
              {(skillsAnalysis?.emergingSkills?.length || 0) > 0 ? (
                <div className="space-y-3">
                  {(skillsAnalysis?.emergingSkills || []).map((skill: any, index: number) => (
                    <div key={skill.skill} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="font-medium text-gray-900">{skill.skill}</div>
                          <div className="text-sm text-gray-600">{skill.count} positions</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600">+{skill.growthRate}%</div>
                        <div className="text-xs text-gray-500">growth</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No significant emerging trends detected</p>
                </div>
              )}
            </div>
          </div>

          {/* Digital Skills Analysis */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">Digital Skills Landscape</h4>
              <p className="text-sm text-gray-600 mt-1">Technology and digital transformation skills</p>
            </div>
            
            <div className="p-6">
              {(skillsAnalysis?.digitalSkills?.length || 0) > 0 ? (
                <div className="space-y-3">
                  {(skillsAnalysis?.digitalSkills || []).map((skill: any, index: number) => (
                    <div key={skill.skill} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-900">{skill.skill}</div>
                          <div className="text-sm text-gray-600">
                            {skill.count} positions • {skill.agencies} agencies
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-blue-600">{Math.round(skill.frequency)}%</div>
                        <div className="text-xs text-gray-500">adoption</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No digital skills detected in current dataset</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Skill Trends Over Time */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">Skill Evolution Trends</h4>
            <p className="text-sm text-gray-600 mt-1">
              Skills momentum from {(skillsAnalysis?.skillTrends?.length || 0) > 0 ? skillsAnalysis.skillTrends[0]?.firstYear : 'N/A'} to {(skillsAnalysis?.skillTrends?.length || 0) > 0 ? skillsAnalysis.skillTrends[0]?.lastYear : 'N/A'}
            </p>
          </div>
          
          <div className="p-6">
            {(skillsAnalysis?.skillTrends?.length || 0) > 0 ? (
              <div className="space-y-3">
                {(skillsAnalysis?.skillTrends || []).map((trend, index) => (
                  <div key={trend.skill} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900 capitalize">{trend.skill}</div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          trend.trend === 'Rising' ? 'bg-green-100 text-green-700' :
                          trend.trend === 'Declining' ? 'bg-red-100 text-red-700' :
                          trend.trend === 'Emerging' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {trend.trend}
                        </span>
                        {trend.growthRate === 999 ? (
                          <span className="text-lg font-bold text-blue-600">NEW</span>
                        ) : (
                          <span className={`text-lg font-bold ${
                            trend.growthRate > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {trend.growthRate > 0 ? '+' : ''}{trend.growthRate}%
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">{trend.firstYear} Count</div>
                        <div className="font-medium">{trend.firstYearCount}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">{trend.lastYear} Count</div>
                        <div className="font-medium">{trend.lastYearCount}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Total Positions</div>
                        <div className="font-medium">{trend.totalPositions}</div>
                      </div>
                    </div>
                    
                    {/* Visual growth bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>{trend.firstYear}</span>
                        <span>{trend.lastYear}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            trend.growthRate > 0 ? 'bg-green-500' : trend.growthRate < 0 ? 'bg-red-500' : 'bg-gray-400'
                          }`}
                          style={{ 
                            width: `${Math.min(100, Math.max(10, 50 + (trend.growthRate / 2)))}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>Insufficient historical data for trend analysis</p>
                <p className="text-xs mt-1">Need data from multiple years to show trends</p>
              </div>
            )}
          </div>
        </div>

        {/* Strategic Recommendations */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
          <h4 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Strategic Skills Intelligence & Recommendations
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h5 className="font-medium text-purple-800 mb-2">Immediate Priorities</h5>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Address top skill shortages through targeted recruitment</li>
                <li>• Accelerate digital transformation initiatives</li>
                <li>• Strengthen multilingual capabilities globally</li>
                <li>• Monitor emerging skill trends for early adoption</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium text-blue-800 mb-2">Strategic Development</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Invest in cross-skill training programs</li>
                <li>• Build regional centers of expertise</li>
                <li>• Create clear career progression pathways</li>
                <li>• Develop inter-agency talent exchange programs</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium text-indigo-800 mb-2">Future Readiness</h5>
              <ul className="text-sm text-indigo-700 space-y-1">
                <li>• Anticipate next-generation skill requirements</li>
                <li>• Build adaptive learning and development capabilities</li>
                <li>• Foster culture of innovation and experimentation</li>
                <li>• Strengthen global talent mobility and deployment</li>
              </ul>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default Skills;

