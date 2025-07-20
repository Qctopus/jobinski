import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  Users, GitBranch, TrendingUp, Target,
  BookOpen, Layers, Network, Clock, Zap
} from 'lucide-react';
import { ProcessedJobData, FilterOptions } from '../types';
import { JobAnalyticsProcessor } from '../services/dataProcessor';

interface SkillComparisonProps {
  data: ProcessedJobData[];
  filters: FilterOptions;
}

const SkillComparison: React.FC<SkillComparisonProps> = ({ data, filters }) => {
  const [selectedView, setSelectedView] = useState<'roles' | 'clusters' | 'evolution'>('roles');
  
  const processor = useMemo(() => new JobAnalyticsProcessor(), []);
  
  // Grade progression analysis at component level
  const gradeProgression = useMemo(() => {
    const gradeGroups = {
      'Entry Level (P1-P2)': data.filter(job => ['P1', 'P2', 'G1', 'G2', 'G3'].some(grade => job.up_grade?.includes(grade))),
      'Mid Level (P3-P4)': data.filter(job => ['P3', 'P4', 'G4', 'G5', 'G6'].some(grade => job.up_grade?.includes(grade))),
      'Senior Level (P5+)': data.filter(job => ['P5', 'P6', 'D1', 'D2', 'L6', 'L7'].some(grade => job.up_grade?.includes(grade))),
    };

    return Object.entries(gradeGroups).map(([level, jobs]) => {
      const skillFreq = new Map<string, number>();
      const experienceReqs: number[] = [];
      const agencies = new Set<string>();
      
      jobs.forEach(job => {
        if (job.job_labels) {
          job.job_labels.split(',').forEach(skill => {
            const cleanSkill = skill.trim();
            if (cleanSkill.length > 2) {
              skillFreq.set(cleanSkill, (skillFreq.get(cleanSkill) || 0) + 1);
            }
          });
        }
        if (job.relevant_experience) experienceReqs.push(job.relevant_experience);
        if (job.short_agency || job.long_agency) agencies.add(job.short_agency || job.long_agency);
      });

      const topSkills = Array.from(skillFreq.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
        .map(([skill, count]) => ({ skill, count, percentage: Math.round((count / jobs.length) * 100) }));

      return {
        level,
        totalJobs: jobs.length,
        avgExperience: experienceReqs.length > 0 ? Math.round(experienceReqs.reduce((a, b) => a + b, 0) / experienceReqs.length) : 0,
        topSkills,
        agencies: agencies.size,
        agencyList: Array.from(agencies).slice(0, 5)
      };
    }).filter(group => group.totalJobs > 10); // Only include groups with sufficient data
  }, [data]);

  // Calculate skill comparison data
  const skillAnalysis = useMemo(() => {
    return processor.analyzeSkillComparison(data);
  }, [data, processor]);

  // Role evolution analysis
  const roleEvolution = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    
    const currentYearJobs = data.filter(job => job.posting_year === currentYear);
    const previousYearJobs = data.filter(job => job.posting_year === previousYear);
    
    // Analyze common roles and their changing requirements
    const evolvedRoles = skillAnalysis.roleComparisons.map(roleComp => {
      const currentSkills = new Set<string>();
      const previousSkills = new Set<string>();
      
      currentYearJobs.forEach(job => {
        if (job.title.toLowerCase().includes(roleComp.role.toLowerCase()) && job.job_labels) {
          job.job_labels.split(',').forEach(skill => currentSkills.add(skill.trim().toLowerCase()));
        }
      });
      
      previousYearJobs.forEach(job => {
        if (job.title.toLowerCase().includes(roleComp.role.toLowerCase()) && job.job_labels) {
          job.job_labels.split(',').forEach(skill => previousSkills.add(skill.trim().toLowerCase()));
        }
      });
      
      const newSkills = Array.from(currentSkills).filter(skill => !previousSkills.has(skill));
      const disappearedSkills = Array.from(previousSkills).filter(skill => !currentSkills.has(skill));
      
      return {
        role: roleComp.role,
        newSkills: newSkills.slice(0, 5),
        disappearedSkills: disappearedSkills.slice(0, 5),
        totalCurrent: currentSkills.size,
        totalPrevious: previousSkills.size,
        currentJobs: currentYearJobs.filter(job => job.title.toLowerCase().includes(roleComp.role.toLowerCase())).length,
        previousJobs: previousYearJobs.filter(job => job.title.toLowerCase().includes(roleComp.role.toLowerCase())).length
      };
    }).filter(role => role.currentJobs > 5 && role.previousJobs > 5); // Only roles with sufficient data
    
    return evolvedRoles;
  }, [data, skillAnalysis.roleComparisons]);

  // Skill network analysis
  const skillNetworks = useMemo(() => {
    const coOccurrenceMatrix: { [key: string]: { [key: string]: number } } = {};
    const skillFrequency: { [key: string]: number } = {};
    
    data.forEach(job => {
      if (!job.job_labels) return;
      
      const skills = job.job_labels.split(',')
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length > 2);
      
      // Count skill frequency
      skills.forEach(skill => {
        skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
      });
      
      // Count co-occurrences
      for (let i = 0; i < skills.length; i++) {
        for (let j = i + 1; j < skills.length; j++) {
          const skill1 = skills[i];
          const skill2 = skills[j];
          
          if (!coOccurrenceMatrix[skill1]) coOccurrenceMatrix[skill1] = {};
          if (!coOccurrenceMatrix[skill2]) coOccurrenceMatrix[skill2] = {};
          
          coOccurrenceMatrix[skill1][skill2] = (coOccurrenceMatrix[skill1][skill2] || 0) + 1;
          coOccurrenceMatrix[skill2][skill1] = (coOccurrenceMatrix[skill2][skill1] || 0) + 1;
        }
      }
    });
    
    // Find top skill relationships
    const relationships: Array<{
      source: string;
      target: string;
      weight: number;
      strength: number;
    }> = [];
    const topSkills = Object.entries(skillFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([skill]) => skill);
    
    topSkills.forEach(skill1 => {
      topSkills.forEach(skill2 => {
        if (skill1 !== skill2 && coOccurrenceMatrix[skill1]?.[skill2]) {
          relationships.push({
            source: skill1,
            target: skill2,
            weight: coOccurrenceMatrix[skill1][skill2],
            strength: (coOccurrenceMatrix[skill1][skill2] / skillFrequency[skill1]) * 100
          });
        }
      });
    });
    
    return {
      topSkills: topSkills.slice(0, 10),
      relationships: relationships.sort((a, b) => b.weight - a.weight).slice(0, 30),
      skillFrequency
    };
  }, [data]);

  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#059669'];

  const renderRoleComparison = () => {
    return (
      <div className="space-y-6">
        {/* Career Progression Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="h-6 w-6 text-un-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Career Progression Requirements</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">How skill requirements and experience evolve across UN grade levels</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {gradeProgression.map((grade, index) => (
              <div key={grade.level} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{grade.level}</h4>
                  <span className="text-sm text-gray-600">{grade.totalJobs} positions</span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Experience:</span>
                    <span className="font-medium">{grade.avgExperience} years</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Active Agencies:</span>
                    <span className="font-medium">{grade.agencies}</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 mb-2">Top Required Skills:</p>
                  <div className="space-y-1">
                    {grade.topSkills.slice(0, 5).map(skill => (
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

        {/* Competency Gap Analysis */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">Competency Gap Analysis</h4>
            <p className="text-sm text-gray-600 mt-1">Skills that appear frequently at higher grades but rarely at entry level</p>
          </div>
          
          <div className="p-6">
            {gradeProgression.length >= 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <h5 className="font-semibold text-green-800 mb-3">📈 Skills That Grow With Experience</h5>
                    <p className="text-xs text-green-600 mb-3">More common in senior roles - key areas for career development</p>
                    {gradeProgression[gradeProgression.length - 1]?.topSkills
                      .filter(seniorSkill => {
                        const entryLevel = gradeProgression[0]?.topSkills.find(s => s.skill === seniorSkill.skill);
                        return !entryLevel || seniorSkill.percentage > entryLevel.percentage + 10;
                      })
                      .slice(0, 6)
                      .map(skill => (
                        <div key={skill.skill} className="flex justify-between text-sm mb-2">
                          <span className="text-green-700">{skill.skill}</span>
                          <span className="text-green-600 font-medium">{skill.percentage}% of senior roles</span>
                        </div>
                      ))
                    }
                  </div>
                  
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <h5 className="font-semibold text-blue-800 mb-3">🏁 Entry-Level Foundations</h5>
                    <p className="text-xs text-blue-600 mb-3">Core skills required from the start</p>
                    {gradeProgression[0]?.topSkills
                      .filter(entrySkill => entrySkill.percentage > 30)
                      .slice(0, 6)
                      .map(skill => (
                        <div key={skill.skill} className="flex justify-between text-sm mb-2">
                          <span className="text-blue-700">{skill.skill}</span>
                          <span className="text-blue-600 font-medium">{skill.percentage}% of entry roles</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h5 className="font-semibold text-yellow-800 mb-2">💡 Career Development Insights</h5>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Entry-level positions focus on foundational skills and basic technical competencies</li>
                    <li>• Senior roles increasingly require strategic thinking, leadership, and specialized expertise</li>
                    <li>• Skills like "Project Management" and "Policy Development" become more critical at higher grades</li>
                    <li>• Consider these patterns when designing career progression frameworks</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Experience vs Skills Chart */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">Experience Requirements by Grade</h4>
            <p className="text-sm text-gray-600 mt-1">How experience expectations align with grade levels</p>
          </div>
          
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gradeProgression}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    name === 'avgExperience' ? `${value} years` : value,
                    name === 'avgExperience' ? 'Average Experience' : 'Total Positions'
                  ]}
                />
                <Bar dataKey="avgExperience" fill="#3B82F6" name="Average Experience Required" />
                <Bar dataKey="totalJobs" fill="#10B981" name="Total Positions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderSkillClusters = () => (
    <div className="space-y-6">
      {/* Cross-Agency Skills Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Network className="h-5 w-5 text-blue-500" />
            <h4 className="font-semibold text-gray-900">Universal Skills</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {skillAnalysis.skillClusters.crossAgencySkills.filter(skill => skill.agencies >= 5).length}
          </p>
          <p className="text-sm text-gray-600">Skills used by 5+ agencies</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Layers className="h-5 w-5 text-green-500" />
            <h4 className="font-semibold text-gray-900">Unique Combinations</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {Object.keys(skillAnalysis.skillClusters.uniqueCombinations).length}
          </p>
          <p className="text-sm text-gray-600">Agency-specific skill sets</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <GitBranch className="h-5 w-5 text-purple-500" />
            <h4 className="font-semibold text-gray-900">Skill Relationships</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">{skillNetworks.relationships.length}</p>
          <p className="text-sm text-gray-600">Strong co-occurrences</p>
        </div>
      </div>

      {/* Cross-Agency Skills */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-un-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Universal Skills Analysis</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">Skills that appear across multiple agencies</p>
        </div>
        
        <div className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={skillAnalysis.skillClusters.crossAgencySkills.slice(0, 15)} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="skill" type="category" width={120} fontSize={11} />
              <Tooltip 
                formatter={(value: any) => [`${value} agencies`, 'Used by']}
                labelFormatter={(skill: any) => `Skill: ${skill}`}
              />
              <Bar dataKey="agencies" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Agency-Specific Skill Patterns */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-un-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Agency Specialization Patterns</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">Unique skill combinations by agency</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(skillAnalysis.skillClusters.uniqueCombinations).slice(0, 9).map(([agency, skills], index) => (
              <div key={agency} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-gray-900">{agency}</h5>
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 mb-2">Top Skills:</p>
                  {skills.slice(0, 5).map((skill, skillIndex) => (
                    <div key={skillIndex} className="text-xs bg-gray-100 rounded px-2 py-1">
                      {skill}
                    </div>
                  ))}
                  {skills.length > 5 && (
                    <p className="text-xs text-gray-400">+{skills.length - 5} more skills</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Skill Network Visualization */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Network className="h-6 w-6 text-un-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Skill Relationship Network</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">How skills cluster together in job requirements</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Strongest Skill Pairs</h4>
              <div className="space-y-3">
                {skillNetworks.relationships.slice(0, 10).map((rel, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{rel.source}</span>
                      <span className="text-gray-400">↔</span>
                      <span className="text-sm font-medium text-gray-900">{rel.target}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {rel.weight} co-occurrences
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Most Connected Skills</h4>
              <div className="space-y-3">
                {skillNetworks.topSkills.map((skill, index) => {
                  const connections = skillNetworks.relationships.filter(
                    rel => rel.source === skill || rel.target === skill
                  ).length;
                  
                  return (
                    <div key={skill} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-900">{skill}</span>
                      <div className="text-xs text-gray-500">
                        {connections} connections
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRoleEvolution = () => (
    <div className="space-y-6">
      {/* Evolution Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <h4 className="font-semibold text-gray-900">Evolving Roles</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {roleEvolution.filter(role => role.newSkills.length > 0).length}
          </p>
          <p className="text-sm text-gray-600">Roles gaining new skills</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="h-5 w-5 text-blue-500" />
            <h4 className="font-semibold text-gray-900">New Skills</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {roleEvolution.reduce((sum, role) => sum + role.newSkills.length, 0)}
          </p>
          <p className="text-sm text-gray-600">Skills added this year</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-5 w-5 text-orange-500" />
            <h4 className="font-semibold text-gray-900">Skill Turnover</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {Math.round((roleEvolution.reduce((sum, role) => sum + role.newSkills.length + role.disappearedSkills.length, 0) / 
             roleEvolution.reduce((sum, role) => sum + role.totalCurrent, 0)) * 100)}%
          </p>
          <p className="text-sm text-gray-600">Annual skill change rate</p>
        </div>
      </div>

      {/* Role Evolution Details */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-un-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Role Evolution Tracking</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">How job requirements change over time</p>
        </div>
        
        <div className="p-6">
          <div className="space-y-6">
            {roleEvolution.slice(0, 8).map((role, index) => (
              <div key={role.role} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 capitalize">
                    {role.role} Positions
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Current: {role.currentJobs} jobs</span>
                    <span>Previous: {role.previousJobs} jobs</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium text-green-700 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      New Skills Added ({role.newSkills.length})
                    </h5>
                    <div className="space-y-2">
                      {role.newSkills.map((skill, skillIndex) => (
                        <div key={skillIndex} className="bg-green-50 text-green-800 px-3 py-1 rounded text-sm">
                          {skill}
                        </div>
                      ))}
                      {role.newSkills.length === 0 && (
                        <p className="text-sm text-gray-500 italic">No new skills detected</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-red-700 mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Skills Phased Out ({role.disappearedSkills.length})
                    </h5>
                    <div className="space-y-2">
                      {role.disappearedSkills.map((skill, skillIndex) => (
                        <div key={skillIndex} className="bg-red-50 text-red-800 px-3 py-1 rounded text-sm">
                          {skill}
                        </div>
                      ))}
                      {role.disappearedSkills.length === 0 && (
                        <p className="text-sm text-gray-500 italic">No skills phased out</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Total skill requirements: {role.totalPrevious} → {role.totalCurrent}</span>
                    <span className={`font-medium ${role.totalCurrent > role.totalPrevious ? 'text-green-600' : 'text-red-600'}`}>
                      {role.totalCurrent > role.totalPrevious ? '+' : ''}{role.totalCurrent - role.totalPrevious} net change
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Deep Skill Comparison Analysis</h2>
            <p className="text-gray-600 mt-1">Cross-agency skill requirements and evolution patterns</p>
          </div>
          
          {/* View Selector */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedView('roles')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedView === 'roles'
                  ? 'bg-white text-un-blue shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Role Variations
            </button>
            <button
              onClick={() => setSelectedView('clusters')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedView === 'clusters'
                  ? 'bg-white text-un-blue shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Skill Clusters
            </button>
            <button
              onClick={() => setSelectedView('evolution')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedView === 'evolution'
                  ? 'bg-white text-un-blue shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Role Evolution
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {selectedView === 'roles' && renderRoleComparison()}
      {selectedView === 'clusters' && renderSkillClusters()}
      {selectedView === 'evolution' && renderRoleEvolution()}
    </div>
  );
};

export default SkillComparison; 