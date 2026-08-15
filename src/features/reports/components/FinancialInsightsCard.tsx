import React from 'react';
import { FinancialInsight } from '../types';
import { Lightbulb, CheckCircle2, AlertTriangle, Info, Sparkles } from 'lucide-react';

interface FinancialInsightsCardProps {
  insights: FinancialInsight[];
}

export const FinancialInsightsCard: React.FC<FinancialInsightsCardProps> = ({ insights }) => {
  if (!insights || insights.length === 0) {
    return null;
  }

  const getInsightIcon = (type: FinancialInsight['type']) => {
    switch (type) {
      case 'positive':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'negative':
        return <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
      case 'neutral':
      default:
        return <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />;
    }
  };

  const getInsightBadgeStyle = (type: FinancialInsight['type']) => {
    switch (type) {
      case 'positive':
        return 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/50';
      case 'negative':
        return 'bg-red-50 dark:bg-red-950/40 border-red-100 dark:border-red-900/50';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/50';
      case 'neutral':
      default:
        return 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/80 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" /> Financial Insights
        </h3>
        <span className="text-[10px] font-semibold text-gray-400">Automated Summary</span>
      </div>

      <div className="space-y-2">
        {insights.map((item, idx) => (
          <div
            key={`insight_${item.id}_${idx}`}
            className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all ${getInsightBadgeStyle(
              item.type
            )}`}
          >
            {getInsightIcon(item.type)}
            <div className="space-y-0.5 text-xs">
              <p className="font-bold text-gray-900 dark:text-gray-100">{item.title}</p>
              <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
