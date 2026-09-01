import React from 'react';
import { PS5Model, EditionDetails } from '../types';
import { StatusBadge } from './StatusBadge';
import { Disc, HardDrive, ArrowRight, Check, Zap, Sparkles } from 'lucide-react';

interface EditionChoiceProps {
  model: PS5Model;
  onSelectEdition: (edition: EditionDetails) => void;
  onBack: () => void;
}

export const EditionChoice: React.FC<EditionChoiceProps> = ({
  model,
  onSelectEdition,
  onBack,
}) => {
  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
        >
          ← Changer de modèle
        </button>

        <div className="text-xs text-slate-500">
          Étape 2 sur 3 : <span className="font-semibold text-slate-800">Choix de l'édition</span>
        </div>
      </div>

      {/* Model Selected Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-xs">
        <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0">
          <img
            src={model.image}
            alt={model.name}
            className="max-h-full max-w-full object-contain filter drop-shadow-xs mix-blend-multiply"
          />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Modèle sélectionné
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
            {model.name}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{model.tagline}</p>
        </div>
      </div>

      {/* Title */}
      <div className="text-center max-w-lg mx-auto py-2">
        <h3 className="text-xl sm:text-2xl font-black text-slate-900">
          Choisissez votre version
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Sélectionnez entre l'édition 100% Dématérialisée ou l'édition avec Lecteur de disques Blu-ray 4K
        </p>
      </div>

      {/* Edition Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Digital Edition */}
        {model.digitalEdition && (
          <div
            onClick={() => onSelectEdition(model.digitalEdition!)}
            className="group bg-white border border-slate-200/90 hover:border-slate-400 rounded-2xl sm:rounded-3xl p-5 sm:p-6 transition-all duration-300 hover:shadow-xl cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 text-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-base sm:text-lg text-slate-900">
                    DIGITAL
                  </span>
                </div>
                <StatusBadge status={model.digitalEdition.status} />
              </div>

              <p className="text-xs text-slate-500 mb-4">
                Jeux téléchargés directement sur le PlayStation™Store. Format plus fin et léger.
              </p>

              {/* Price Block */}
              <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                <div className="text-xs text-slate-500 font-medium">
                  Meilleur prix actuel
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
                  {model.digitalEdition.currentLowestPrice.toFixed(2)} €
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>Chez {model.digitalEdition.currentLowestMerchant}</span>
                  <span className="line-through text-slate-400">
                    MSRP: {model.digitalEdition.msrp.toFixed(2)} €
                  </span>
                </div>
              </div>

              {/* Features bullets */}
              <ul className="space-y-2 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{model.digitalEdition.storage}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Prix d'achat plus accessible</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Accès instantané aux promos du PS Store</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all group-hover:shadow-md cursor-pointer"
            >
              <span>Voir les {model.digitalEdition.offers.length} offres</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}

        {/* Disc Edition */}
        {model.discEdition && (
          <div
            onClick={() => onSelectEdition(model.discEdition!)}
            className="group bg-white border border-slate-200/90 hover:border-slate-400 rounded-2xl sm:rounded-3xl p-5 sm:p-6 transition-all duration-300 hover:shadow-xl cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 text-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Disc className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-base sm:text-lg text-slate-900">
                    AVEC LECTEUR
                  </span>
                </div>
                <StatusBadge status={model.discEdition.status} />
              </div>

              <p className="text-xs text-slate-500 mb-4">
                Lecteur Blu-ray 4K Ultra HD. Compatible avec vos jeux PS4 / PS5 physiques et films.
              </p>

              {/* Price Block */}
              <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                <div className="text-xs text-slate-500 font-medium">
                  Meilleur prix actuel
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
                  {model.discEdition.currentLowestPrice.toFixed(2)} €
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>Chez {model.discEdition.currentLowestMerchant}</span>
                  <span className="line-through text-slate-400">
                    MSRP: {model.discEdition.msrp.toFixed(2)} €
                  </span>
                </div>
              </div>

              {/* Features bullets */}
              <ul className="space-y-2 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Lecteur de disques Blu-ray 4K intégré</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Achat de jeux d'occasion et revente possible</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Lecteur de films Blu-ray & DVD de salon</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all group-hover:shadow-md cursor-pointer"
            >
              <span>Voir les {model.discEdition.offers.length} offres</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
