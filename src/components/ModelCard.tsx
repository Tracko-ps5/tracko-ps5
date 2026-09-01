import React from 'react';
import { PS5Model, ProductCondition } from '../types';
import { StatusBadge } from './StatusBadge';
import { ArrowRight, Sparkles, RefreshCw } from 'lucide-react';

interface ModelCardProps {
  model: PS5Model;
  onSelect: (model: PS5Model) => void;
  isSelected?: boolean;
  conditionFilter?: 'all' | ProductCondition;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  model,
  onSelect,
  isSelected = false,
  conditionFilter = 'all',
}) => {
  // Helper to compute lowest price according to condition
  const getEditionLowestPrice = (edition?: typeof model.digitalEdition) => {
    if (!edition) return null;
    if (conditionFilter === 'all') {
      return edition.currentLowestPrice;
    }
    const filtered = edition.offers.filter((o) => o.condition === conditionFilter);
    if (filtered.length > 0) {
      return Math.min(...filtered.map((o) => o.price));
    }
    return edition.currentLowestPrice;
  };

  const digitalPrice = getEditionLowestPrice(model.digitalEdition);
  const discPrice = getEditionLowestPrice(model.discEdition);

  return (
    <div
      onClick={() => onSelect(model)}
      className={`group relative bg-white border rounded-2xl md:rounded-3xl p-5 sm:p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 ${
        isSelected
          ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-lg'
          : 'border-slate-200/80 hover:border-slate-300 shadow-sm'
      }`}
    >
      {/* Badge Top */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {model.badge ? (
          <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
            {model.badge}
          </span>
        ) : (
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Sony PlayStation
          </span>
        )}

        <StatusBadge status={model.status} size="sm" />
      </div>

      {/* Product Visual */}
      <div className="relative w-full aspect-[4/3] flex items-center justify-center p-2 rounded-2xl mb-4 overflow-hidden">
        <img
          src={model.image}
          alt={model.name}
          className="max-h-full max-w-full object-contain filter drop-shadow-sm mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Product Title & Tagline */}
      <div className="mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
          {model.name}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-2">
          {model.tagline}
        </p>
      </div>

      {/* Direct Editions Overview (Règle N°4) */}
      <div className="bg-slate-50/90 rounded-xl p-3 mb-5 space-y-2 border border-slate-100">
        {/* Digital */}
        {model.digitalEdition && digitalPrice !== null && (
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <span>Digital</span>
              {conditionFilter === 'new' && (
                <span className="text-[9px] font-bold text-blue-600">(Neuf)</span>
              )}
              {conditionFilter === 'refurbished' && (
                <span className="text-[9px] font-bold text-emerald-600">(Recond.)</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900">
                {digitalPrice.toFixed(2)} €
              </span>
              <StatusBadge status={model.digitalEdition.status} size="sm" />
            </div>
          </div>
        )}

        {/* Avec Lecteur */}
        {model.discEdition && discPrice !== null && (
          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/50">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <span>Avec Lecteur</span>
              {conditionFilter === 'new' && (
                <span className="text-[9px] font-bold text-blue-600">(Neuf)</span>
              )}
              {conditionFilter === 'refurbished' && (
                <span className="text-[9px] font-bold text-emerald-600">(Recond.)</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900">
                {discPrice.toFixed(2)} €
              </span>
              <StatusBadge status={model.discEdition.status} size="sm" />
            </div>
          </div>
        )}
      </div>

      {/* Button Action */}
      <button
        type="button"
        className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all group-hover:shadow-md cursor-pointer"
      >
        <span>Comparer les prix</span>
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
};
