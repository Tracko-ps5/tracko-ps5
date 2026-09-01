import React from 'react';
import { PriceEvaluationStatus } from '../types';
import { CheckCircle2, TrendingDown, MinusCircle, AlertCircle, Flame } from 'lucide-react';

interface StatusBadgeProps {
  status: PriceEvaluationStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  if (status === 'excellent_price') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 ${
          size === 'sm'
            ? 'px-2.5 py-0.5 text-[10px]'
            : size === 'lg'
            ? 'px-4 py-1.5 text-xs'
            : 'px-3 py-1 text-[11px]'
        }`}
      >
        <Flame className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>EXCELLENT PRIX</span>
      </span>
    );
  }

  if (status === 'good_price') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/25 ${
          size === 'sm'
            ? 'px-2.5 py-0.5 text-[10px]'
            : size === 'lg'
            ? 'px-4 py-1.5 text-xs'
            : 'px-3 py-1 text-[11px]'
        }`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>BON PRIX</span>
      </span>
    );
  }

  if (status === 'average_price') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full bg-amber-500/10 text-amber-800 border border-amber-500/30 ${
          size === 'sm'
            ? 'px-2.5 py-0.5 text-[10px]'
            : size === 'lg'
            ? 'px-4 py-1.5 text-xs'
            : 'px-3 py-1 text-[11px]'
        }`}
      >
        <MinusCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>PRIX CORRECT</span>
      </span>
    );
  }

  if (status === 'high_price') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full bg-orange-500/10 text-orange-800 border border-orange-500/30 ${
          size === 'sm'
            ? 'px-2.5 py-0.5 text-[10px]'
            : size === 'lg'
            ? 'px-4 py-1.5 text-xs'
            : 'px-3 py-1 text-[11px]'
        }`}
      >
        <AlertCircle className="w-3.5 h-3.5 text-orange-600 shrink-0" />
        <span>PRIX ÉLEVÉ</span>
      </span>
    );
  }

  // very_high_price
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full bg-rose-500/10 text-rose-800 border border-rose-500/30 ${
        size === 'sm'
          ? 'px-2.5 py-0.5 text-[10px]'
          : size === 'lg'
          ? 'px-4 py-1.5 text-xs'
          : 'px-3 py-1 text-[11px]'
      }`}
    >
      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
      <span>TRÈS CHER</span>
    </span>
  );
};
