import React, { useMemo } from 'react';
import { ProcessedJobData, FilterOptions } from '../types';
import { useDataProcessing } from '../contexts/DataProcessingContext';
import { PieChart } from './charts';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Search, 
  CheckCircle, 
  XCircle,
  BarChart3,
  Lightbulb,
  Eye
} from 'lucide-react';

interface ClassificationInsightsProps {
  data: ProcessedJobData[];
  filters: FilterOptions;
}

const ClassificationInsights: React.FC<ClassificationInsightsProps> = ({ data, filters }) => {
  const dataProcessing = useDataProcessing();

  // Get filtered data
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

  // Calculate classification quality metrics
  const qualityMetrics = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return {
        totalJobs: 0,
        avgConfidence: 0,
        ambiguityRate: 0,
        lowConfidenceRate: 0,
        confidenceDistribution: [],
        categoryPerformance: []
      };
    }

    const totalJobs = filteredData.length;
    const confidenceSum = filteredData.reduce((sum, job) => sum + (job.classification_confidence || 50), 0);
    const avgConfidence = Math.round(confidenceSum / totalJobs);
    
    const ambiguousJobs = filteredData.filter(job => job.is_ambiguous_category).length;
    const ambiguityRate = Math.round((ambiguousJobs / totalJobs) * 100);
    
    const lowConfidenceJobs = filteredData.filter(job => (job.classification_confidence || 50) < 40).length;
    const lowConfidenceRate = Math.round((lowConfidenceJobs / totalJobs) * 100);

    // Confidence distribution
    const confidenceRanges = {
      'High (70-100%)': filteredData.filter(job => (job.classification_confidence || 50) >= 70).length,
      'Medium (40-69%)': filteredData.filter(job => {
        const conf = job.classification_confidence || 50;
        return conf >= 40 && conf < 70;
      }).length,
      'Low (0-39%)': filteredData.filter(job => (job.classification_confidence || 50) < 40).length
    };

    const confidenceDistribution = Object.entries(confidenceRanges).map(([range, count]) => ({
      range,
      count,
      percentage: Math.round((count / totalJobs) * 100)
    }));

    // Category performance
    const categoryStats = new Map<string, { total: number; confidenceSum: number; ambiguous: number }>();
    
    filteredData.forEach(job => {
      const category = job.primary_category;
      if (!categoryStats.has(category)) {
        categoryStats.set(category, { total: 0, confidenceSum: 0, ambiguous: 0 });
      }
      
      const stats = categoryStats.get(category)!;
      stats.total++;
      stats.confidenceSum += job.classification_confidence || 50;
      if (job.is_ambiguous_category) stats.ambiguous++;
    });

    const categoryPerformance = Array.from(categoryStats.entries()).map(([category, stats]) => ({
      category,
      totalJobs: stats.total,
      avgConfidence: Math.round(stats.confidenceSum / stats.total),
      ambiguityRate: Math.round((stats.ambiguous / stats.total) * 100),
      quality: stats.confidenceSum / stats.total >= 70 ? 'High' : 
               stats.confidenceSum / stats.total >= 40 ? 'Medium' : 'Low'
    })).sort((a, b) => b.totalJobs - a.totalJobs);

    return {
      totalJobs,
      avgConfidence,
      ambiguityRate,
      lowConfidenceRate,
      confidenceDistribution,
      categoryPerformance
    };
  }, [filteredData]);

  // Emerging terms analysis
  const emergingTermsAnalysis = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    
    const termFrequency = new Map<string, number>();
    
    filteredData.forEach(job => {
      if (job.emerging_terms_found && Array.isArray(job.emerging_terms_found)) {
        job.emerging_terms_found.forEach(term => {
          termFrequency.set(term, (termFrequency.get(term) || 0) + 1);
        });
      }
    });

    return Array.from(termFrequency.entries())
      .map(([term, frequency]) => ({
        term,
        frequency,
        percentage: Math.round((frequency / filteredData.length) * 100)
      }))
      .filter(item => item.frequency >= 2)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 15);
  }, [filteredData]);

  // Jobs needing review
  const reviewCandidates = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    
    return filteredData
      .filter(job => 
        (job.classification_confidence || 50) < 40 || 
        job.is_ambiguous_category ||
        (job.emerging_terms_found && job.emerging_terms_found.length > 2)
      )
      .map(job => {
        let reason = '';
        let priority = 'Medium';
        
        if ((job.classification_confidence || 50) < 25) {
          reason = 'Very low classification confidence';
          priority = 'High';
        } else if (job.is_ambiguous_category) {
          reason = 'Ambiguous between multiple categories';
          priority = 'Medium';
        } else if ((job.classification_confidence || 50) < 40) {
          reason = 'Low classification confidence';
          priority = 'Medium';
        } else if (job.emerging_terms_found && job.emerging_terms_found.length > 2) {
          reason = 'Contains multiple unrecognized terms';
          priority = 'Low';
        }
        
        return {
          id: job.id,
          title: job.title,
          category: job.primary_category,
          confidence: job.classification_confidence || 50,
          reason,
          priority,
          emergingTerms: job.emerging_terms_found || [],
          reasoning: job.classification_reasoning || []
        };
      })
      .sort((a, b) => {
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
      })
      .slice(0, 20);
  }, [filteredData]);

  // Hybrid category candidates
  const hybridCandidates = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    
    const hybridPatterns = new Map<string, number>();
    
    filteredData.forEach(job => {
      if (job.hybrid_category_candidate) {
        hybridPatterns.set(job.hybrid_category_candidate, (hybridPatterns.get(job.hybrid_category_candidate) || 0) + 1);
      }
    });

    return Array.from(hybridPatterns.entries())
      .map(([pattern, count]) => ({
        pattern,
        count,
        percentage: Math.round((count / filteredData.length) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredData]);

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'High': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Classification Intelligence Center</h2>
            <p className="text-gray-600 mt-1">
              Advanced insights into job classification quality and emerging patterns ({filteredData.length} jobs analyzed)
            </p>
          </div>
          <Brain className="h-12 w-12 text-indigo-600" />
        </div>
      </div>

      {/* Quality Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h4 className="font-semibold text-gray-900">Avg Confidence</h4>
          </div>
          <p className="text-3xl font-bold text-gray-900">{qualityMetrics.avgConfidence}%</p>
          <p className="text-sm text-gray-600">Classification accuracy</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <h4 className="font-semibold text-gray-900">Ambiguity Rate</h4>
          </div>
          <p className="text-3xl font-bold text-gray-900">{qualityMetrics.ambiguityRate}%</p>
          <p className="text-sm text-gray-600">Multiple category matches</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <h4 className="font-semibold text-gray-900">Low Confidence</h4>
          </div>
          <p className="text-3xl font-bold text-gray-900">{qualityMetrics.lowConfidenceRate}%</p>
          <p className="text-sm text-gray-600">Below 40% confidence</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Search className="h-5 w-5 text-blue-500" />
            <h4 className="font-semibold text-gray-900">Emerging Terms</h4>
          </div>
          <p className="text-3xl font-bold text-gray-900">{emergingTermsAnalysis.length}</p>
          <p className="text-sm text-gray-600">New patterns detected</p>
        </div>
      </div>

      {/* Confidence Distribution and Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Confidence Distribution */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Confidence Distribution
            </h3>
            <p className="text-sm text-gray-600 mt-1">How confident our classifications are</p>
          </div>
          
          <div className="p-6">
            {qualityMetrics.confidenceDistribution.length > 0 ? (
              <PieChart
                data={qualityMetrics.confidenceDistribution.map(item => ({
                  name: item.range,
                  value: item.count
                }))}
                height={300}
                colors={['#10B981', '#F59E0B', '#EF4444']}
                tooltipFormatter={(value: any, name: any) => [`${value} jobs`, name]}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No confidence data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Category Performance
            </h3>
            <p className="text-sm text-gray-600 mt-1">Classification quality by category</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-3">
              {qualityMetrics.categoryPerformance.slice(0, 8).map((category, index) => (
                <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{category.category}</div>
                    <div className="text-sm text-gray-500">{category.totalJobs} jobs</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-sm font-semibold">{category.avgConfidence}%</div>
                      <div className="text-xs text-gray-500">confidence</div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getQualityColor(category.quality)}`}>
                      {category.quality}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Emerging Terms and Hybrid Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Emerging Terms */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Emerging Terms
            </h3>
            <p className="text-sm text-gray-600 mt-1">New terminology appearing in job postings</p>
          </div>
          
          <div className="p-6">
            {emergingTermsAnalysis.length > 0 ? (
              <div className="space-y-2">
                {emergingTermsAnalysis.map((term, index) => (
                  <div key={term.term} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <span className="font-medium text-gray-900">{term.term}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{term.frequency} jobs</span>
                      <span className="text-xs text-gray-500">({term.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No emerging terms detected</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hybrid Category Patterns */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              Hybrid Categories
            </h3>
            <p className="text-sm text-gray-600 mt-1">Jobs spanning multiple categories</p>
          </div>
          
          <div className="p-6">
            {hybridCandidates.length > 0 ? (
              <div className="space-y-2">
                {hybridCandidates.map((hybrid, index) => (
                  <div key={hybrid.pattern} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <span className="font-medium text-gray-900">{hybrid.pattern}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{hybrid.count} jobs</span>
                      <span className="text-xs text-gray-500">({hybrid.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No hybrid patterns detected</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Jobs Needing Review */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Eye className="h-5 w-5 text-red-600" />
            Jobs Needing Review
          </h3>
          <p className="text-sm text-gray-600 mt-1">Classifications that require manual attention</p>
        </div>
        
        <div className="p-6">
          {reviewCandidates.length > 0 ? (
            <div className="space-y-3">
              {reviewCandidates.map((job, index) => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{job.title}</div>
                      <div className="text-sm text-gray-600">Category: {job.category}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{job.confidence}%</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(job.priority)}`}>
                        {job.priority}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Issue:</span> {job.reason}
                  </div>
                  
                  {job.emergingTerms.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Emerging terms:</span>
                      <span className="ml-2 text-purple-600">{job.emergingTerms.join(', ')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-300" />
                <p>All classifications look good!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
        <h4 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Classification Improvement Recommendations
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-indigo-800 mb-2">Immediate Actions</h5>
            <ul className="text-sm text-indigo-700 space-y-1">
              {qualityMetrics.lowConfidenceRate > 20 && (
                <li>• Review low-confidence classifications ({qualityMetrics.lowConfidenceRate}% of jobs)</li>
              )}
              {emergingTermsAnalysis.length > 5 && (
                <li>• Evaluate {emergingTermsAnalysis.length} emerging terms for dictionary updates</li>
              )}
              {hybridCandidates.length > 0 && (
                <li>• Consider creating hybrid categories for {hybridCandidates.length} common patterns</li>
              )}
              <li>• Monitor categories with low performance scores</li>
            </ul>
          </div>
          
          <div>
            <h5 className="font-medium text-purple-800 mb-2">Strategic Improvements</h5>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Refine category boundaries based on ambiguity patterns</li>
              <li>• Expand keyword dictionaries for emerging domains</li>
              <li>• Implement feedback loops for manual corrections</li>
              <li>• Consider context-aware classification enhancements</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassificationInsights;
