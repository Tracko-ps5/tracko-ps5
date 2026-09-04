import React from 'react';
import { PS5Model } from '../types';
import { StatusBadge } from './StatusBadge';
import { ArrowRight } from 'lucide-react';

interface HomeModelRowProps {
  model: PS5Model;
  onSelect?: (model: PS5Model) => void;
}

export const HomeModelRow: React.FC<HomeModelRowProps> = ({ model, onSelect }) => {
  const lowestPrice = Math.min(
    model.digitalEdition?.currentLowestPrice || Infinity,
    model.discEdition?.currentLowestPrice || Infinity
  );

  const displayPrice = lowestPrice !== Infinity ? lowestPrice : 0;

  return (
    <div
      onClick={() => onSelect && onSelect(model)}
      className="group bg-white border border-slate-200/70 hover:border-slate-300/90 rounded-2xl p-4 sm:p-5 transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 select-none"
    >
      {/* Visuel et Titre */}
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center p-2 bg-slate-50/80 rounded-2xl border border-slate-100">
          <img
            src={model.image}
            alt={model.name}
            className="max-h-12 sm:max-h-16 max-w-full object-contain filter drop-shadow-xs mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>

        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
              {model.name}
            </h3>
            {model.badge && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900 text-white">
                {model.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {model.tagline}
          </p>
        </div>
      </div>

      {/* Prix et Action */}
      <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
        <div className="text-left sm:text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Meilleur prix dès
          </span>
          <div className="flex items-center sm:justify-end gap-2 mt-0.5">
            <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              {displayPrice > 0 ? `${displayPrice.toFixed(2)} €` : 'Indisponible'}
            </span>
            <StatusBadge status={model.status} size="sm" />
          </div>
        </div>

        <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-slate-900 text-slate-600 group-hover:text-white flex items-center justify-center transition-all shrink-0">
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </div>
  );
};
