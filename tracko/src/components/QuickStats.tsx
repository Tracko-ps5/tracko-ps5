import React from 'react';
import { TrendingDown, ShieldAlert, Sparkles, CheckCircle2, Zap } from 'lucide-react';

export const QuickStats: React.FC = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 my-6">
      {/* Stat 1: Meilleur prix PS5 détecté */}
      <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Meilleur Prix PS5
          </span>
          <span className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Zap className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="text-xl sm:text-2xl font-black text-white font-mono flex items-baseline gap-1.5">
          479<span className="text-sm text-cyan-400 font-bold">,99 €</span>
        </div>
        <div className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
          <TrendingDown className="w-3 h-3" />
          -70€ sous le prix officiel Sony
        </div>
      </div>

      {/* Stat 2: Meilleur prix PS5 Pro */}
      <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Meilleur Prix PS5 Pro
          </span>
          <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="text-xl sm:text-2xl font-black text-white font-mono flex items-baseline gap-1.5">
          759<span className="text-sm text-indigo-400 font-bold">,99 €</span>
        </div>
        <div className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
          <TrendingDown className="w-3 h-3" />
          -40€ d'économie immédiate
        </div>
      </div>

      {/* Stat 3: Disponibilité & Stocks */}
      <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            État des Stocks
          </span>
          <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono flex items-baseline gap-1.5">
          92<span className="text-sm text-slate-400 font-bold">%</span>
        </div>
        <div className="text-[10px] text-slate-300 font-medium mt-1">
          En stock chez 5 marchands sur 6
        </div>
      </div>

      {/* Stat 4: Timing d'achat */}
      <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 relative overflow-hidden group hover:border-purple-500/40 transition-colors">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Indice d'Achat
          </span>
          <span className="p-1 rounded-lg bg-purple-500/10 text-purple-400">
            <TrendingDown className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="text-xl sm:text-2xl font-black text-white font-mono flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Favorable
        </div>
        <div className="text-[10px] text-slate-300 font-medium mt-1">
          Prix proche du record historique
        </div>
      </div>
    </div>
  );
};
