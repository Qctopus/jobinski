/**
 * SectionHeader - Standardized header for sections within tabs
 * 
 * Does NOT include agency name - that's handled by TabHeader
 * Shows: [Icon] Section Title
 *        Section description/subtitle
 */

import React from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  iconColor?: 'blue' | 'green' | 'purple' | 'amber' | 'red' | 'indigo' | 'teal' | 'orange';
  action?: React.ReactNode;
  compact?: boolean;
}

const iconColorClasses = {
  blue: 'text-blue-500',
  green: 'text-green-500',
  purple: 'text-purple-500',
  amber: 'text-amber-500',
  red: 'text-red-500',
  indigo: 'text-indigo-500',
  teal: 'text-teal-500',
  orange: 'text-orange-500'
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  icon,
  iconColor = 'blue',
  action,
  compact = false
}) => {
  return (
    <div className={`flex items-start justify-between ${compact ? 'mb-3' : 'mb-4'}`}>
      <div className="flex items-start gap-2">
        {icon && (
          <div className={`mt-0.5 ${iconColorClasses[iconColor]}`}>
            {icon}
          </div>
        )}
        <div>
          <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
            {title}
          </h3>
          {description && (
            <p className={`text-gray-500 mt-0.5 ${compact ? 'text-xs' : 'text-sm'}`}>
              {description}
            </p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
};

/**
 * SectionCard - A section with header and content wrapped in a card
 */
interface SectionCardProps extends SectionHeaderProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  children,
  className = '',
  noPadding = false,
  ...headerProps
}) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className={noPadding ? 'p-4 pb-0' : 'p-4'}>
        <SectionHeader {...headerProps} />
      </div>
      <div className={noPadding ? '' : 'px-4 pb-4'}>
        {children}
      </div>
    </div>
  );
};

export default SectionHeader;





