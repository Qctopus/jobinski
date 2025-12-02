/**
 * TabHeader - Standardized main header for each tab
 * 
 * Shows: [Logo] Agency Name + Tab Title | Stats | Optional badge
 * Example: [🦋] UNICEF Geographic Intelligence  139 countries • 1,081 positions  [3 insights]
 */

import React from 'react';
import { AlertTriangle, Zap, TrendingUp } from 'lucide-react';
import { getAgencyLogo } from '../../utils/agencyLogos';

interface TabHeaderProps {
  agencyName?: string;
  tabTitle: string;
  stats?: string;
  isAgencyView: boolean;
  badge?: {
    type: 'insight' | 'alert' | 'highlight';
    count?: number;
    label?: string;
  };
  icon?: React.ReactNode;
}

export const TabHeader: React.FC<TabHeaderProps> = ({
  agencyName,
  tabTitle,
  stats,
  isAgencyView,
  badge,
  icon
}) => {
  const displayName = isAgencyView && agencyName ? agencyName : 'UN Talent Market';
  const logo = isAgencyView && agencyName 
    ? getAgencyLogo(agencyName) 
    : '/logo/logo/United_Nations.png';

  const getBadgeStyles = () => {
    switch (badge?.type) {
      case 'alert':
        return { bg: 'bg-red-50', text: 'text-red-600', icon: <AlertTriangle className="h-3.5 w-3.5" /> };
      case 'highlight':
        return { bg: 'bg-blue-50', text: 'text-blue-600', icon: <TrendingUp className="h-3.5 w-3.5" /> };
      case 'insight':
      default:
        return { bg: 'bg-amber-50', text: 'text-amber-600', icon: <Zap className="h-3.5 w-3.5" /> };
    }
  };

  const badgeStyles = badge ? getBadgeStyles() : null;

  return (
    <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {logo ? (
          <img 
            src={logo} 
            alt={displayName} 
            className="h-6 w-6 object-contain flex-shrink-0" 
          />
        ) : icon ? (
          <div className="h-6 w-6 flex items-center justify-center text-blue-600">
            {icon}
          </div>
        ) : null}
        
        <div className="flex items-baseline gap-2">
          <h1 className="text-base font-semibold text-gray-900">
            {displayName} {tabTitle}
          </h1>
          {stats && (
            <span className="text-sm text-gray-500">
              {stats}
            </span>
          )}
        </div>
      </div>

      {badge && (
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${badgeStyles?.bg} ${badgeStyles?.text}`}>
          {badgeStyles?.icon}
          <span className="text-xs font-medium">
            {badge.count !== undefined ? `${badge.count} ${badge.label || 'insight'}${badge.count !== 1 ? 's' : ''}` : badge.label}
          </span>
        </div>
      )}
    </div>
  );
};

export default TabHeader;


