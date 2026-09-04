import React from 'react';
import { PS5Model, EditionDetails } from '../types';
import { StatusBadge } from './StatusBadge';
import { 
  ArrowLeft, 
  ExternalLink, 
  Check, 
  AlertTriangle, 
  XCircle, 
  Bell, 
  LineChart, 
  ShieldCheck
} from 'lucide-react';

interface MerchantOffersViewProps {
  model: PS5Model;
  edition: EditionDetails;
  onBack: () => void;
  onOpenHistory: (model: PS5Model, edition: EditionDetails) => void;
  onOpenAlert: (model: PS5Model, edition: EditionDetails) => void;
}

export const MerchantOffersView: React.FC<MerchantOffersViewProps> = ({
  model,
  edition,
  onBack,
  onOpenHistory,
  onOpenAlert,
}) => {
  return (
    <section className="animate-in fade-in duration-300 space-y-6">
      {/* Top Back Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-blue-600" />
          <span>← Revenir aux modèles PS5</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Diagnostic du prix :</span>
          <StatusBadge status={edition.status} size="sm" />
        </div>
      </div>

      {/* Model & Selected Edition Summary Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Console Image */}
        <div className="md:col-span-4 flex items-center justify-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
          <img
            src={model.image}
            alt={model.name}
            referrerPolicy="no-referrer"
            className="w-full max-w-[190px] h-[210px] object-contain drop-shadow-md"
          />
        </div>

        {/* Details & Best Price */}
        <div className="md:col-span-8 space-y-4">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              {model.shortName} • {edition.label}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Offres marchands disponibles
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
              {model.description}
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 font-bold block uppercase">Meilleur Prix</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5">
                {edition.currentLowestPrice.toFixed(2)} €
              </div>
              <span className="text-xs text-blue-600 font-medium">chez {edition.currentLowestMerchant}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 font-bold block uppercase">Prix Officiel Sony</span>
              <div className="text-xl sm:text-2xl font-black text-slate-400 font-mono mt-0.5">
                {edition.msrp.toFixed(2)} €
              </div>
              <span className="text-xs text-slate-500 font-medium">Prix de référence</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-500 font-bold block uppercase mb-1">Diagnostic Prix</span>
              <StatusBadge status={edition.status} size="sm" />
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onOpenAlert(model, edition)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Bell className="w-4 h-4 text-white" />
              Créer une alerte prix
            </button>

            <button
              onClick={() => onOpenHistory(model, edition)}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold flex items-center gap-2 border border-slate-200 transition-all cursor-pointer"
            >
              <LineChart className="w-4 h-4 text-blue-600" />
              Historique des prix
            </button>
          </div>
        </div>
      </div>

      {/* Retailers List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-mono">
            Tableau comparatif des {edition.offers.length} marchands
          </h3>
          <span className="text-xs text-slate-500">
            Garantie légale 2 ans chez tous les marchands officiels
          </span>
        </div>

        {edition.offers.map((offer) => (
          <div
            key={offer.id}
            className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
              offer.isBestPrice
                ? 'bg-blue-50/40 border-blue-300 shadow-sm'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            {/* Merchant info */}
            <div className="flex items-center gap-3.5">
              <span className="text-2xl shrink-0 p-2.5 rounded-xl bg-slate-100 border border-slate-200">
                {offer.merchantLogo}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900">
                    {offer.merchantName}
                  </span>
                  {offer.isBestPrice && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-blue-600 text-white">
                      Meilleur Prix
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {offer.stockStatus === 'in_stock' && (
                    <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> En stock
                    </span>
                  )}
                  {offer.stockStatus === 'low_stock' && (
                    <span className="text-xs font-medium text-amber-700 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Stock limité
                    </span>
                  )}
                  {offer.stockStatus === 'out_of_stock' && (
                    <span className="text-xs font-medium text-rose-700 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Rupture de stock
                    </span>
                  )}
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-500">{offer.deliveryInfo}</span>
                </div>
              </div>
            </div>

            {/* Price and CTA */}
            <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <div className="text-left sm:text-right">
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {offer.price.toFixed(2)} €
                </div>
                {offer.price < edition.msrp && (
                  <div className="text-xs text-emerald-600 font-semibold">
                    -{(edition.msrp - offer.price).toFixed(0)}€ sous prix Sony
                  </div>
                )}
              </div>

              <a
                href={offer.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                  offer.inStock
                    ? offer.isBestPrice
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:scale-95'
                      : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>{offer.inStock ? 'Voir l\'offre' : 'Indisponible'}</span>
                {offer.inStock && <ExternalLink className="w-3.5 h-3.5" />}
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
