import React from 'react';
import { PS5Model, EditionDetails } from '../types';
import { Bot, CheckCircle2, ShieldCheck, Calendar, Info } from 'lucide-react';

interface AiStructuredSummaryProps {
  model: PS5Model;
  edition: EditionDetails;
}

export const AiStructuredSummary: React.FC<AiStructuredSummaryProps> = ({
  model,
  edition
}) => {
  const bestOffer = edition.offers.length > 0
    ? edition.offers.reduce((best, cur) => (cur.price < best.price ? cur : best))
    : null;

  const inStockOffers = edition.offers.filter(o => o.inStock);
  const lowestInStockPrice = inStockOffers.length > 0
    ? Math.min(...inStockOffers.map(o => o.price))
    : null;

  const editionLabel = edition.type === 'digital' ? 'Édition Digitale (sans lecteur)' : 'Édition Standard (avec lecteur Blu-ray 4K)';
  const statusLabel = edition.priceStatus === 'good' ? 'BON PRIX' : edition.priceStatus === 'average' ? 'PRIX MOYEN' : 'PRIX ÉLEVÉ';
  const statusColor = edition.priceStatus === 'good' ? 'text-emerald-700 bg-emerald-50' : edition.priceStatus === 'average' ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50';

  return (
    <section 
      aria-label="Fiche récapitulative et données structurées"
      className="mt-8 p-5 sm:p-6 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-700 text-xs sm:text-sm"
    >
      <div className="flex items-center gap-2 mb-3 text-slate-900 font-bold">
        <Bot className="w-4 h-4 text-slate-600" />
        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
          Fiche Synthétique du Produit & Relevé de Prix
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60">
        <div>
          <span className="text-slate-400 block text-[11px]">Produit référencé</span>
          <strong className="text-slate-900 font-semibold">{model.name} — {editionLabel}</strong>
        </div>

        <div>
          <span className="text-slate-400 block text-[11px]">Prix le plus bas constaté</span>
          <span className="text-slate-900 font-bold text-base">{lowestInStockPrice ? `${lowestInStockPrice} €` : `${edition.currentLowestPrice} €`}</span>
          {bestOffer && <span className="text-slate-500 text-[11px] block">chez {bestOffer.merchantName}</span>}
        </div>

        <div>
          <span className="text-slate-400 block text-[11px]">Prix moyen marché / Prix Sony</span>
          <span className="text-slate-900 font-semibold">{edition.averagePrice} € (Conseillé: {edition.msrp} €)</span>
        </div>

        <div>
          <span className="text-slate-400 block text-[11px]">Évaluation du prix</span>
          <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-[11px] mt-0.5 ${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block text-[11px]">Capacité de stockage</span>
          <span className="text-slate-900 font-semibold">{edition.storage}</span>
        </div>

        <div>
          <span className="text-slate-400 block text-[11px]">Dernière actualisation</span>
          <span className="text-slate-600 font-medium">{edition.lastUpdated}</span>
        </div>
      </div>

      <p className="mt-4 pt-3 border-t border-slate-200/60 text-slate-500 text-[11px] leading-relaxed flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>Données synchronisées automatiquement par TRACKO auprès des marchands officiels et revendeurs certifiés en France.</span>
      </p>
    </section>
  );
};
