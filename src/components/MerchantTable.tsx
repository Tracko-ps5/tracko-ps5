import React, { useState } from 'react';
import { MerchantOffer, ProductCondition } from '../types';
import { MerchantLogo } from './MerchantLogo';
import { 
  ExternalLink, 
  Sparkles, 
  RefreshCw, 
  BellRing
} from 'lucide-react';

interface MerchantTableProps {
  offers: MerchantOffer[];
  productName: string;
  onOpenAlertModal?: () => void;
}

export const MerchantTable: React.FC<MerchantTableProps> = ({ 
  offers, 
  onOpenAlertModal 
}) => {
  const [selectedCondition, setSelectedCondition] = useState<'all' | ProductCondition>('all');

  const filteredOffers = offers.filter((offer) => {
    if (selectedCondition === 'all') return true;
    return offer.condition === selectedCondition;
  });

  const sortedOffers = [...filteredOffers].sort((a, b) => {
    if (a.inStock && !b.inStock) return -1;
    if (!a.inStock && b.inStock) return 1;
    return a.price - b.price;
  });

  const inStockOffers = sortedOffers.filter((o) => o.inStock);
  const bestInStockId = inStockOffers.length > 0 ? inStockOffers[0].id : null;

  return (
    <div className="bg-white border border-slate-200/80 rounded-[clamp(1rem,2vw,1.5rem)] overflow-hidden shadow-2xs w-full">
      {/* En-tête avec filtres */}
      <div className="p-[clamp(1rem,2vw,1.25rem)] border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[clamp(1rem,1.5vw,1.15rem)] font-black text-slate-900 tracking-tight">
            Offres des marchands
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Prix constatés en temps réel
          </p>
        </div>

        {/* Filtres d'état rapides avec scroll horizontal doux sur petits mobiles si nécessaire */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto max-w-full overflow-x-auto">
          <button
            onClick={() => setSelectedCondition('all')}
            className={`px-[clamp(0.6rem,1vw,0.75rem)] py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCondition === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tous ({offers.length})
          </button>

          <button
            onClick={() => setSelectedCondition('new')}
            className={`px-[clamp(0.6rem,1vw,0.75rem)] py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
              selectedCondition === 'new'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span>Neuf</span>
          </button>

          <button
            onClick={() => setSelectedCondition('refurbished')}
            className={`px-[clamp(0.6rem,1vw,0.75rem)] py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
              selectedCondition === 'refurbished'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-3 h-3 text-emerald-600" />
            <span>Reconditionné</span>
          </button>
        </div>
      </div>

      {/* Lignes d'offres */}
      <div className="divide-y divide-slate-100">
        {sortedOffers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Aucune offre disponible pour ce filtre.
          </div>
        ) : (
          sortedOffers.map((offer) => {
            const isBest = offer.id === bestInStockId;
            const isOutOfStock = !offer.inStock || offer.stockStatus === 'out_of_stock';

            return (
              <div
                key={offer.id}
                className={`p-[clamp(0.85rem,1.8vw,1.25rem)] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isOutOfStock
                    ? 'bg-slate-50/50 opacity-60'
                    : isBest 
                      ? 'bg-emerald-50/20' 
                      : 'hover:bg-slate-50/60'
                }`}
              >
                {/* Marchand & État */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <MerchantLogo
                      merchantName={offer.merchantName}
                      size="md"
                    />
                    {isBest && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-600 text-white whitespace-nowrap">
                        Meilleur prix
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{offer.condition === 'refurbished' ? 'Reconditionné' : 'Neuf'}</span>
                    <span>•</span>
                    <span className={!isOutOfStock ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                      {!isOutOfStock ? 'En stock' : 'Rupture temporaire'}
                    </span>
                  </div>
                </div>

                {/* Prix & Bouton */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span className={`text-[clamp(1.15rem,2.2vw,1.35rem)] font-black tracking-tight ${isOutOfStock ? 'text-slate-400' : 'text-slate-900'}`}>
                      {offer.price.toFixed(2)} €
                    </span>
                  </div>

                  <div>
                    {isOutOfStock ? (
                      <button
                        onClick={onOpenAlertModal}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all cursor-pointer active:scale-95 min-h-[38px]"
                      >
                        <BellRing className="w-3.5 h-3.5" />
                        <span>Alerte stock</span>
                      </button>
                    ) : (
                      <a
                        href={offer.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95 min-h-[38px] ${
                          isBest
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        <span>Voir l'offre</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
