import React from 'react';
import { PS5Model } from '../types';
import { StatusBadge } from './StatusBadge';
import { HardDrive, Disc } from 'lucide-react';

interface HomeModelRowProps {
  model: PS5Model;
}

export const HomeModelRow: React.FC<HomeModelRowProps> = ({ model }) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 select-none">
      {/* Left: Image (Cutout style without background box) & Title */}
      <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto">
        <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
          <img
            src={model.image}
            alt={model.name}
            className="max-h-full max-w-full object-contain filter drop-shadow-sm mix-blend-multiply"
            loading="lazy"
          />
        </div>

        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {model.name}
            </h3>
            {model.badge && (
              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 text-white">
                {model.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 line-clamp-1 sm:line-clamp-2">
            {model.tagline}
          </p>
        </div>
      </div>

      {/* Right: Digital vs Avec Lecteur Editions Overview */}
      <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 pt-3 sm:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
        {/* Digital */}
        {model.digitalEdition && (
          <div className="bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2 flex items-center justify-between sm:justify-start gap-3 min-w-[140px]">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-slate-400" />
                <span>DIGITAL</span>
              </div>
              <div className="text-sm font-extrabold text-slate-900">
                {model.digitalEdition.currentLowestPrice.toFixed(2)} €
              </div>
            </div>
            <StatusBadge status={model.digitalEdition.status} size="sm" />
          </div>
        )}

        {/* Avec Lecteur */}
        {model.discEdition && (
          <div className="bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2 flex items-center justify-between sm:justify-start gap-3 min-w-[140px]">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Disc className="w-3 h-3 text-purple-500" />
                <span>AVEC LECTEUR</span>
              </div>
              <div className="text-sm font-extrabold text-slate-900">
                {model.discEdition.currentLowestPrice.toFixed(2)} €
              </div>
            </div>
            <StatusBadge status={model.discEdition.status} size="sm" />
          </div>
        )}
      </div>
    </div>
  );
};
