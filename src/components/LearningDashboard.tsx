import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Zap, Eye, CheckCircle, Clock, Target, Activity } from 'lucide-react';
import { unifiedLearningEngine } from '../services/learning/UnifiedLearningEngine';
import { JOB_CLASSIFICATION_DICTIONARY } from '../dictionary';

interface LearningStats {
  totalFeedback: number;
  totalPatterns: number;
  totalUpdates: number;
  totalActions: number;
  autoAppliedUpdates: number;
  recentActions: any[];
}

interface LearningAction {
  id: string;
  type: 'keyword_addition' | 'pattern_recognition' | 'category_update' | 'positive_reinforcement';
  timestamp: string;
  categoryId: string;
  description: string;
  confidence: number;
  supportingJobs: string[];
  autoApplied: boolean;
  details?: {
    reinforcedKeywords?: string[];
    jobTitle?: string;
    totalKeywords?: number;
    extractedKeywords?: string[];
    suggestedKeywords?: string[];
    contextPairs?: [string, string][];
  };
}

interface DictionaryUpdate {
  categoryId: string;
  newCoreKeywords: string[];
  newSupportKeywords: string[];
  newContextPairs: string[][];
  timestamp: string;
  autoApplied: boolean;
  confidence: number;
}

export const LearningDashboard: React.FC = () => {
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [insights, setInsights] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'actions' | 'updates' | 'insights'>('overview');

  useEffect(() => {
    loadLearningData();
  }, []);

  const loadLearningData = () => {
    const learningStats = unifiedLearningEngine.getStats();
    const learningInsights = unifiedLearningEngine.getLearningInsights();
    
    setStats(learningStats);
    setInsights(learningInsights);
  };

  const clearLearningData = () => {
    if (window.confirm('Are you sure you want to clear all learning data? This will remove old generic patterns and allow the system to learn fresh category-specific patterns.')) {
      unifiedLearningEngine.clearAllData();
      loadLearningData();
      alert('Learning data cleared! The system will now learn optimized, category-specific patterns from new corrections.');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getCategoryName = (categoryId: string) => {
    const category = JOB_CLASSIFICATION_DICTIONARY.find(c => c.id === categoryId);
    return category?.name || categoryId;
  };

  const getCategoryColor = (categoryId: string) => {
    const category = JOB_CLASSIFICATION_DICTIONARY.find(c => c.id === categoryId);
    return category?.color || '#6B7280';
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'keyword_addition': return <Target className="h-4 w-4" />;
      case 'pattern_recognition': return <Brain className="h-4 w-4" />;
      case 'category_update': return <Zap className="h-4 w-4" />;
      case 'positive_reinforcement': return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (type: string, autoApplied: boolean) => {
    if (autoApplied) return 'text-green-600 bg-green-100';
    switch (type) {
      case 'keyword_addition': return 'text-blue-600 bg-blue-100';
      case 'pattern_recognition': return 'text-purple-600 bg-purple-100';
      case 'category_update': return 'text-orange-600 bg-orange-100';
      case 'positive_reinforcement': return 'text-teal-600 bg-teal-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!stats || !insights) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading learning data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Learning System Dashboard</h1>
        </div>
        <p className="text-gray-600">
          Monitor how the AI system learns from human feedback and improves classification accuracy
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Feedback</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFeedback}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Learned Patterns</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPatterns}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Dictionary Updates</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUpdates}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Auto-Applied</p>
              <p className="text-2xl font-bold text-gray-900">{stats.autoAppliedUpdates}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: Activity },
              { id: 'actions', name: 'Recent Actions', icon: Clock },
              { id: 'updates', name: 'Dictionary Updates', icon: Zap },
              { id: 'insights', name: 'Learning Insights', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* Learning System Status */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center space-x-3 mb-4">
                  <Brain className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Optimized Learning System Status</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">❌ Old Learning (Generic)</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>• "field + research" (appeared everywhere)</div>
                      <div>• "report + writing" (too generic)</div>
                      <div>• "science + international" (meaningless)</div>
                      <div>• "university + academic" (generic requirement)</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">✅ New Learning (Category-Specific)</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>• "protection + standards" (Peace & Security)</div>
                      <div>• "software + development" (Digital Technology)</div>
                      <div>• "cleaning + services" (Operations & Logistics)</div>
                      <div>• "medical + care" (Health & Medical)</div>
                    </div>
                  </div>
                </div>
                {stats.totalUpdates === 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <strong>Action Required:</strong> Click "Clear Old Learning Data" to remove generic patterns, then make corrections to see optimized learning!
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900">Accuracy Improvement</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {insights.accuracyImprovement > 0 ? '+' : ''}{Math.round(insights.accuracyImprovement * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-900">Auto-Apply Rate</span>
                      <span className="text-2xl font-bold text-green-600">
                        {stats.totalUpdates > 0 ? Math.round((stats.autoAppliedUpdates / stats.totalUpdates) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-purple-900">Category-Specific Patterns</span>
                      <span className="text-2xl font-bold text-purple-600">{stats.totalPatterns}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Learning Activity</h3>
                <div className="space-y-3">
                  {stats.recentActions.slice(0, 5).map((action: any, index: number) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-full ${getActionColor(action.type, action.autoApplied)}`}>
                        {getActionIcon(action.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{action.description}</p>
                        <p className="text-xs text-gray-500">
                          {getCategoryName(action.categoryId)} • {formatTimestamp(action.timestamp)}
                        </p>
                      </div>
                      {action.autoApplied && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Auto-Applied
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'actions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">All Learning Actions</h3>
                <div className="text-sm text-gray-500">
                  Detailed view of what the AI learns from each interaction
                </div>
              </div>
              
              {/* Learning Explanations */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Understanding Learning Actions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                  <div>
                    <strong>Positive Reinforcement:</strong> When you confirm a job is correctly classified, the system reinforces the keywords that led to the correct decision.
                  </div>
                  <div>
                    <strong>Pattern Recognition:</strong> When you correct a job, the system extracts new keywords and identifies patterns for future classifications.
                  </div>
                  <div>
                    <strong>Category Update:</strong> High-confidence patterns (≥80%) are automatically added to the dictionary to improve future classifications.
                  </div>
                  <div>
                    <strong>Keyword Addition:</strong> Specific terms that strongly indicate a category are added as core or support keywords.
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {insights.actions.map((action: LearningAction) => (
                  <div key={action.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${getActionColor(action.type, action.autoApplied)}`}>
                          {getActionIcon(action.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{action.description}</h4>
                          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                            <span>Category: {getCategoryName(action.categoryId)}</span>
                            <span>Confidence: {Math.round(action.confidence * 100)}%</span>
                            <span>Jobs: {action.supportingJobs.length}</span>
                            <span>{formatTimestamp(action.timestamp)}</span>
                          </div>
                          
                          {/* Show detailed information */}
                          {action.details && (
                            <div className="mt-3 space-y-2">
                              {action.details.jobTitle && (
                                <div className="text-xs">
                                  <span className="font-medium text-gray-700">Job Title:</span>
                                  <span className="ml-1 text-gray-600 italic">"{action.details.jobTitle}"</span>
                                </div>
                              )}
                              
                              {action.details.reinforcedKeywords && action.details.reinforcedKeywords.length > 0 && (
                                <div className="text-xs">
                                  <span className="font-medium text-gray-700">Keywords Reinforced:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {action.details.reinforcedKeywords.slice(0, 10).map((keyword, i) => (
                                      <span key={i} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                        {keyword}
                                      </span>
                                    ))}
                                    {action.details.reinforcedKeywords.length > 10 && (
                                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                        +{action.details.reinforcedKeywords.length - 10} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {action.details.extractedKeywords && action.details.extractedKeywords.length > 0 && (
                                <div className="text-xs">
                                  <span className="font-medium text-gray-700">Keywords Extracted:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {action.details.extractedKeywords.slice(0, 8).map((keyword, i) => (
                                      <span key={i} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                        {keyword}
                                      </span>
                                    ))}
                                    {action.details.extractedKeywords.length > 8 && (
                                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                        +{action.details.extractedKeywords.length - 8} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {action.details.suggestedKeywords && action.details.suggestedKeywords.length > 0 && (
                                <div className="text-xs">
                                  <span className="font-medium text-gray-700">Pattern Suggestions:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {action.details.suggestedKeywords.map((keyword, i) => (
                                      <span key={i} className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                                        {keyword}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {action.details.contextPairs && action.details.contextPairs.length > 0 && (
                                <div className="text-xs">
                                  <span className="font-medium text-gray-700">Context Pairs Found:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {action.details.contextPairs.slice(0, 5).map((pair, i) => (
                                      <span key={i} className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                                        {pair[0]} + {pair[1]}
                                      </span>
                                    ))}
                                    {action.details.contextPairs.length > 5 && (
                                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                        +{action.details.contextPairs.length - 5} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {action.autoApplied && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Auto-Applied
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(action.type, false)}`}>
                          {action.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === 'updates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Dictionary Updates</h3>
                <div className="text-sm text-gray-500">
                  Showing category-specific patterns learned from corrections
                </div>
              </div>
              
              {/* Dictionary Update Explanations */}
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <h4 className="font-medium text-amber-900 mb-2">How Dictionary Updates Work</h4>
                <div className="space-y-2 text-sm text-amber-800">
                  <div><strong>Trigger:</strong> When you correct a job classification, the system analyzes the job content and extracts category-specific keywords.</div>
                  <div><strong>Threshold:</strong> Keywords need ≥3 supporting jobs and ≥70% confidence to be suggested for dictionary updates.</div>
                  <div><strong>Auto-Apply:</strong> Suggestions with ≥80% confidence are automatically added to the dictionary to improve future classifications.</div>
                  <div><strong>Category-Specific:</strong> Only domain-specific terms are learned (e.g., "cleaning + services" for Operations, not generic "field + research").</div>
                  <div><strong>Real-time:</strong> The category's "lastUpdated" timestamp is updated when new keywords are added.</div>
                </div>
              </div>
              
              {insights.updates.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Brain className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No learning updates yet.</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Make some job corrections to see the new optimized learning in action!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {insights.updates.map((update: DictionaryUpdate, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            <span 
                              className="inline-block w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: getCategoryColor(update.categoryId) }}
                            ></span>
                            {getCategoryName(update.categoryId)}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTimestamp(update.timestamp)} • Confidence: {Math.round(update.confidence * 100)}%
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          {update.autoApplied && (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              Auto-Applied
                            </span>
                          )}
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            Optimized Learning
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {update.newCoreKeywords.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-gray-700">Core Keywords Added:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {update.newCoreKeywords.map((keyword, i) => (
                                <span key={i} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {update.newSupportKeywords.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-gray-700">Support Keywords Added:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {update.newSupportKeywords.map((keyword, i) => (
                                <span key={i} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {update.newContextPairs.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-gray-700">Category-Specific Context Pairs:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {update.newContextPairs.map((pair, i) => (
                                <span key={i} className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                                  {pair[0]} + {pair[1]}
                                </span>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              These pairs are specific to {getCategoryName(update.categoryId)} domain
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTab === 'insights' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(insights.categoryAccuracy).map(([categoryId, accuracy]) => {
                    const accuracyNum = typeof accuracy === 'number' ? accuracy : 0;
                    return (
                      <div key={categoryId} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{getCategoryName(categoryId)}</p>
                            <p className="text-xs text-gray-500">Classification Accuracy</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${accuracyNum > 0.8 ? 'text-green-600' : accuracyNum > 0.6 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {Math.round(accuracyNum * 100)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Suggested Keywords</h3>
                  <div className="text-sm text-gray-500">
                    Category-specific terms only (generic keywords filtered out)
                  </div>
                </div>
                
                {/* Keyword Suggestion Explanation */}
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 mb-4">
                  <h4 className="font-medium text-purple-900 mb-2">Keyword Suggestion Logic</h4>
                  <div className="space-y-1 text-sm text-purple-800">
                    <div><strong>Category Specificity:</strong> Keywords must be specific to the domain (e.g., "maintenance" for Operations, not generic "research").</div>
                    <div><strong>Support Threshold:</strong> Must appear in ≥3 jobs of the same category to be considered reliable.</div>
                    <div><strong>Confidence Score:</strong> Based on frequency in target category vs. appearance in other categories.</div>
                    <div><strong>Auto-Filtered:</strong> Generic terms like "information", "science", "management" are automatically excluded.</div>
                  </div>
                </div>
                
                {insights.suggestedKeywords.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <Brain className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No category-specific keyword suggestions yet.</p>
                    <p className="text-sm text-gray-500 mt-1">
                      The optimized system only suggests meaningful, domain-specific terms.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {insights.suggestedKeywords.slice(0, 10).map((suggestion: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium text-gray-900">{suggestion.keyword}</span>
                            <span className="ml-2 text-sm text-gray-500">
                              for {getCategoryName(suggestion.category)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-600">
                              {suggestion.supportingJobs} jobs
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              suggestion.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                              suggestion.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {Math.round(suggestion.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                        
                        {suggestion.categorySpecificity && (
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Category Specificity: {Math.round(suggestion.categorySpecificity * 100)}%</span>
                            <span className={`px-2 py-1 rounded-full ${
                              suggestion.categorySpecificity > 0.8 ? 'bg-green-100 text-green-700' :
                              suggestion.categorySpecificity > 0.6 ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {suggestion.categorySpecificity > 0.8 ? 'Highly Specific' :
                               suggestion.categorySpecificity > 0.6 ? 'Moderately Specific' :
                               'Low Specificity'}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {insights.suggestedKeywords.length === 0 && (
                      <div className="text-center py-4 text-sm text-gray-500">
                        Old generic suggestions have been filtered out. Make more corrections to generate meaningful suggestions!
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={loadLearningData}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <Activity className="h-4 w-4 mr-2" />
          Refresh Data
        </button>
        <button
          onClick={clearLearningData}
          className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
        >
          <Brain className="h-4 w-4 mr-2" />
          Clear Old Learning Data
        </button>
      </div>
    </div>
  );
};
