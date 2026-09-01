import React, { useState } from 'react';
import { PS5Model, EditionDetails, PriceAlert } from '../types';
import { StatusBadge } from './StatusBadge';
import { MerchantTable } from './MerchantTable';
import { PriceChart } from './PriceChart';
import { PriceAlertModal } from './PriceAlertModal';
import { Bell, ArrowLeft, Shield, HardDrive, Disc, CheckCircle, Info, Share2, Sparkles } from 'lucide-react';

interface ComparisonViewProps {
  model: PS5Model;
  edition: EditionDetails;
  onBackToModels: () => void;
  onBackToEditions: () => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  model,
  edition,
  onBackToModels,
  onBackToEditions,
}) => {
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [copied, setCopied] = useState(false);

  const handleAlertCreated = (newAlert: PriceAlert) => {
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToEditions}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Changer de version ({edition.label})</span>
          </button>
          <button
            onClick={onBackToModels}
            className="text-xs text-slate-500 hover:text-slate-800 hover:underline px-2 py-1"
          >
            Tous les modèles
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            title="Partager cette comparaison"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? 'Lien copié !' : 'Partager'}</span>
          </button>

          <button
            onClick={() => setIsAlertModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 px-3.5 py-1.5 rounded-xl hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Créer une alerte</span>
          </button>
        </div>
      </div>

      {/* Main Product Hero Summary Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl md:rounded-3xl p-5 sm:p-7 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Image */}
          <div className="lg:col-span-4 flex items-center justify-center p-2">
            <img
              src={model.image}
              alt={`${model.name} ${edition.label}`}
              className="max-h-48 sm:max-h-56 object-contain filter drop-shadow-sm mix-blend-multiply"
            />
          </div>

          {/* Core Info */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                {model.shortName}
              </span>
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {edition.label}
              </span>
              <StatusBadge status={edition.status} />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {model.name} — {edition.label}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {model.description}
              </p>
            </div>

            {/* Quick Specs Badges */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <div className="inline-flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                <span>{edition.storage}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                {edition.type === 'disc' ? (
                  <Disc className="w-3.5 h-3.5 text-purple-600" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>
                  {edition.type === 'disc' ? 'Lecteur Blu-ray 4K Ultra HD' : 'Format 100% Digital'}
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Garantie 2 ans constructeur</span>
              </div>
            </div>

            {/* Pricing Highlights Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Meilleur prix constaté
                </div>
                <div className="flex items-baseline gap-3 mt-0.5">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    {edition.currentLowestPrice.toFixed(2)} €
                  </span>
                  {edition.msrp > edition.currentLowestPrice && (
                    <span className="text-sm sm:text-base text-slate-400 line-through">
                      {edition.msrp.toFixed(2)} €
                    </span>
                  )}
                </div>
                <div className="text-xs text-emerald-600 font-semibold mt-0.5">
                  Disponible chez {edition.currentLowestMerchant}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAlertModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white text-slate-800 text-xs font-bold transition-all flex items-center gap-2 shadow-2xs hover:bg-slate-50 cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span>Alerte baisse de prix</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Retailers Comparison Table (Q3-B: Equal comparative table with green badge on cheapest) */}
      <section aria-labelledby="retailers-heading">
        <h2 id="retailers-heading" className="sr-only">
          Comparateur de marchands pour {model.name}
        </h2>
        <MerchantTable
          offers={edition.offers}
          productName={`${model.name} ${edition.label}`}
          onOpenAlertModal={() => setIsAlertModalOpen(true)}
        />
      </section>

      {/* Price Evolution Chart (Q4-B: Compact interactive chart with pastilles) */}
      <section aria-labelledby="price-chart-heading">
        <h2 id="price-chart-heading" className="sr-only">
          Historique et évolution du prix
        </h2>
        <PriceChart edition={edition} />
      </section>

      {/* RÈGLE N°8 : FICHE TECHNIQUE & RÉSUMÉ CLAIR POUR IA ET MOTEURS DE RECHERCHE */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Fiche récapitulative & Données Structurées
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-xs text-slate-700">
          <div>
            <span className="text-slate-400 block text-[11px]">Produit :</span>
            <span className="font-semibold text-slate-900">
              {model.name} ({edition.label})
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Prix actuel :</span>
            <span className="font-semibold text-emerald-700">
              {edition.currentLowestPrice.toFixed(2)} €
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Prix moyen constaté :</span>
            <span className="font-semibold text-slate-900">
              {edition.averagePrice.toFixed(2)} €
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Prix minimum historique :</span>
            <span className="font-semibold text-slate-900">
              {edition.lowestEverPrice.toFixed(2)} € ({edition.lowestEverDate})
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Évaluation du prix :</span>
            <span className="font-semibold text-slate-900">{edition.statusLabel}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Marchand le moins cher :</span>
            <span className="font-semibold text-slate-900">
              {edition.currentLowestMerchant}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Disponibilité :</span>
            <span className="font-semibold text-emerald-600">En stock immédiat</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Capacité de stockage :</span>
            <span className="font-semibold text-slate-900">{edition.storage}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Dernière mise à jour :</span>
            <span className="font-semibold text-slate-900">En direct (temps réel)</span>
          </div>
        </div>
      </div>

      {/* Price Alert Modal */}
      <PriceAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        model={model}
        edition={edition}
        onAlertCreated={handleAlertCreated}
      />
    </div>
  );
};
