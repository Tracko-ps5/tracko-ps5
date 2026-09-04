import React from 'react';
import { PS5Model, EditionDetails } from '../types';
import { StatusBadge } from './StatusBadge';
import { HardDrive, Disc, ArrowRight, Bell, LineChart } from 'lucide-react';

interface ProductCardProps {
  model: PS5Model;
  onSelectEdition: (model: PS5Model, edition: EditionDetails) => void;
  onOpenHistory: (model: PS5Model, edition: EditionDetails) => void;
  onOpenAlert: (model: PS5Model, edition: EditionDetails) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  model,
  onSelectEdition,
  onOpenHistory,
  onOpenAlert,
}) => {
  return (
    <div
      id={`modele-${model.id}`}
      className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col"
    >
      {/* Header : Nom du modèle & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {model.name}
          </h3>
          {model.badge && (
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              {model.badge}
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 font-medium">
          {model.specs.storageDefault}
        </div>
      </div>

      {/* Grid: Image à gauche, Choix Digital / Lecteur à droite */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Console Image (Strict aspect ratio, no deformation) */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 border border-slate-100 group">
          <div className="w-full max-w-[210px] h-[230px] sm:h-[260px] flex items-center justify-center">
            <img
              src={model.image}
              alt={model.name}
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full w-auto h-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <p className="text-xs text-slate-600 text-center mt-3 font-medium">
            {model.tagline}
          </p>
        </div>

        {/* Both Editions: DIGITAL & AVEC LECTEUR */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. VERSION DIGITAL */}
          {model.digitalEdition ? (
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
                    <HardDrive className="w-4 h-4 text-blue-600" />
                    {model.digitalEdition.label}
                  </span>
                  <StatusBadge status={model.digitalEdition.status} size="sm" />
                </div>

                <div className="my-2">
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                    {model.digitalEdition.currentLowestPrice.toFixed(2)} €
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    chez <strong className="text-slate-800">{model.digitalEdition.currentLowestMerchant}</strong> (Prix Sony : {model.digitalEdition.msrp.toFixed(2)}€)
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {model.digitalEdition.statusReason}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-200/80">
                <button
                  onClick={() => onSelectEdition(model, model.digitalEdition!)}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
                >
                  <span>Voir les offres marchands</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onOpenHistory(model, model.digitalEdition!)}
                    className="py-2 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <LineChart className="w-3.5 h-3.5 text-blue-600" />
                    Historique
                  </button>
                  <button
                    onClick={() => onOpenAlert(model, model.digitalEdition!)}
                    className="py-2 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5 text-blue-600" />
                    Alerte prix
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* 2. VERSION AVEC LECTEUR */}
          {model.discEdition ? (
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
                    <Disc className="w-4 h-4 text-indigo-600" />
                    {model.discEdition.label}
                  </span>
                  <StatusBadge status={model.discEdition.status} size="sm" />
                </div>

                <div className="my-2">
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                    {model.discEdition.currentLowestPrice.toFixed(2)} €
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    chez <strong className="text-slate-800">{model.discEdition.currentLowestMerchant}</strong> (Prix Sony : {model.discEdition.msrp.toFixed(2)}€)
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {model.discEdition.statusReason}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-200/80">
                <button
                  onClick={() => onSelectEdition(model, model.discEdition!)}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
                >
                  <span>Voir les offres marchands</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onOpenHistory(model, model.discEdition!)}
                    className="py-2 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <LineChart className="w-3.5 h-3.5 text-indigo-600" />
                    Historique
                  </button>
                  <button
                    onClick={() => onOpenAlert(model, model.discEdition!)}
                    className="py-2 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5 text-indigo-600" />
                    Alerte prix
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
