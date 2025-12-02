/**
 * NarrativeBlock Component
 * 
 * Full-width narrative text block with supporting callouts.
 */

import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Info, CheckCircle, Lightbulb } from 'lucide-react';

export interface Callout {
  type: 'positive' | 'negative' | 'neutral' | 'warning' | 'info';
  text: string;
}

export interface NarrativeBlockProps {
  headline?: string;
  body: string | string[];
  callouts?: Callout[];
  highlights?: string[];
  variant?: 'default' | 'highlight' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const NarrativeBlock: React.FC<NarrativeBlockProps> = ({
  headline,
  body,
  callouts,
  highlights,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const bodyArray = Array.isArray(body) ? body : [body];

  const variantStyles = {
    default: 'bg-white border-gray-200',
    highlight: 'bg-gradient-to-r from-slate-50 to-blue-50 border-blue-200',
    subtle: 'bg-gray-50 border-gray-100'
  };

  const sizeStyles = {
    sm: { container: 'p-3', headline: 'text-sm', body: 'text-xs' },
    md: { container: 'p-4', headline: 'text-base', body: 'text-sm' },
    lg: { container: 'p-5 md:p-6', headline: 'text-lg', body: 'text-base' }
  };

  const calloutIcons: Record<Callout['type'], React.ReactNode> = {
    positive: <TrendingUp className="h-3.5 w-3.5" />,
    negative: <TrendingDown className="h-3.5 w-3.5" />,
    neutral: <Info className="h-3.5 w-3.5" />,
    warning: <AlertTriangle className="h-3.5 w-3.5" />,
    info: <Lightbulb className="h-3.5 w-3.5" />
  };

  const calloutStyles: Record<Callout['type'], string> = {
    positive: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    negative: 'bg-red-100 text-red-700 border-red-200',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200'
  };

  const styles = sizeStyles[size];

  return (
    <div className={`rounded-xl border ${variantStyles[variant]} ${styles.container} ${className}`}>
      {/* Headline */}
      {headline && (
        <h3 className={`${styles.headline} font-semibold text-gray-900 mb-3 leading-snug`}>
          {headline}
        </h3>
      )}

      {/* Body text */}
      <div className={`${styles.body} text-gray-700 leading-relaxed space-y-2`}>
        {bodyArray.map((text, index) => (
          <p key={index}>{text}</p>
        ))}
      </div>

      {/* Highlights */}
      {highlights && highlights.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {highlights.map((highlight, index) => (
            <span 
              key={index}
              className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
            >
              {highlight}
            </span>
          ))}
        </div>
      )}

      {/* Callouts */}
      {callouts && callouts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
          {callouts.map((callout, index) => (
            <span 
              key={index}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${calloutStyles[callout.type]}`}
            >
              {calloutIcons[callout.type]}
              {callout.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default NarrativeBlock;


