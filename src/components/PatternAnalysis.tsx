import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  Brain, TrendingUp, Eye, 
  Zap, Network, Languages, Target, GitBranch, Trophy
} from 'lucide-react';
import { ProcessedJobData, FilterOptions } from '../types';
import { JobAnalyticsProcessor } from '../services/dataProcessor';

interface PatternAnalysisProps {
  data: ProcessedJobData[];
  filters: FilterOptions;
}

const PatternAnalysis: React.FC<PatternAnalysisProps> = ({ data, filters }) => {
  const [selectedView, setSelectedView] = useState<'emerging' | 'crossfunctional' | 'language'>('emerging');
  
  const processor = useMemo(() => new JobAnalyticsProcessor(), []);
  
  // Language analysis at component level
  const languageAnalysis = useMemo(() => {
    return processor.analyzeLanguageRequirements(data);
  }, [data, processor]);

  // Emerging competencies analysis using meaningful job_labels
  const emergingCompetencies = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    
    // Extract meaningful skills from job_labels field instead of raw text processing
    const extractSkills = (jobLabels: string) => {
      if (!jobLabels) return [];
      return jobLabels.split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 2); // Keep all meaningful skills from job_labels
    };

    const currentYearSkills: { [key: string]: number } = {};
    const previousYearSkills: { [key: string]: number } = {};
    const agencySkills: { [agency: string]: { [skill: string]: number } } = {};

    data.forEach(job => {
      const agency = job.short_agency || job.long_agency;
      const year = job.posting_year;
      const skills = extractSkills(job.job_labels || '');

      // Track by agency
      if (agency) {
        if (!agencySkills[agency]) agencySkills[agency] = {};
        skills.forEach(skill => {
          agencySkills[agency][skill] = (agencySkills[agency][skill] || 0) + 1;
        });
      }

      // Track by year
      if (year === currentYear) {
        skills.forEach(skill => {
          currentYearSkills[skill] = (currentYearSkills[skill] || 0) + 1;
        });
      } else if (year === previousYear) {
        skills.forEach(skill => {
          previousYearSkills[skill] = (previousYearSkills[skill] || 0) + 1;
        });
      }
    });

    // Find emerging skills with realistic growth calculation
    const emergingTerms = Object.keys(currentYearSkills)
      .map(skill => {
        const currentCount = currentYearSkills[skill] || 0;
        const previousCount = previousYearSkills[skill] || 0;
        
        // Cap growth rate at 200% to avoid inflated numbers
        let growthRate = 0;
        if (previousCount > 0) {
          growthRate = Math.min(200, ((currentCount - previousCount) / previousCount) * 100);
        } else if (currentCount >= 5) {
          // Only consider truly new skills if they have significant adoption
          growthRate = 100; // Mark as 100% growth for new skills
        }
        
        // Calculate momentum score based on absolute numbers and growth
        const momentumScore = (currentCount * 0.7) + (Math.max(0, growthRate) * 0.3);
        
        return {
          keyword: skill,
          currentCount,
          previousCount,
          growthRate: Math.round(Math.max(0, growthRate)),
          momentumScore: Math.round(momentumScore),
          isNew: previousCount === 0 && currentCount >= 5 // Higher threshold for "new" skills
        };
      })
      .filter(term => {
        // More realistic filtering: require decent adoption AND meaningful growth
        return term.currentCount >= 5 && (
          term.growthRate > 25 || // Meaningful growth
          (term.isNew && term.currentCount >= 8) || // Significant new skills
          term.currentCount >= 15 // High-volume skills regardless of growth
        );
      })
      .sort((a, b) => b.momentumScore - a.momentumScore) // Sort by momentum instead of just growth
      .slice(0, 20);

    // Agency-specific trending skills
    const agencyTrends = Object.entries(agencySkills).map(([agency, skills]) => {
      const topTerms = Object.entries(skills)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([term, count]) => ({ term, count: count as number }));
      
      return { agency, topTerms };
    }).slice(0, 12);

    return {
      emergingTerms,
      agencyTrends
    };
  }, [data]);

  // Cross-functional trends analysis
  const crossFunctionalTrends = useMemo(() => {
    const hybridRoles: { [combo: string]: { count: number; agencies: Set<string>; examples: any[] } } = {};
    const skillCombinations: { [combo: string]: number } = {};

    data.forEach(job => {
      const agency = job.short_agency || job.long_agency;
      const categories = [job.primary_category, ...job.secondary_categories].filter(Boolean);
      
      // Find hybrid roles (jobs with multiple categories)
      if (categories.length > 1) {
        const sortedCategories = categories.sort();
        const combo = sortedCategories.slice(0, 2).join(' + '); // Top 2 categories
        
        if (!hybridRoles[combo]) {
          hybridRoles[combo] = { count: 0, agencies: new Set(), examples: [] };
        }
        
        hybridRoles[combo].count++;
        if (agency) hybridRoles[combo].agencies.add(agency);
        if (hybridRoles[combo].examples.length < 3) {
          hybridRoles[combo].examples.push({
            title: job.title,
            agency: agency,
            location: job.duty_country
          });
        }
      }

      // Analyze skill combinations from job_labels
      if (job.job_labels) {
        const skills = job.job_labels.split(',').map(s => s.trim()).filter(s => s.length > 2);
        for (let i = 0; i < skills.length; i++) {
          for (let j = i + 1; j < skills.length; j++) {
            const combo = [skills[i], skills[j]].sort().join(' + ');
            skillCombinations[combo] = (skillCombinations[combo] || 0) + 1;
          }
        }
      }
    });

    const topHybridRoles = Object.entries(hybridRoles)
      .map(([combo, data]) => ({
        combination: combo,
        count: data.count,
        agencies: data.agencies.size,
        agencyList: Array.from(data.agencies).slice(0, 5),
        examples: data.examples
      }))
      .filter(role => role.count >= 3)
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    const topSkillCombos = Object.entries(skillCombinations)
      .map(([combo, count]) => ({ combination: combo, count }))
      .filter(combo => combo.count >= 5)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Identify leading agencies in cross-functional hiring
    const agencyCrossFunctional: { [agency: string]: number } = {};
    Object.values(hybridRoles).forEach(role => {
      role.agencies.forEach(agency => {
        agencyCrossFunctional[agency] = (agencyCrossFunctional[agency] || 0) + role.count / role.agencies.size;
      });
    });

    const leadingAgencies = Object.entries(agencyCrossFunctional)
      .map(([agency, score]) => ({ agency, score: Math.round(score) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return {
      topHybridRoles,
      topSkillCombos,
      leadingAgencies
    };
  }, [data]);

  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#059669'];

  const renderEmergingView = () => (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-5 w-5 text-blue-500" />
            <h4 className="font-semibold text-gray-900">Emerging Skills</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">{emergingCompetencies.emergingTerms.length}</p>
          <p className="text-sm text-gray-600">High-growth competencies</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <h4 className="font-semibold text-gray-900">New Skills</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {emergingCompetencies.emergingTerms.filter(term => term.isNew).length}
          </p>
          <p className="text-sm text-gray-600">First appeared this year</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="h-5 w-5 text-purple-500" />
            <h4 className="font-semibold text-gray-900">Top Momentum</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {emergingCompetencies.emergingTerms.length > 0 ? Math.max(...emergingCompetencies.emergingTerms.map(t => t.growthRate)) : 0}%
          </p>
          <p className="text-sm text-gray-600">Highest growth rate</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-5 w-5 text-orange-500" />
            <h4 className="font-semibold text-gray-900">Active Agencies</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">{emergingCompetencies.agencyTrends.length}</p>
          <p className="text-sm text-gray-600">Adopting new skills</p>
        </div>
      </div>

      {/* Emerging Skills Chart */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-un-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Emerging Competencies</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">Fast-growing skills and competencies from job requirements</p>
        </div>
        
        <div className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={emergingCompetencies.emergingTerms.slice(0, 15)} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="keyword" type="category" width={120} fontSize={11} />
              <Tooltip 
                formatter={(value: any, name: any) => [
                  name === 'momentumScore' ? `${value} momentum` : 
                  name === 'growthRate' ? `${value}% growth` : `${value} mentions`,
                  name === 'momentumScore' ? 'Momentum Score' :
                  name === 'growthRate' ? 'Growth Rate' : 'Current Count'
                ]}
              />
              <Bar dataKey="momentumScore" fill="#8B5CF6" name="Momentum Score" />
              <Bar dataKey="growthRate" fill="#3B82F6" name="Growth Rate" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Agency Skill Specialization */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Network className="h-6 w-6 text-un-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Agency Skill Specialization</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">Most sought-after competencies by organization</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {emergingCompetencies.agencyTrends.map((agency, index) => (
              <div key={agency.agency} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-gray-900">{agency.agency}</h5>
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 mb-2">Top Skills:</p>
                  {agency.topTerms.slice(0, 5).map((term, termIndex) => (
                    <div key={termIndex} className="flex justify-between items-center text-xs">
                      <span className="text-gray-700 bg-gray-100 px-2 py-1 rounded">{term.term}</span>
                      <span className="text-gray-500 font-medium">{term.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Skills Overview */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Eye className="h-6 w-6 text-un-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Emerging Skills Overview</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">Visual representation of trending competencies</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {emergingCompetencies.emergingTerms.slice(0, 16).map((term, index) => (
              <div 
                key={term.keyword}
                className="text-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div 
                  className="text-lg font-bold mb-2"
                  style={{ 
                    color: colors[index % colors.length],
                    fontSize: `${Math.min(24, 12 + (term.growthRate / 10))}px`
                  }}
                >
                  {term.keyword}
                </div>
                <div className="text-xs text-gray-600">
                  <div>{term.growthRate}% growth</div>
                  <div>{term.currentCount} mentions</div>
                  {term.isNew && <div className="text-green-600 font-medium">NEW</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCrossFunctionalView = () => (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <GitBranch className="h-5 w-5 text-blue-500" />
            <h4 className="font-semibold text-gray-900">Hybrid Roles</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">{crossFunctionalTrends.topHybridRoles.length}</p>
          <p className="text-sm text-gray-600">Cross-functional positions</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Network className="h-5 w-5 text-green-500" />
            <h4 className="font-semibold text-gray-900">Skill Combinations</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">{crossFunctionalTrends.topSkillCombos.length}</p>
          <p className="text-sm text-gray-600">Frequent pairings</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-5 w-5 text-purple-500" />
            <h4 className="font-semibold text-gray-900">Leading Agencies</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">{crossFunctionalTrends.leadingAgencies.length}</p>
          <p className="text-sm text-gray-600">Cross-functional hiring</p>
        </div>
      </div>

      {/* Hybrid Role Analysis */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <GitBranch className="h-6 w-6 text-un-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Cross-Functional Role Emergence</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">Positions requiring multiple skill domains</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {crossFunctionalTrends.topHybridRoles.slice(0, 8).map((role, index) => (
              <div key={role.combination} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-gray-900">{role.combination}</h5>
                  <span className="text-sm text-gray-600">{role.count} positions</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="text-gray-600">
                    {role.agencies} agencies • Examples: {role.agencyList.slice(0, 3).join(', ')}
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Sample Positions:</p>
                    {role.examples.slice(0, 2).map((example, exIndex) => (
                      <div key={exIndex} className="text-xs bg-gray-50 p-2 rounded">
                        <div className="font-medium">{example.title}</div>
                        <div className="text-gray-600">{example.agency} • {example.location}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Skill Combination Analysis */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Network className="h-6 w-6 text-un-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Most Common Skill Combinations</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">Skills frequently required together</p>
        </div>
        
        <div className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={crossFunctionalTrends.topSkillCombos.slice(0, 15)} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="combination" type="category" width={200} fontSize={11} />
              <Tooltip 
                formatter={(value: any) => [`${value} positions`, 'Frequency']}
                labelFormatter={(label: any) => `Combination: ${label}`}
              />
              <Bar dataKey="count" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderLanguageView = () => {
    return (
      <div className="space-y-6">
        {/* Language Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <Languages className="h-5 w-5 text-blue-500" />
              <h4 className="font-semibold text-gray-900">Multilingual Positions</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900">{Math.round(languageAnalysis.multilingualJobsPercentage)}%</p>
            <p className="text-sm text-gray-600">Require multiple languages</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="h-5 w-5 text-green-500" />
              <h4 className="font-semibold text-gray-900">Required Languages</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900">{languageAnalysis.requiredLanguages.length}</p>
            <p className="text-sm text-gray-600">Languages in demand</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="h-5 w-5 text-purple-500" />
              <h4 className="font-semibold text-gray-900">Language Pairs</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900">{languageAnalysis.topLanguagePairs.length}</p>
            <p className="text-sm text-gray-600">Common combinations</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <Network className="h-5 w-5 text-orange-500" />
              <h4 className="font-semibold text-gray-900">Active Agencies</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900">{languageAnalysis.agencyLanguageProfiles.length}</p>
            <p className="text-sm text-gray-600">With language requirements</p>
          </div>
        </div>

        {/* Required vs Desired Languages */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Languages className="h-6 w-6 text-un-blue" />
              <h3 className="text-lg font-semibold text-gray-900">Language Requirements Analysis</h3>
            </div>
            <p className="text-sm text-gray-600 mt-1">Most in-demand languages across UN system positions</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">📋 Required Languages</h4>
                <p className="text-sm text-gray-600 mb-4">Essential language competencies for job positions</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={languageAnalysis.requiredLanguages.slice(0, 8)} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="0" type="category" width={80} fontSize={11} />
                    <Tooltip formatter={(value: any) => [`${value} positions`, 'Required for']} />
                    <Bar dataKey="1" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">⭐ Desired Languages</h4>
                <p className="text-sm text-gray-600 mb-4">Additional languages that strengthen candidacy</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={languageAnalysis.desiredLanguages.slice(0, 8)} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="0" type="category" width={80} fontSize={11} />
                    <Tooltip formatter={(value: any) => [`${value} positions`, 'Desired for']} />
                    <Bar dataKey="1" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Language Pairs and Combinations */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <GitBranch className="h-6 w-6 text-un-blue" />
              <h3 className="text-lg font-semibold text-gray-900">Language Combinations</h3>
            </div>
            <p className="text-sm text-gray-600 mt-1">Common language pair requirements and strategic insights</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Most Common Language Pairs</h4>
                <div className="space-y-3">
                  {languageAnalysis.topLanguagePairs.map(([pair, count], index) => (
                    <div key={pair} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{pair}</span>
                      <span className="text-sm text-gray-600">{count} positions</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h4 className="font-semibold text-blue-800 mb-3">🎯 Strategic Language Insights</h4>
                <ul className="text-sm text-blue-700 space-y-2">
                  <li>• <strong>English + French:</strong> Core UN working languages, essential for international roles</li>
                  <li>• <strong>Arabic combinations:</strong> High demand in Middle East and North Africa operations</li>
                  <li>• <strong>Spanish + Portuguese:</strong> Key for Latin America regional positions</li>
                  <li>• <strong>Multilingual advantage:</strong> {Math.round(languageAnalysis.multilingualJobsPercentage)}% of positions value multiple languages</li>
                  <li>• <strong>Career tip:</strong> Developing proficiency in language pairs can significantly expand opportunities</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Agency Language Profiles */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Network className="h-6 w-6 text-un-blue" />
              <h3 className="text-lg font-semibold text-gray-900">Agency Language Specialization</h3>
            </div>
            <p className="text-sm text-gray-600 mt-1">How different agencies approach language requirements</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {languageAnalysis.agencyLanguageProfiles.slice(0, 9).map((profile, index) => (
                <div key={profile.agency} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold text-gray-900">{profile.agency}</h5>
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Positions:</span>
                      <span className="font-medium">{profile.totalJobs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Language Diversity:</span>
                      <span className="font-medium">{profile.languageDiversity} languages</span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Primary Languages:</p>
                    <div className="flex flex-wrap gap-1">
                      {[...new Set([...profile.requiredLanguages, ...profile.desiredLanguages])].slice(0, 4).map(lang => (
                        <span key={lang} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actionable Recommendations */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 mb-4">🚀 Actionable Language Strategy Recommendations</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-blue-800 mb-2">For Job Seekers:</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Focus on developing {languageAnalysis.requiredLanguages[0]?.[0]} and {languageAnalysis.requiredLanguages[1]?.[0]} proficiency</li>
                <li>• Consider learning {languageAnalysis.topLanguagePairs[0]?.[0]} combination for maximum opportunities</li>
                <li>• {Math.round(languageAnalysis.multilingualJobsPercentage)}% of positions reward multilingual competency</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-green-800 mb-2">For HR Strategy:</h5>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Benchmark language requirements against leading agencies</li>
                <li>• Consider regional language needs for field operations</li>
                <li>• Develop language training programs for high-demand combinations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Hidden Pattern Detection</h2>
            <p className="text-gray-600 mt-1">Uncovering trends in skills and competencies using clean job data</p>
          </div>
          
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setSelectedView('emerging')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedView === 'emerging'
                    ? 'border-un-blue text-un-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Emerging Competencies
              </button>
              <button
                onClick={() => setSelectedView('crossfunctional')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedView === 'crossfunctional'
                    ? 'border-un-blue text-un-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Cross-Functional Trends
              </button>
              <button
                onClick={() => setSelectedView('language')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedView === 'language'
                    ? 'border-un-blue text-un-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Language Patterns
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      {selectedView === 'emerging' && renderEmergingView()}
      {selectedView === 'crossfunctional' && renderCrossFunctionalView()}
      {selectedView === 'language' && renderLanguageView()}
    </div>
  );
};

export default PatternAnalysis; 