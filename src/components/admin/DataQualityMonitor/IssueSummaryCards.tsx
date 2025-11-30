/**
 * IssueSummaryCards - Grid of issue category cards
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { DataQualitySummary, IssueType } from '../../../types/dataQuality';

interface IssueSummaryCardsProps {
  summary: DataQualitySummary;
  onSelectIssue: (issueType: IssueType) => void;
}

interface IssueCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  count: number;
  issueType: IssueType;
  color: string;
}

export const IssueSummaryCards: React.FC<IssueSummaryCardsProps> = ({ summary, onSelectIssue }) => {
  const cards: IssueCard[] = [
    {
      id: 'language',
      icon: '🌐',
      title: 'Language Issues',
      description: 'Non-English content detected',
      count: summary.languageIssues.totalNonEnglish,
      issueType: 'non_english_content',
      color: 'bg-violet-50 border-violet-200 hover:border-violet-300'
    },
    {
      id: 'content',
      icon: '📝',
      title: 'Content Quality',
      description: 'Short/empty descriptions',
      count: summary.contentIssues.shortDescription.count + summary.contentIssues.emptyDescription.count,
      issueType: 'short_description',
      color: 'bg-blue-50 border-blue-200 hover:border-blue-300'
    },
    {
      id: 'location',
      icon: '📍',
      title: 'Location Issues',
      description: 'Unmatched duty stations',
      count: summary.unmappedLocations.reduce((sum, l) => sum + l.count, 0),
      issueType: 'unmatched_duty_station',
      color: 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
    },
    {
      id: 'duplicates',
      icon: '🔄',
      title: 'Duplicates',
      description: 'Likely duplicate records',
      count: summary.duplicateGroups.reduce((sum, g) => sum + g.jobs.length, 0),
      issueType: 'potential_duplicate',
      color: 'bg-amber-50 border-amber-200 hover:border-amber-300'
    },
    {
      id: 'category',
      icon: '🏷️',
      title: 'Classification',
      description: 'Low confidence or missing',
      count: (summary.byIssueType.low_classification_confidence || 0) + (summary.byIssueType.null_sectoral_category || 0),
      issueType: 'low_classification_confidence',
      color: 'bg-rose-50 border-rose-200 hover:border-rose-300'
    },
    {
      id: 'grades',
      icon: '📊',
      title: 'Grade Issues',
      description: 'Invalid or missing grades',
      count: summary.unrecognizedGrades.reduce((sum, g) => sum + g.count, 0),
      issueType: 'invalid_grade',
      color: 'bg-orange-50 border-orange-200 hover:border-orange-300'
    },
    {
      id: 'dates',
      icon: '📅',
      title: 'Date Issues',
      description: 'Parse errors or anomalies',
      count: summary.dateAnomalies.length,
      issueType: 'date_anomaly',
      color: 'bg-cyan-50 border-cyan-200 hover:border-cyan-300'
    },
    {
      id: 'labels',
      icon: '🤖',
      title: 'AI Pipeline',
      description: 'Empty labels/categories',
      count: summary.contentIssues.emptyLabels.count,
      issueType: 'empty_labels',
      color: 'bg-purple-50 border-purple-200 hover:border-purple-300'
    }
  ];
  
  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Issue Breakdown</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => onSelectIssue(card.issueType)}
            className={`relative p-4 rounded-xl border-2 text-left transition-all ${card.color} hover:shadow-md`}
          >
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className="text-sm font-semibold text-slate-900">{card.title}</div>
            <div className="text-3xl font-bold text-slate-900 my-2">
              {card.count.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500">{card.description}</div>
            <div className="absolute bottom-4 right-4">
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};


