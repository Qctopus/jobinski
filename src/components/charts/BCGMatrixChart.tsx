import React from 'react';
import { Star, HelpCircle, DollarSign, XCircle } from 'lucide-react';
import { CategoryMatrix } from '../../services/analytics/CategoryEvolutionAnalyzer';

interface BCGMatrixChartProps {
  matrix: CategoryMatrix;
  onCategoryClick?: (category: string) => void;
}

/**
 * BCG Matrix Visualization
 * Shows strategic positioning of categories
 * Phase 2 Tab 2 implementation
 */
export const BCGMatrixChart: React.FC<BCGMatrixChartProps> = ({ matrix, onCategoryClick }) => {
  const quadrants = [
    {
      id: 'stars',
      title: 'Stars',
      subtitle: 'High Growth • High Share',
      categories: matrix.stars,
      icon: Star,
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-700',
      description: 'Market leaders in growing segments',
      recommendation: 'Invest & maintain position'
    },
    {
      id: 'question_marks',
      title: 'Question Marks',
      subtitle: 'High Growth • Low Share',
      categories: matrix.question_marks,
      icon: HelpCircle,
      color: 'purple',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-300',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-700',
      description: 'Growing markets, need investment',
      recommendation: 'Selective investment or exit'
    },
    {
      id: 'cash_cows',
      title: 'Cash Cows',
      subtitle: 'Low Growth • High Share',
      categories: matrix.cash_cows,
      icon: DollarSign,
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
      iconColor: 'text-green-600',
      textColor: 'text-green-700',
      description: 'Stable position in mature markets',
      recommendation: 'Maintain & optimize'
    },
    {
      id: 'dogs',
      title: 'Dogs',
      subtitle: 'Low Growth • Low Share',
      categories: matrix.dogs,
      icon: XCircle,
      color: 'gray',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-300',
      iconColor: 'text-gray-600',
      textColor: 'text-gray-700',
      description: 'Low priority segments',
      recommendation: 'Consider exit or minimal investment'
    }
  ];

  const getStrategicPriorityBadge = (priority: string) => {
    const badges = {
      must_win: { color: 'bg-red-100 text-red-700', label: 'Must Win' },
      selective: { color: 'bg-amber-100 text-amber-700', label: 'Selective' },
      maintenance: { color: 'bg-blue-100 text-blue-700', label: 'Maintain' },
      exit: { color: 'bg-gray-100 text-gray-700', label: 'Exit' }
    };
    return badges[priority as keyof typeof badges] || badges.selective;
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">BCG Strategic Portfolio Matrix</h3>
        <p className="text-sm text-gray-600">
          Category positioning based on growth rate and market share
        </p>
      </div>

      {/* Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {quadrants.map(quadrant => {
          const Icon = quadrant.icon;
          return (
            <div
              key={quadrant.id}
              className={`${quadrant.bgColor} border-2 ${quadrant.borderColor} rounded-xl p-5 hover:shadow-lg transition-all`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${quadrant.iconColor} bg-white rounded-lg`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{quadrant.title}</h4>
                    <p className="text-xs text-gray-600">{quadrant.subtitle}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 ${quadrant.textColor} bg-white rounded-full text-xs font-semibold`}>
                  {quadrant.categories.length}
                </div>
              </div>

              {/* Description */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <p className="text-xs text-gray-700 mb-2">{quadrant.description}</p>
                <p className="text-xs font-semibold text-gray-900">→ {quadrant.recommendation}</p>
              </div>

              {/* Categories */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {quadrant.categories.length > 0 ? (
                  quadrant.categories.map(category => {
                    const priorityBadge = getStrategicPriorityBadge(category.strategic_priority);
                    return (
                      <div
                        key={category.category}
                        onClick={() => onCategoryClick?.(category.category)}
                        className="bg-white rounded-lg p-3 hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                              {category.category}
                            </h5>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${priorityBadge.color}`}>
                                {priorityBadge.label}
                              </span>
                              <span className="text-xs text-gray-500">
                                {category.agencies_competing} agencies
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div>
                            <div className="text-xs text-gray-500">Growth</div>
                            <div className={`text-sm font-semibold ${category.growth_rate_3m > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                              {category.growth_rate_3m > 0 ? '+' : ''}{category.growth_rate_3m.toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Your Share</div>
                            <div className="text-sm font-semibold text-gray-900">
                              {category.your_market_share.toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Open</div>
                            <div className="text-sm font-semibold text-gray-900">
                              {category.current_open}
                            </div>
                          </div>
                        </div>

                        {/* Leader indicator */}
                        {category.market_leader && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <span className="text-xs text-gray-600">
                              Leader: <span className="font-semibold">{category.market_leader}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No categories in this quadrant
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="font-semibold text-gray-900">Stars:</span>
            <span className="text-gray-600 ml-1">Invest heavily, these are your winners</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900">Question Marks:</span>
            <span className="text-gray-600 ml-1">Evaluate potential, invest selectively</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900">Cash Cows:</span>
            <span className="text-gray-600 ml-1">Optimize efficiency, maintain position</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900">Dogs:</span>
            <span className="text-gray-600 ml-1">Consider exit or minimal resources</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BCGMatrixChart;




