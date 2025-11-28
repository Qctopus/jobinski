import React, { useMemo, useState } from 'react';
import { PieChart, MarketShareEvolutionChart, TalentWarZonesHeatmap } from './charts';
import { Target, Users, Zap, Eye, Award, MapPin, Briefcase, TrendingUp, Flame } from 'lucide-react';
import { ProcessedJobData, FilterOptions } from '../types';
import { JOB_CLASSIFICATION_DICTIONARY } from '../dictionary';
import { useDataProcessing } from '../contexts/DataProcessingContext';

interface CompetitiveIntelProps {
  data: ProcessedJobData[];
  filters: FilterOptions;
}

const CompetitiveIntel: React.FC<CompetitiveIntelProps> = ({ data, filters }) => {
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);

  // Use data processing context
  const dataProcessing = useDataProcessing();

  const isAgencyView = filters.selectedAgency !== 'all';
  const selectedAgencyName = filters.selectedAgency;

  // Always use unfiltered data for competitive analysis with Secretariat breakdown
  const competitiveAnalysis = useMemo(() => {
    return dataProcessing.getCompetitiveIntelligence(data, true);
  }, [data, dataProcessing]);

  // Calculate competitive evolution analytics
  const competitiveEvolution = useMemo(() => {
    if (!dataProcessing?.competitiveEvolutionTracker) return null;

    try {
      const evolution = dataProcessing.competitiveEvolutionTracker.trackCompetitiveEvolution(data, 'month', 10);
      const warZones = dataProcessing.competitiveEvolutionTracker.identifyTalentWarZones(data);

      return { evolution, warZones };
    } catch (error) {
      console.error('Error calculating competitive evolution:', error);
      return null;
    }
  }, [data, dataProcessing]);

  // If in agency view, filter competitive data to show relevant context
  const agencyContextualData = useMemo(() => {
    if (!isAgencyView) return null;

    // Ensure arrays exist before filtering
    const positioning = competitiveAnalysis?.agencyPositioning || [];
    const overlap = competitiveAnalysis?.talentOverlap || [];
    const dominance = competitiveAnalysis?.categoryDominance || [];

    return {
      ourPosition: positioning.find((a: any) => a?.agency === selectedAgencyName),
      ourCompetitors: overlap.filter((o: any) =>
        o?.agencies && Array.isArray(o.agencies) && o.agencies.includes(selectedAgencyName)
      ).slice(0, 5),
      ourDominance: dominance.filter((cat: any) =>
        cat?.leadingAgency === selectedAgencyName
      ).slice(0, 6),
      challengingUs: dominance.filter((cat: any) =>
        cat?.leadingAgency !== selectedAgencyName && (cat?.competition || 0) > 1
      ).slice(0, 6)
    };
  }, [isAgencyView, selectedAgencyName, competitiveAnalysis]);

  const getCategoryColor = (categoryName: string) => {
    const category = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.name === categoryName);
    return category?.color || '#94A3B8';
  };

  const handleAgencyToggle = (agency: string) => {
    setSelectedAgencies(prev => {
      if (prev.includes(agency)) {
        return prev.filter(a => a !== agency);
      } else if (prev.length < 3) {
        return [...prev, agency];
      } else {
        return [agency]; // Replace if at limit
      }
    });
  };

  // Head-to-head comparison data
  const headToHeadData = useMemo(() => {
    if (selectedAgencies.length < 2) return null;

    const agencyData = selectedAgencies.map(agency =>
      competitiveAnalysis.agencyPositioning.find((a: any) => a.agency === agency)
    ).filter(Boolean);

    // Find overlap data between selected agencies
    const overlaps = competitiveAnalysis.talentOverlap.filter((overlap: any) =>
      selectedAgencies.includes(overlap.agencies[0]) && selectedAgencies.includes(overlap.agencies[1])
    );

    // Get detailed agency data from original data
    const detailedAgencyData = selectedAgencies.map(agency => {
      const agencyJobs = data.filter(job => {
        const jobAgency = job.short_agency || job.long_agency || 'Unknown';
        return jobAgency === agency;
      });

      // Count jobs per category and country for proper ranking
      const categoryCount = new Map<string, number>();
      const countryCount = new Map<string, number>();

      agencyJobs.forEach(job => {
        const category = job.primary_category;
        const country = job.duty_country;

        categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
        if (country) {
          countryCount.set(country, (countryCount.get(country) || 0) + 1);
        }
      });

      // Sort by job count and get top 5
      const topCategories = Array.from(categoryCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, count]) => ({ name: category, count }));

      const topCountries = Array.from(countryCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([country, count]) => ({ name: country, count }));

      return {
        agency,
        topCategories,
        topCountries,
        totalCategories: categoryCount.size,
        totalCountries: countryCount.size,
        totalJobs: agencyJobs.length
      };
    });

    return { agencyData, overlaps, detailedAgencyData };
  }, [selectedAgencies, competitiveAnalysis.agencyPositioning, competitiveAnalysis.talentOverlap, data]);

  // Market share pie chart data
  const marketShareData = useMemo(() => {
    const positioning = competitiveAnalysis?.agencyPositioning || [];
    const topAgencies = positioning.slice(0, 8);
    const others = positioning.slice(8);
    const othersTotal = others.reduce((sum: any, agency: any) => sum + (agency?.marketShare || 0), 0);

    const pieData = topAgencies.map((agency: any, index: number) => ({
      name: agency?.agency ? (agency.agency.length > 15 ? agency.agency.substring(0, 12) + '...' : agency.agency) : 'Unknown',
      value: agency?.marketShare || 0,
      color: `hsl(${(index * 45) % 360}, 70%, 50%)`
    }));

    if (othersTotal > 0) {
      pieData.push({
        name: 'Others',
        value: othersTotal,
        color: '#94A3B8'
      });
    }

    return pieData;
  }, [competitiveAnalysis.agencyPositioning]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {isAgencyView ? `${selectedAgencyName} - Competitive Position` : 'Competitive Intelligence'}
        </h2>
        <div className="text-sm text-gray-600">
          {isAgencyView
            ? `Market position analysis for ${selectedAgencyName}`
            : `${competitiveAnalysis.agencyPositioning.length} agencies analyzed`
          }
        </div>
      </div>

      {/* Key Competitive Metrics - Agency Aware */}
      {isAgencyView ? (
        // AGENCY VIEW: Our competitive position
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="metric-card">
            <div className="metric-value">
              {agencyContextualData?.ourPosition?.volume || 0}
            </div>
            <div className="metric-label">
              <Briefcase className="h-4 w-4 mr-1" />
              Our Job Volume
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-value">
              {Math.round(agencyContextualData?.ourPosition?.marketShare || 0)}%
            </div>
            <div className="metric-label">
              <Target className="h-4 w-4 mr-1" />
              Our Market Share
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-value">
              {agencyContextualData?.ourDominance.length || 0}
            </div>
            <div className="metric-label">
              <Award className="h-4 w-4 mr-1" />
              Categories We Lead
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-value">
              {agencyContextualData?.ourCompetitors.length || 0}
            </div>
            <div className="metric-label">
              <Users className="h-4 w-4 mr-1" />
              Direct Competitors
            </div>
          </div>
        </div>
      ) : (
        // MARKET VIEW: Overall competitive landscape
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="metric-card">
            <div className="metric-value">
              {competitiveAnalysis.categoryDominance.length}
            </div>
            <div className="metric-label">
              <Target className="h-4 w-4 mr-1" />
              Active Categories
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-value">
              {competitiveAnalysis.competitiveIntensity.filter((c: any) => c.intensity === 'High').length}
            </div>
            <div className="metric-label">
              <Zap className="h-4 w-4 mr-1" />
              High Competition Zones
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-value">
              {competitiveAnalysis.talentOverlap.length}
            </div>
            <div className="metric-label">
              <Users className="h-4 w-4 mr-1" />
              Talent Overlaps
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-value">
              {Math.round(competitiveAnalysis.agencyPositioning[0]?.marketShare || 0)}%
            </div>
            <div className="metric-label">
              <Award className="h-4 w-4 mr-1" />
              Market Leader Share
            </div>
          </div>
        </div>
      )}

      {/* Main Analysis - Agency Aware */}
      {isAgencyView ? (
        // AGENCY VIEW: Our competitive insights
        <div className="space-y-8">
          {/* Our Competitive Position */}
          {agencyContextualData?.ourPosition && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Target className="h-6 w-6 text-un-blue" />
                  <h3 className="text-lg font-semibold text-gray-900">Our Market Position</h3>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-un-blue mb-2">
                      #{(competitiveAnalysis?.agencyPositioning?.findIndex((a: any) => a?.agency === selectedAgencyName) || 0) + 1}
                    </div>
                    <div className="text-sm text-gray-600">Market Ranking</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {agencyContextualData.ourPosition?.diversity || 0}
                    </div>
                    <div className="text-sm text-gray-600">Categories Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {(agencyContextualData.ourPosition?.marketShare || 0).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Market Share</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Categories We Dominate */}
          {agencyContextualData?.ourDominance && agencyContextualData.ourDominance.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Award className="h-6 w-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Categories We Lead</h3>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agencyContextualData.ourDominance.map((category: any, index: number) => (
                    <div key={category.category} className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getCategoryColor(category.category) }}
                        ></div>
                        <h4 className="font-semibold text-green-800">👑 {category.category}</h4>
                      </div>
                      <div className="text-sm text-green-700">
                        {(category?.marketShare || 0).toFixed(1)}% market share • {category?.competition || 0} competitors
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Our Direct Competitors */}
          {agencyContextualData?.ourCompetitors && agencyContextualData.ourCompetitors.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Eye className="h-6 w-6 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Our Direct Competitors</h3>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {agencyContextualData.ourCompetitors.map((overlap, index) => (
                    <div key={`${overlap.agencies[0]}-${overlap.agencies[1]}`} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-4">
                        <div className="font-medium text-orange-800">
                          {overlap.agencies.find(a => a !== selectedAgencyName)}
                        </div>
                        <div className="text-sm text-orange-600">
                          {overlap.commonCategories.length} shared categories • {overlap.commonLocations.length} shared locations
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-orange-600">
                          {overlap.overlapScore.toFixed(1)}%
                        </div>
                        <div className="text-xs text-orange-500">overlap</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Categories Where We Face Competition */}
          {agencyContextualData?.challengingUs && agencyContextualData.challengingUs.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Zap className="h-6 w-6 text-red-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Competitive Challenges</h3>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agencyContextualData.challengingUs.map((category, index) => (
                    <div key={category.category} className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getCategoryColor(category.category) }}
                        ></div>
                        <h4 className="font-semibold text-red-800">{category.category}</h4>
                      </div>
                      <div className="text-sm text-red-700 mb-1">
                        Led by: <span className="font-medium">{category.leadingAgency}</span>
                      </div>
                      <div className="text-xs text-red-600">
                        {category.competition} agencies competing
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // MARKET VIEW: Full competitive analysis
        <div className="space-y-8">
          {/* Agency Positioning Analysis */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Agency Market Position Rankings */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className="h-6 w-6 text-un-blue" />
                    <h3 className="text-lg font-semibold text-gray-900">Market Leaders</h3>
                  </div>
                  <span className="text-sm text-gray-500">Top agencies by hiring volume</span>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {competitiveAnalysis.agencyPositioning.slice(0, 8).map((agency, index) => (
                    <div key={agency.agency} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${index === 0 ? 'bg-yellow-500' :
                            index === 1 ? 'bg-gray-400' :
                              index === 2 ? 'bg-yellow-600' :
                                'bg-gray-300'
                          }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {agency.agency}
                          </div>
                          <div className="text-sm text-gray-600">
                            {agency.diversity} job categories • {agency.volume} total jobs
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-un-blue">
                          {(agency?.marketShare || 0).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">market share</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Market Concentration Insight */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="font-medium text-blue-900 mb-1">Market Concentration</div>
                      <div className="text-sm text-blue-800">
                        Top 3 agencies control {((competitiveAnalysis?.agencyPositioning || []).slice(0, 3).reduce((sum, agency) => sum + (agency?.marketShare || 0), 0)).toFixed(1)}%
                        of the market. {(competitiveAnalysis?.agencyPositioning?.[0]?.marketShare || 0) > 20 ? 'Highly concentrated market with clear leader.' : 'Moderately fragmented market with opportunities.'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Market Share */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Award className="h-6 w-6 text-un-blue" />
                    <h3 className="text-lg font-semibold text-gray-900">Market Share</h3>
                  </div>
                  <span className="text-sm text-gray-500">Job postings distribution</span>
                </div>
              </div>

              <div className="p-6">
                <PieChart
                  data={marketShareData}
                  height={400}
                  outerRadius={120}
                  showLabels={true}
                  labelFormatter={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  tooltipFormatter={(value: any) => [`${value.toFixed(1)}%`, 'Market Share']}
                />
              </div>
            </div>
          </div>

          {/* Agency Selection for Head-to-Head */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-un-blue" />
                <h3 className="text-lg font-semibold text-gray-900">Head-to-Head Comparison</h3>
                <span className="text-sm text-gray-500">(Select up to 3 agencies)</span>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                {competitiveAnalysis.agencyPositioning.slice(0, 10).map((agency) => (
                  <button
                    key={agency.agency}
                    onClick={() => handleAgencyToggle(agency.agency)}
                    className={`p-3 rounded-lg border text-left transition-colors ${selectedAgencies.includes(agency.agency)
                        ? 'border-un-blue bg-blue-50 text-un-blue'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="font-medium text-sm">
                      {agency.agency.length > 12 ? agency.agency.substring(0, 10) + '...' : agency.agency}
                    </div>
                    <div className="text-xs text-gray-500">{agency.volume} jobs</div>
                  </button>
                ))}
              </div>

              {headToHeadData && headToHeadData.agencyData.length >= 2 && (
                <div className="space-y-8">
                  {/* Basic Metrics Comparison */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Metric</th>
                          {headToHeadData.agencyData.map(agency => (
                            <th key={agency?.agency} className="text-center py-3 px-4 font-semibold text-gray-900">
                              {agency?.agency}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 px-4 font-medium">Total Job Volume</td>
                          {headToHeadData.agencyData.map(agency => (
                            <td key={agency?.agency} className="py-3 px-4 text-center">
                              {agency?.volume}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <td className="py-3 px-4 font-medium">Role Diversity</td>
                          {headToHeadData.agencyData.map(agency => (
                            <td key={agency?.agency} className="py-3 px-4 text-center">
                              {agency?.diversity} categories
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-3 px-4 font-medium">Market Share</td>
                          {headToHeadData.agencyData.map(agency => (
                            <td key={agency?.agency} className="py-3 px-4 text-center font-semibold text-un-blue">
                              {(agency?.marketShare || 0).toFixed(1)}%
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Geographic Presence */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      Geographic Presence
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {headToHeadData.detailedAgencyData.map(agency => (
                        <div key={agency.agency} className="bg-white rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-gray-900">{agency.agency}</h5>
                            <span className="text-sm text-blue-600 font-medium">
                              {agency.totalCountries} countries
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">Top 5 hiring locations:</div>
                          <div className="space-y-2">
                            {agency.topCountries.map((country, index) => (
                              <div key={country.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center justify-center font-medium">
                                    {index + 1}
                                  </span>
                                  <span className="text-sm text-gray-700">{country.name}</span>
                                </div>
                                <span className="text-xs text-gray-500">{country.count} jobs</span>
                              </div>
                            ))}
                          </div>
                          {agency.totalCountries > 5 && (
                            <div className="text-xs text-gray-500 mt-2 text-center">
                              +{agency.totalCountries - 5} other countries
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sector Competition - Show overlap focus */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-green-600" />
                      Category Competition Overview
                    </h4>

                    {/* Show overlapping categories prominently */}
                    {headToHeadData.overlaps.length > 0 && (
                      <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <h5 className="font-medium text-yellow-800 mb-2">🔥 Direct Competition Categories</h5>
                        <div className="flex flex-wrap gap-2">
                          {headToHeadData.overlaps[0].commonCategories.slice(0, 8).map(category => (
                            <span key={category} className="px-3 py-1 bg-yellow-200 text-yellow-800 text-sm rounded-full">
                              {category.length > 20 ? category.substring(0, 17) + '...' : category}
                            </span>
                          ))}
                          {headToHeadData.overlaps[0].commonCategories.length > 8 && (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-600 text-sm rounded-full">
                              +{headToHeadData.overlaps[0].commonCategories.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {headToHeadData.detailedAgencyData.map(agency => (
                        <div key={agency.agency} className="bg-white rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-gray-900">{agency.agency}</h5>
                            <span className="text-sm text-green-600 font-medium">
                              {agency.totalCategories} categories
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">Top 5 hiring categories:</div>
                          <div className="space-y-2">
                            {agency.topCategories.map((category, index) => (
                              <div key={category.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 bg-green-100 text-green-800 text-xs rounded-full flex items-center justify-center font-medium">
                                    {index + 1}
                                  </span>
                                  <span className="text-sm text-gray-700">
                                    {category.name.length > 20 ? category.name.substring(0, 17) + '...' : category.name}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500">{category.count} jobs</span>
                              </div>
                            ))}
                          </div>
                          {agency.totalCategories > 5 && (
                            <div className="text-xs text-gray-500 mt-2 text-center">
                              +{agency.totalCategories - 5} other categories
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Competition Overlap Analysis */}
                  {headToHeadData.overlaps.length > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-6 border-l-4 border-yellow-400">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Eye className="h-5 w-5 text-yellow-600" />
                        Direct Competition Analysis
                      </h4>
                      {headToHeadData.overlaps.map(overlap => (
                        <div key={`${overlap.agencies[0]}-${overlap.agencies[1]}`} className="mb-4 last:mb-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-gray-900">
                              {overlap.agencies[0]} vs {overlap.agencies[1]}
                            </div>
                            <div className="text-lg font-bold text-yellow-600">
                              {overlap.overlapScore.toFixed(1)}% overlap
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="font-medium text-gray-700 mb-1">Competing in {overlap.commonCategories.length} sectors:</div>
                              <div className="text-gray-600">
                                {overlap.commonCategories.slice(0, 3).join(', ')}
                                {overlap.commonCategories.length > 3 && ` (+${overlap.commonCategories.length - 3} more)`}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium text-gray-700 mb-1">Competing in {overlap.commonLocations.length} countries:</div>
                              <div className="text-gray-600">
                                {overlap.commonLocations.slice(0, 3).join(', ')}
                                {overlap.commonLocations.length > 3 && ` (+${overlap.commonLocations.length - 3} more)`}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* HR Strategic Insights */}
                      <div className="mt-4 p-3 bg-white rounded border border-yellow-200">
                        <div className="font-medium text-yellow-800 mb-2">💡 Strategic HR Insights</div>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• Monitor salary benchmarks in overlapping categories to stay competitive</li>
                          <li>• Consider talent pipeline strategies in shared geographic markets</li>
                          <li>• Leverage unique categories/locations for differentiated recruitment</li>
                          <li>• Track competitor hiring patterns in high-overlap areas</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Category Dominance */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="h-6 w-6 text-un-blue" />
                  <h3 className="text-lg font-semibold text-gray-900">Top 5 Category Leaders</h3>
                </div>
                <span className="text-sm text-gray-500">Largest job categories by market share</span>
              </div>
            </div>

            <div className="p-6">
              {/* Market Share Rankings */}
              <div className="space-y-4">
                {competitiveAnalysis.categoryDominance.slice(0, 5).map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                            index === 2 ? 'bg-yellow-600' :
                              'bg-gray-300'
                        }`}>
                        {index + 1}
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: getCategoryColor(category.category) }}
                        ></div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {category.category}
                          </div>
                          <div className="text-sm text-gray-600">
                            Led by <span className="font-medium text-un-blue">{category.leadingAgency}</span> • {category.competition} competing agencies
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-un-blue">
                        {(category?.marketShare || 0).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">market share</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Market Insights */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="font-medium text-green-900">Fragmented Categories</div>
                  </div>
                  <div className="text-sm text-green-800 mb-2">
                    {(competitiveAnalysis?.categoryDominance || []).filter(cat => (cat?.marketShare || 0) < 30 && (cat?.competition || 0) > 3).length} categories
                    with no dominant leader:
                  </div>
                  <div className="text-xs text-green-700">
                    {(competitiveAnalysis?.categoryDominance || [])
                      .filter(cat => (cat?.marketShare || 0) < 30 && (cat?.competition || 0) > 3)
                      .slice(0, 3)
                      .map(cat => (cat?.category || 'Unknown').length > 20 ? cat.category.substring(0, 17) + '...' : cat.category)
                      .join(', ')}
                    {(competitiveAnalysis?.categoryDominance || []).filter(cat => (cat?.marketShare || 0) < 30 && (cat?.competition || 0) > 3).length > 3 && '...'}
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="font-medium text-blue-900">Market Leadership</div>
                  </div>
                  <div className="text-sm text-blue-800">
                    {(() => {
                      // Calculate proper proportions based on job counts
                      const totalJobs = data.length;
                      const top5Categories = competitiveAnalysis.categoryDominance.slice(0, 5);
                      const top5JobCount = top5Categories.reduce((sum, cat) => {
                        const categoryJobs = data.filter(job => job.primary_category === cat.category).length;
                        return sum + categoryJobs;
                      }, 0);
                      const percentage = (top5JobCount / totalJobs * 100).toFixed(1);
                      return `Top 5 categories represent ${percentage}% of total hiring activity`;
                    })()}
                  </div>
                </div>
              </div>

              {/* Category Performance Breakdown */}
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-4">Competition Intensity Overview</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {competitiveAnalysis.categoryDominance.filter(cat => cat.competition >= 5).length}
                    </div>
                    <div className="text-sm text-red-700">High Competition</div>
                    <div className="text-xs text-red-600">5+ agencies</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {competitiveAnalysis.categoryDominance.filter(cat => cat.competition >= 3 && cat.competition < 5).length}
                    </div>
                    <div className="text-sm text-yellow-700">Medium Competition</div>
                    <div className="text-xs text-yellow-600">3-4 agencies</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {competitiveAnalysis.categoryDominance.filter(cat => cat.competition < 3).length}
                    </div>
                    <div className="text-sm text-green-700">Low Competition</div>
                    <div className="text-xs text-green-600">&lt;3 agencies</div>
                  </div>
                </div>
              </div>
            </div>
          </div>



          {/* Market Intelligence Summary */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-un-blue" />
                <h3 className="text-lg font-semibold text-gray-900">Market Intelligence Summary</h3>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* High Competition Hotspots */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    Competitive Hotspots
                  </h4>
                  <div className="space-y-2">
                    {competitiveAnalysis.competitiveIntensity
                      .filter(item => item.intensity === 'High')
                      .slice(0, 5)
                      .map((item, index) => (
                        <div key={`${item.category}-${item.location}`} className="flex items-center justify-between p-2 bg-red-50 rounded">
                          <div className="text-sm">
                            <div className="font-medium text-red-900">
                              {item.category.length > 25 ? item.category.substring(0, 22) + '...' : item.category}
                            </div>
                            <div className="text-xs text-red-700 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {item.location}
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-red-600">{item.agencyCount} agencies</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Strategic Opportunities */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    Strategic Opportunities
                  </h4>
                  <div className="space-y-2">
                    {competitiveAnalysis.competitiveIntensity
                      .filter(item => item.intensity === 'Low')
                      .slice(0, 5)
                      .map((item, index) => (
                        <div key={`${item.category}-${item.location}`} className="flex items-center justify-between p-2 bg-green-50 rounded">
                          <div className="text-sm">
                            <div className="font-medium text-green-900">
                              {item.category.length > 25 ? item.category.substring(0, 22) + '...' : item.category}
                            </div>
                            <div className="text-xs text-green-700 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {item.location}
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-green-600">{item.agencyCount} agencies</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Market Share Evolution Over Time */}
          {competitiveEvolution?.evolution && competitiveEvolution.evolution.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Market Share Evolution</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Track how agency market share has evolved over the past 6 months
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <MarketShareEvolutionChart evolution={competitiveEvolution.evolution} />
              </div>
            </div>
          )}

          {/* Talent War Zones Heatmap */}
          {competitiveEvolution?.warZones && competitiveEvolution.warZones.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Flame className="h-6 w-6 text-red-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Talent War Zones</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        High-competition areas where multiple agencies are competing for the same talent pools
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <TalentWarZonesHeatmap warZones={competitiveEvolution.warZones} />
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-xs font-semibold text-red-800 uppercase">High Competition</div>
                    <div className="text-xs text-red-700 mt-1">5+ agencies competing</div>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-xs font-semibold text-yellow-800 uppercase">Medium Competition</div>
                    <div className="text-xs text-yellow-700 mt-1">3-4 agencies</div>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-xs font-semibold text-green-800 uppercase">Low Competition</div>
                    <div className="text-xs text-green-700 mt-1">1-2 agencies</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Strategic Intelligence Summary */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow text-white">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Competitive Intelligence Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Market Dynamics</h4>
                  <ul className="text-sm space-y-1 opacity-90">
                    <li>• Top agency holds {Math.round(competitiveAnalysis.agencyPositioning[0]?.marketShare || 0)}% market share</li>
                    <li>• {competitiveAnalysis.competitiveIntensity.filter(c => c.intensity === 'High').length} high-competition zones identified</li>
                    <li>• {competitiveAnalysis.talentOverlap.length} significant talent overlaps detected</li>
                    <li>• Average {Math.round(competitiveAnalysis.categoryDominance.reduce((sum, cat) => sum + cat.competition, 0) / competitiveAnalysis.categoryDominance.length)} agencies per category</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Strategic Opportunities</h4>
                  <ul className="text-sm space-y-1 opacity-90">
                    <li>• Target low-competition locations for expansion</li>
                    <li>• Monitor high-overlap agencies for talent competition</li>
                    <li>• Focus on categories with fragmented leadership</li>
                    <li>• Consider first-mover advantage in emerging areas</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitiveIntel; 