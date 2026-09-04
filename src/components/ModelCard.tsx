import React from 'react';
import { PS5Model, ProductCondition } from '../types';
import { StatusBadge } from './StatusBadge';
import { ArrowRight } from 'lucide-react';

interface ModelCardProps {
  model: PS5Model;
  onSelect: (model: PS5Model) => void;
  conditionFilter?: 'all' | ProductCondition;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  model,
  onSelect,
  conditionFilter = 'all',
}) => {
  // Calculer le prix de départ selon le filtre sélectionné
  const getStartingPrice = () => {
    const prices: number[] = [];

    const checkEdition = (ed: typeof model.digitalEdition) => {
      if (!ed) return;
      if (conditionFilter === 'all') {
        if (ed.currentLowestPrice > 0) prices.push(ed.currentLowestPrice);
      } else {
        const filteredOffers = ed.offers.filter(o => o.condition === conditionFilter && o.inStock);
        if (filteredOffers.length > 0) {
          const min = Math.min(...filteredOffers.map(o => o.price));
          prices.push(min);
        }
      }
    };

    checkEdition(model.digitalEdition);
    checkEdition(model.discEdition);

    return prices.length > 0 ? Math.min(...prices) : model.startingPrice;
  };

  const startingPrice = getStartingPrice();
  const representativeStatus = model.digitalEdition?.status || model.discEdition?.status || 'good_price';

  return (
    <div
      onClick={() => onSelect(model)}
      className="group w-full h-full flex flex-col justify-between bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl sm:rounded-3xl p-5 sm:p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer select-none"
    >
      {/* 1. Nom du modèle */}
      <div>
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
          {model.name}
        </h3>
      </div>

      {/* 2. Image PS5 harmonisée : même cadrage, proportion, taille visuelle et socle */}
      <div className="relative w-full h-[220px] sm:h-[240px] flex items-center justify-center my-4 bg-slate-50/60 rounded-2xl border border-slate-100/80 overflow-hidden group-hover:bg-slate-50 transition-colors">
        {/* Socle d'ombre discret pour un ancrage showroom unifié */}
        <div className="absolute bottom-2.5 w-3/4 h-3 bg-slate-900/[0.04] rounded-full blur-md pointer-events-none" />

        <img
          src={model.image}
          alt={model.name}
          className={`w-auto max-w-[85%] object-contain drop-shadow-sm transition-transform duration-500 group-hover:scale-105 pointer-events-none ${
            model.id === 'ps5-pro' ? 'max-h-[82%]' : 'max-h-[100%]'
          }`}
          loading="lazy"
        />
      </div>

      {/* 3. Bloc Prix, Statut & Action : hiérarchie épurée sans séparateurs superflus */}
      <div className="space-y-3 pt-1">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            À partir de
          </span>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
              {startingPrice > 0 ? `${startingPrice.toFixed(0)} €` : 'Indisponible'}
            </span>
            <div className="shrink-0">
              <StatusBadge status={representativeStatus} size="sm" />
            </div>
          </div>
        </div>

        {/* Bouton d'action direct avec touch target optimal */}
        <button
          type="button"
          className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98] group-hover:bg-slate-800 mt-2"
        >
          <span>Comparer</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};
