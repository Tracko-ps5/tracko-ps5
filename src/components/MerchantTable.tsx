import React, { useState } from 'react';
import { MerchantOffer, ProductCondition } from '../types';
import { MerchantLogo } from './MerchantLogo';
import { triggerPilotSync } from '../services/api';
import { 
  ExternalLink, 
  Star, 
  Check, 
  AlertCircle, 
  ShoppingCart, 
  Sparkles, 
  RefreshCw, 
  XCircle,
  BellRing,
  Radio
} from 'lucide-react';

interface MerchantTableProps {
  offers: MerchantOffer[];
  productName: string;
  onOpenAlertModal?: () => void;
}

export const MerchantTable: React.FC<MerchantTableProps> = ({ 
  offers, 
  productName,
  onOpenAlertModal 
}) => {
  const [selectedCondition, setSelectedCondition] = useState<'all' | ProductCondition>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedTime, setLastRefreshedTime] = useState('À l\'instant');

  // Trigger live refresh via backend connector
  const handleLiveRefresh = async () => {
    setIsRefreshing(true);
    try {
      await triggerPilotSync();
      const now = new Date();
      setLastRefreshedTime(`Mis à jour à ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
      setTimeout(() => {
        window.location.reload();
      }, 400);
    } catch {
      const now = new Date();
      setLastRefreshedTime(`Vérifié à ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter offers based on condition tab
  const filteredOffers = offers.filter((offer) => {
    if (selectedCondition === 'all') return true;
    return offer.condition === selectedCondition;
  });

  // Sort offers: in-stock first, then price ascending, out-of-stock last
  const sortedOffers = [...filteredOffers].sort((a, b) => {
    if (a.inStock && !b.inStock) return -1;
    if (!a.inStock && b.inStock) return 1;
    return a.price - b.price;
  });

  const newOffers = offers.filter((o) => o.condition === 'new');
  const refurbOffers = offers.filter((o) => o.condition === 'refurbished');

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
      {/* Table Header / Title & Live Status */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Disponibilités et prix en temps réel
              </h3>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold">
                <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                <span>En direct</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {sortedOffers.filter(o => o.inStock).length} marchands avec stock immédiat · {lastRefreshedTime}
            </p>
          </div>
        </div>

        {/* CONDITION FILTER TOGGLES & LIVE REFRESH BUTTON */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLiveRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer active:scale-95"
            title="Actualiser les stocks et prix"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl">
            <button
              onClick={() => setSelectedCondition('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCondition === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Toutes ({offers.length})</span>
            </button>

            <button
              onClick={() => setSelectedCondition('new')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCondition === 'new'
                  ? 'bg-white text-blue-700 shadow-2xs ring-1 ring-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>Neuf ({newOffers.length})</span>
            </button>

            <button
              onClick={() => setSelectedCondition('refurbished')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCondition === 'refurbished'
                  ? 'bg-white text-emerald-700 shadow-2xs ring-1 ring-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <RefreshCw className="w-3 h-3 text-emerald-600" />
              <span>Reconditionné ({refurbOffers.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Offers List */}
      <div className="divide-y divide-slate-100">
        {sortedOffers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Aucune offre trouvée dans cette catégorie.
          </div>
        ) : (
          sortedOffers.map((offer, index) => {
            const isBest = index === 0 && offer.inStock;
            const isOutOfStock = !offer.inStock || offer.stockStatus === 'out_of_stock';

            return (
              <div
                key={offer.id}
                className={`p-4 sm:p-5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isOutOfStock
                    ? 'bg-slate-50/60 opacity-85 hover:opacity-100'
                    : isBest 
                      ? 'bg-emerald-50/40 hover:bg-emerald-50/70' 
                      : 'hover:bg-slate-50/80'
                }`}
              >
                {/* Left: Real Merchant Logo, Brand, Condition badge & Rating */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-[240px]">
                  {/* Real Logo Component */}
                  <MerchantLogo
                    merchantName={offer.merchantName}
                    size="md"
                    className="shrink-0"
                  />

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">
                        {offer.merchantName}
                      </span>

                      {/* État Neuf vs Reconditionné */}
                      {offer.condition === 'refurbished' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>Reconditionné</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Neuf</span>
                        </span>
                      )}

                      {isBest && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                          <Check className="w-3 h-3" />
                          Meilleur Prix
                        </span>
                      )}

                      {isOutOfStock && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Rupture
                        </span>
                      )}
                    </div>

                    {/* Condition details label */}
                    {offer.conditionLabel && (
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {offer.conditionLabel}
                      </div>
                    )}

                    {/* Rating & Reviews */}
                    {offer.rating && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <div className="flex items-center text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-500" />
                          <span className="ml-1 font-semibold text-slate-700">
                            {offer.rating}
                          </span>
                        </div>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-400 text-[11px]">
                          ({offer.reviewsCount?.toLocaleString()} avis vérifiés)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle: Stock status & Delivery terms */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 shrink-0">
                    {offer.stockStatus === 'in_stock' ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200/60">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        En stock immédiat
                      </span>
                    ) : offer.stockStatus === 'low_stock' ? (
                      <span className="inline-flex items-center gap-1.5 text-amber-700 font-bold text-xs bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        Stock très limité
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-rose-700 font-bold text-xs bg-rose-50 px-2 py-1 rounded-md border border-rose-200">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        Rupture de stock
                      </span>
                    )}
                  </div>

                  <div className="text-slate-500 text-xs line-clamp-2 max-w-[280px]">
                    {offer.deliveryInfo}
                  </div>
                </div>

                {/* Right: Price & Direct Link to Merchant */}
                <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right shrink-0">
                    <div className={`text-xl sm:text-2xl font-black leading-tight ${isOutOfStock ? 'text-slate-400' : 'text-slate-900'}`}>
                      {offer.price.toFixed(2)} €
                    </div>
                    {offer.originalPrice > offer.price && (
                      <div className="text-xs text-slate-400 line-through">
                        {offer.originalPrice.toFixed(2)} €
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isOutOfStock ? (
                      <div className="flex items-center gap-2">
                        {onOpenAlertModal && (
                          <button
                            onClick={onOpenAlertModal}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-xs cursor-pointer active:scale-95"
                            title="Être averti dès le retour en stock"
                          >
                            <BellRing className="w-3.5 h-3.5" />
                            <span>Alerte réassort</span>
                          </button>
                        )}
                        <a
                          href={offer.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl font-bold text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all cursor-pointer"
                          title="Vérifier sur le site du marchand"
                        >
                          <span>Voir</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ) : (
                      <a
                        href={offer.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs shrink-0 cursor-pointer ${
                          isBest
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-[0.98]'
                            : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-[0.98]'
                        }`}
                      >
                        <span>Voir sur {offer.merchantName.split(' ')[0]}</span>
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

      {/* Footer Info */}
      <div className="p-3 bg-slate-50/90 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          Redirection directe vers les fiches et rayons officiels des marchands français
        </span>
        <span className="text-slate-400">Prix TTC vérifiés · Disponibilités actualisées en direct</span>
      </div>
    </div>
  );
};
