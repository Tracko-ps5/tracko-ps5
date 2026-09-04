import React from 'react';
import { PriceEvaluationStatus } from '../types';

interface StatusBadgeProps {
  status: PriceEvaluationStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'md',
  className = '' 
}) => {
  if (status === 'excellent_price' || status === 'good_price') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold text-emerald-700 bg-emerald-50/80 border border-emerald-200/60 rounded-full select-none ${
          size === 'sm'
            ? 'px-2 py-0.5 text-[10px]'
            : size === 'lg'
            ? 'px-3 py-1 text-xs'
            : 'px-2.5 py-0.5 text-[11px]'
        } ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        <span>Bon prix</span>
      </span>
    );
  }

  if (status === 'average_price') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold text-amber-800 bg-amber-50/80 border border-amber-200/60 rounded-full select-none ${
          size === 'sm'
            ? 'px-2 py-0.5 text-[10px]'
            : size === 'lg'
            ? 'px-3 py-1 text-xs'
            : 'px-2.5 py-0.5 text-[11px]'
        } ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
        <span>Prix moyen</span>
      </span>
    );
  }

  // bad_price / default
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold text-rose-700 bg-rose-50/80 border border-rose-200/60 rounded-full select-none ${
        size === 'sm'
          ? 'px-2 py-0.5 text-[10px]'
          : size === 'lg'
          ? 'px-3 py-1 text-xs'
          : 'px-2.5 py-0.5 text-[11px]'
      } ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
      <span>Mauvais prix</span>
    </span>
  );
};
