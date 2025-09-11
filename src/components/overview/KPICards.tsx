import React from 'react';
import { Briefcase, Users, Award, Target } from 'lucide-react';

interface KPICardsProps {
  totalJobs: number;
  totalAgencies: number;
  isAgencyView: boolean;
  selectedAgencyName: string;
  agencyMarketShare: number;
  agencyRank: number | null;
  monthOverMonthGrowth: number;
  topCategoryPercentage: number;
  topCategoryName: string;
  medianApplicationWindow: number;
  urgentRate: number;
}

const KPICards: React.FC<KPICardsProps> = ({
  totalJobs,
  totalAgencies,
  isAgencyView,
  selectedAgencyName,
  agencyMarketShare,
  agencyRank,
  monthOverMonthGrowth,
  topCategoryPercentage,
  topCategoryName,
  medianApplicationWindow,
  urgentRate
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="metric-card">
        <div className="metric-value">{totalJobs}</div>
        <div className="metric-trend">
          <span className="text-green-600 text-sm">↗ +{monthOverMonthGrowth.toFixed(0)}% vs last month</span>
        </div>
        <div className="metric-label">
          <Briefcase className="h-4 w-4 mr-1" />
          {isAgencyView ? 'Agency Job Postings' : 'Total Job Postings'}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {isAgencyView ? `${selectedAgencyName} positions` : 'All agencies combined'}
        </div>
      </div>
      
      <div className="metric-card">
        <div className="metric-value">
          {isAgencyView ? `${agencyMarketShare.toFixed(1)}%` : totalAgencies}
        </div>
        <div className="metric-trend">
          <span className="text-yellow-600 text-sm">
            {isAgencyView ? (agencyMarketShare > 5 ? 'Strong' : 'Growing') : 'High'}
          </span>
        </div>
        <div className="metric-label">
          <Users className="h-4 w-4 mr-1" />
          {isAgencyView ? 'Market Share' : 'Competition Level'}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {isAgencyView ? 'Share of total market' : `${totalAgencies} active agencies`}
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-value">
          {isAgencyView ? (agencyRank ? `#${agencyRank}` : 'Unranked') : `${topCategoryPercentage.toFixed(1)}%`}
        </div>
        <div className="metric-trend">
          <span className="text-blue-600 text-sm">
            {isAgencyView ? (agencyRank && agencyRank <= 5 ? '↗ Top 5' : '→ Stable') : '↗ Leading'}
          </span>
        </div>
        <div className="metric-label">
          <Award className="h-4 w-4 mr-1" />
          {isAgencyView ? 'Market Ranking' : 'Top Category Share'}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {isAgencyView ? 'Among all agencies' : topCategoryName}
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-value">
          {isAgencyView ? medianApplicationWindow : Math.round(urgentRate)}
        </div>
        <div className="metric-trend">
          <span className={`text-sm ${isAgencyView ? 'text-green-600' : urgentRate > 25 ? 'text-orange-600' : 'text-green-600'}`}>
            {isAgencyView ? '2 days faster' : urgentRate > 25 ? 'High urgency' : 'Moderate'}
          </span>
        </div>
        <div className="metric-label">
          <Target className="h-4 w-4 mr-1" />
          {isAgencyView ? 'Avg. App. Window' : 'Urgent Hiring Rate'}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {isAgencyView ? 'Days to apply' : '% positions <14 days'}
        </div>
      </div>
    </div>
  );
};

export default KPICards;
