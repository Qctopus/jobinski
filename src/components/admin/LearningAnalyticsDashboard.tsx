import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Target, Award, AlertTriangle, CheckCircle, 
  Clock, BarChart3, Lightbulb, RefreshCw 
} from 'lucide-react';
import { BarChart, LineChart } from '../charts';
import { unifiedLearningEngine } from '../../services/learning/UnifiedLearningEngine';
import { LearningInsights, DictionaryUpdateSuggestion } from '../../types/feedback';
import { JOB_CLASSIFICATION_DICTIONARY } from '../../dictionary';

export const LearningAnalyticsDashboard: React.FC = () => {
  const learningEngine = unifiedLearningEngine;
  const [insights, setInsights] = useState<LearningInsights | null>(null);
  const [autoSuggestions, setAutoSuggestions] = useState<DictionaryUpdateSuggestion[]>([]);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'suggestions' | 'feedback'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const learningInsights = learningEngine.getLearningInsights();
      // Convert suggested keywords to DictionaryUpdateSuggestion format
      const suggestions: DictionaryUpdateSuggestion[] = learningInsights.suggestedKeywords
        .filter(s => s.confidence >= 0.7)
        .map(s => ({
          categoryId: s.category,
          action: s.confidence > 0.8 ? 'add_core_keyword' : 'add_support_keyword',
          keyword: s.keyword,
          confidence: s.confidence,
          supportingJobs: Array(s.supportingJobs).fill('').map((_, i) => `job-${i}`),
          frequency: s.supportingJobs
        })) as DictionaryUpdateSuggestion[];
      
      setInsights(learningInsights);
      setAutoSuggestions(suggestions);
    } catch (error) {
      console.error('Error loading learning data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestion = (suggestion: DictionaryUpdateSuggestion) => {
    // Manual application of suggestions - the unified engine handles auto-application
    console.log('Manual suggestion application:', suggestion);
    // In the new unified system, high-confidence suggestions are auto-applied
    // This is now for manual review/override of lower-confidence suggestions
    loadData(); // Refresh data
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
        <span className="ml-3 text-gray-600">Loading learning analytics...</span>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Learning Data Available</h3>
        <p className="text-gray-600">Start collecting user feedback to see learning analytics.</p>
      </div>
    );
  }

  const categoryAccuracyData = Object.entries(insights.categoryAccuracy).map(([category, accuracy]) => {
    const categoryInfo = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === category);
    return {
      name: categoryInfo?.name || category,
      value: Math.round(accuracy * 100)
    };
  }).sort((a, b) => a.value - b.value);

  const overallAccuracy = Object.values(insights.categoryAccuracy).reduce((sum, acc) => sum + acc, 0) / 
                          Object.keys(insights.categoryAccuracy).length;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Analytics</h1>
            <p className="text-gray-600">Monitor classification accuracy and system improvements</p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Feedback</p>
              <p className="text-2xl font-bold text-gray-900">{insights.totalFeedback}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Accuracy</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(overallAccuracy * 100)}%</p>
            </div>
            <Target className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Improvement</p>
              <p className={`text-2xl font-bold ${insights.accuracyImprovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {insights.accuracyImprovement >= 0 ? '+' : ''}{Math.round(insights.accuracyImprovement * 100)}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Auto Suggestions</p>
              <p className="text-2xl font-bold text-gray-900">{autoSuggestions.length}</p>
            </div>
            <Lightbulb className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'suggestions', label: 'Auto Suggestions', icon: Lightbulb },
              { id: 'feedback', label: 'Feedback Analysis', icon: Users }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Category Accuracy Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Accuracy</h3>
            <div className="h-80">
              <BarChart
                data={categoryAccuracyData}
                xAxisKey="name"
                dataKey="value"
                title="Classification Accuracy by Category (%)"
                color="#3B82F6"
              />
            </div>
          </div>

          {/* Common Misclassifications */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Misclassifications</h3>
            <div className="space-y-3">
              {insights.commonMisclassifications.slice(0, 5).map((misc, idx) => {
                const fromCategory = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === misc.fromCategory);
                const toCategory = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === misc.toCategory);
                
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <div className="font-medium text-red-900">
                        {fromCategory?.name} → {toCategory?.name}
                      </div>
                      <div className="text-sm text-red-700">
                        Common terms: {misc.commonKeywords.join(', ')}
                      </div>
                    </div>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                      {misc.frequency} cases
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'suggestions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Automated Improvement Suggestions</h3>
            <span className="text-sm text-gray-600">
              {autoSuggestions.length} high-confidence suggestions ready for review
            </span>
          </div>

          {autoSuggestions.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No auto-suggestions available yet. More feedback data is needed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {autoSuggestions.map((suggestion, idx) => {
                const category = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === suggestion.categoryId);
                
                return (
                  <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">{category?.name}</span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {suggestion.action.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          Add keyword: <span className="font-mono bg-gray-100 px-1 rounded">{suggestion.keyword}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Confidence: {Math.round(suggestion.confidence * 100)}%</span>
                          <span>Supporting jobs: {suggestion.supportingJobs.length}</span>
                          <span>Frequency: {suggestion.frequency}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleApplySuggestion(suggestion)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                        >
                          Apply
                        </button>
                        <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors">
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'feedback' && (
        <div className="space-y-6">
          {/* Suggested Keywords */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Suggested Keywords</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.suggestedKeywords.slice(0, 10).map((suggestion, idx) => {
                const category = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === suggestion.category);
                
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <div className="font-medium text-blue-900">{suggestion.keyword}</div>
                      <div className="text-sm text-blue-700">{category?.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-900">
                        {Math.round(suggestion.confidence * 100)}%
                      </div>
                      <div className="text-xs text-blue-600">
                        {suggestion.supportingJobs} jobs
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
