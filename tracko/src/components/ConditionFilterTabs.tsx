import React from 'react';
import { Sparkles, RefreshCw, Layers } from 'lucide-react';
import { ProductCondition } from '../types';

interface ConditionFilterTabsProps {
  selectedCondition: 'all' | ProductCondition;
  onConditionChange: (condition: 'all' | ProductCondition) => void;
  newCount: number;
  refurbCount: number;
  minNewPrice?: number;
  minRefurbPrice?: number;
}

export const ConditionFilterTabs: React.FC<ConditionFilterTabsProps> = ({
  selectedCondition,
  onConditionChange,
  newCount,
  refurbCount,
  minNewPrice,
  minRefurbPrice,
}) => {
  return (
    <div className="bg-slate-100/90 p-1.5 rounded-2xl flex flex-col sm:flex-row items-stretch gap-1.5 border border-slate-200/80 shadow-2xs">
      {/* TOUT VOIR */}
      <button
        onClick={() => onConditionChange('all')}
        className={`flex-1 flex items-center justify-center sm:justify-start gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          selectedCondition === 'all'
            ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
        }`}
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
          selectedCondition === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-200/70 text-slate-600'
        }`}>
          <Layers className="w-3.5 h-3.5" />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span>Toutes les offres</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-extrabold">
              {newCount + refurbCount}
            </span>
          </div>
          <div className="text-[10px] font-normal text-slate-500 hidden sm:block">
            Neuf & Reconditionné
          </div>
        </div>
      </button>

      {/* NEUF */}
      <button
        onClick={() => onConditionChange('new')}
        className={`flex-1 flex items-center justify-center sm:justify-start gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          selectedCondition === 'new'
            ? 'bg-white text-blue-950 shadow-sm border border-blue-200/80 ring-1 ring-blue-500/20'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
        }`}
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
          selectedCondition === 'new' ? 'bg-blue-600 text-white' : 'bg-blue-100/70 text-blue-700'
        }`}>
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span>NEUF</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-extrabold">
              {newCount}
            </span>
          </div>
          <div className="text-[10px] font-normal text-slate-500">
            {minNewPrice ? `Dès ${minNewPrice.toFixed(2)} €` : 'Boutiques officielles'}
          </div>
        </div>
      </button>

      {/* RECONDITIONNÉ */}
      <button
        onClick={() => onConditionChange('refurbished')}
        className={`flex-1 flex items-center justify-center sm:justify-start gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          selectedCondition === 'refurbished'
            ? 'bg-white text-emerald-950 shadow-sm border border-emerald-200/80 ring-1 ring-emerald-500/20'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
        }`}
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
          selectedCondition === 'refurbished' ? 'bg-emerald-600 text-white' : 'bg-emerald-100/70 text-emerald-700'
        }`}>
          <RefreshCw className="w-3.5 h-3.5" />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span>RECONDITIONNÉ</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
              {refurbCount}
            </span>
          </div>
          <div className="text-[10px] font-normal text-slate-500">
            {minRefurbPrice ? `Dès ${minRefurbPrice.toFixed(2)} € (Économique)` : 'Back Market, Cdiscount...'}
          </div>
        </div>
      </button>
    </div>
  );
};
