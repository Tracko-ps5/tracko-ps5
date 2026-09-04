import React, { useState } from 'react';
import { PS5Model, EditionDetails, PriceAlert } from '../types';
import { StatusBadge } from './StatusBadge';
import { MerchantTable } from './MerchantTable';
import { PriceChart } from './PriceChart';
import { PriceAlertModal } from './PriceAlertModal';
import { ActiveAlertsDrawer } from './ActiveAlertsDrawer';
import { deletePriceAlert } from '../services/api';
import { 
  Bell, 
  ArrowLeft, 
  Share2, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  ExternalLink
} from 'lucide-react';

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
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState(false);
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem('tracko_user_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [copied, setCopied] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const handleAlertCreated = (newAlert: PriceAlert) => {
    setAlerts((prev) => {
      // Déduplication locale par ID ou couple (modelId + editionType)
      const filtered = prev.filter(
        (a) => a.id !== newAlert.id && !(a.modelId === newAlert.modelId && a.editionType === newAlert.editionType)
      );
      const updated = [newAlert, ...filtered];
      try {
        localStorage.setItem('tracko_user_alerts', JSON.stringify(updated));
      } catch (err) {
        console.error('Erreur sauvegarde locale alerte:', err);
      }
      return updated;
    });
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await deletePriceAlert(id);
    } catch (err) {
      console.error('Erreur suppression alerte:', err);
    }
    setAlerts((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      try {
        localStorage.setItem('tracko_user_alerts', JSON.stringify(updated));
      } catch (err) {
        console.error('Erreur sauvegarde locale suppression:', err);
      }
      return updated;
    });
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Trouver l'offre la plus avantageuse pour le bouton principal
  const bestOffer = edition.offers.find(
    (o) => o.inStock && (o.price === edition.currentLowestPrice || o.merchantName === edition.currentLowestMerchant)
  ) || edition.offers.find((o) => o.inStock) || edition.offers[0];

  const savings = edition.msrp > edition.currentLowestPrice 
    ? edition.msrp - edition.currentLowestPrice 
    : 0;

  return (
    <div className="space-y-[clamp(1.25rem,2.5vw,2rem)] animate-in fade-in duration-300 max-w-[min(100%,880px)] mx-auto w-full">
      {/* Barre de navigation retour & actions */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <button
          onClick={onBackToEditions}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer active:scale-95 min-h-[36px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Changer d'édition</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer min-h-[36px]"
            title="Partager le comparateur"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? 'Copié' : 'Partager'}</span>
          </button>

          {alerts.length > 0 && (
            <button
              onClick={() => setIsAlertDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer active:scale-95 min-h-[36px]"
              title="Gérer mes alertes enregistrées"
            >
              <Bell className="w-3.5 h-3.5 text-blue-600" />
              <span>Mes alertes ({alerts.length})</span>
            </button>
          )}

          <button
            onClick={() => setIsAlertModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-300/80 hover:border-slate-400 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-all shadow-2xs cursor-pointer active:scale-95 min-h-[36px]"
          >
            <Bell className="w-3.5 h-3.5 text-amber-500" />
            <span>Alerte prix</span>
          </button>
        </div>
      </div>

      {/* 
        HIÉRARCHIE VISUELLE STRICTE (POINT FOCAL DE LA PAGE) :
        1. Modèle (ex. PS5 Slim Digital)
        2. MEILLEUR PRIX EN GRAND (ex. 399,99 €)
        3. Statut Bon prix & Marchand (ex. Amazon)
        4. Bouton d'action direct [Voir l'offre chez ...]
      */}
      <div className="bg-white border border-slate-200/80 rounded-[clamp(1rem,2vw,1.5rem)] p-[clamp(1.25rem,3vw,2.25rem)] shadow-xs text-center space-y-[clamp(1rem,2vw,1.5rem)]">
        
        {/* Visuel console aéré et compact */}
        <div className="w-[clamp(5rem,12vw,6.5rem)] h-[clamp(5rem,12vw,6.5rem)] mx-auto flex items-center justify-center p-2 rounded-2xl bg-slate-50/80 border border-slate-100">
          <img
            src={model.image}
            alt={`${model.name} ${edition.label}`}
            className="max-h-[clamp(3.5rem,9vw,5rem)] max-w-full object-contain filter drop-shadow-xs mix-blend-multiply pointer-events-none"
          />
        </div>

        {/* Titre du modèle */}
        <div>
          <div className="inline-flex items-center gap-2 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {model.name}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600">
              {edition.label}
            </span>
          </div>

          <h1 className="text-[clamp(1.35rem,4vw,2.25rem)] font-black text-slate-900 tracking-tight leading-snug">
            {model.name} {edition.label}
          </h1>
        </div>

        {/* Bloc Meilleur Prix (Focal Point) */}
        <div className="bg-slate-50/80 border border-slate-100/90 rounded-2xl p-[clamp(1rem,2.5vw,1.5rem)] max-w-md mx-auto space-y-2.5">
          <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
            Meilleur prix constaté
          </span>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <span className="text-[clamp(2rem,6vw,3.25rem)] font-black text-slate-900 tracking-tight leading-none">
              {edition.currentLowestPrice > 0 
                ? `${edition.currentLowestPrice.toFixed(2)} €` 
                : 'Indisponible'}
            </span>
            <div className="shrink-0">
              <StatusBadge status={edition.status} size="md" />
            </div>
          </div>

          <div className="text-xs sm:text-sm text-slate-600">
            Disponible chez <strong className="text-slate-900 font-bold">{edition.currentLowestMerchant}</strong>
            {savings > 0 && (
              <span className="block text-emerald-700 font-medium text-xs mt-0.5">
                Économie de {savings.toFixed(2)} € par rapport au prix de référence
              </span>
            )}
          </div>

          {bestOffer && (
            <div className="pt-2">
              <a
                href={bestOffer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[46px] py-[clamp(0.7rem,1.5vw,0.9rem)] px-[clamp(1rem,2vw,1.5rem)] rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[clamp(0.8125rem,1.1vw,0.875rem)] font-bold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md cursor-pointer active:scale-95"
              >
                <span>Voir l'offre chez {edition.currentLowestMerchant}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Tableau des autres offres marchands */}
      <section aria-labelledby="merchants-heading">
        <h2 id="merchants-heading" className="sr-only">
          Toutes les offres marchands pour {model.name} {edition.label}
        </h2>
        <MerchantTable
          offers={edition.offers}
          productName={`${model.name} ${edition.label}`}
          onOpenAlertModal={() => setIsAlertModalOpen(true)}
        />
      </section>

      {/* Historique réel des prix (sans tracé fictif) */}
      <section aria-labelledby="history-heading">
        <h2 id="history-heading" className="sr-only">
          Historique des prix de la {model.name} {edition.label}
        </h2>
        <PriceChart edition={edition} />
      </section>

      {/* Informations techniques complémentaires (repliables) */}
      <div className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden shadow-2xs">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Caractéristiques techniques
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span>{showTechnicalDetails ? 'Masquer' : 'Afficher'}</span>
            {showTechnicalDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </div>
        </button>

        {showTechnicalDetails && (
          <div className="px-5 pb-5 pt-1 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 animate-in fade-in duration-200">
            <div>
              <span className="text-slate-400 block text-[11px]">Modèle :</span>
              <span className="font-semibold text-slate-900">{model.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Édition :</span>
              <span className="font-semibold text-slate-900">{edition.label}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Stockage interne :</span>
              <span className="font-semibold text-slate-900">{edition.storage}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Prix conseillé (MSRP) :</span>
              <span className="font-semibold text-slate-900">{edition.msrp.toFixed(2)} €</span>
            </div>
          </div>
        )}
      </div>

      {/* Modale d'alerte de prix */}
      <PriceAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        model={model}
        edition={edition}
        onAlertCreated={handleAlertCreated}
      />

      {/* Tiroir de gestion des alertes actives */}
      <ActiveAlertsDrawer
        isOpen={isAlertDrawerOpen}
        onClose={() => setIsAlertDrawerOpen(false)}
        alerts={alerts}
        onDeleteAlert={handleDeleteAlert}
      />
    </div>
  );
};
