import React from 'react';
import { PS5Model, EditionDetails } from '../types';
import { StatusBadge } from './StatusBadge';
import { Disc, HardDrive, ArrowRight, ArrowLeft } from 'lucide-react';

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
    <div className="space-y-[clamp(1.25rem,2.5vw,2rem)] max-w-[min(100%,820px)] mx-auto w-full">
      {/* Barre retour discrète */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer active:scale-95 min-h-[36px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Changer de modèle</span>
        </button>

        <span className="text-xs text-slate-400 font-medium">
          Étape 2 sur 3
        </span>
      </div>

      {/* Titre & Modèle sélectionné */}
      <div className="text-center space-y-1.5 py-1">
        <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-black text-slate-900 tracking-tight leading-snug">
          {model.name}
        </h2>
        <p className="text-[clamp(0.8125rem,1.2vw,0.9375rem)] text-slate-500">
          Choisissez l'édition qui correspond à votre usage
        </p>
      </div>

      {/* Cartes des éditions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[clamp(1rem,2vw,1.5rem)]">
        {/* Édition Digitale */}
        {model.digitalEdition && (
          <div
            onClick={() => onSelectEdition(model.digitalEdition!)}
            className="group bg-white border border-slate-200/80 hover:border-slate-300 rounded-[clamp(1rem,2vw,1.5rem)] p-[clamp(1.25rem,2.2vw,1.65rem)] transition-all duration-200 hover:shadow-lg cursor-pointer flex flex-col justify-between select-none"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-[clamp(0.95rem,1.3vw,1.05rem)] text-slate-900">
                    DIGITAL
                  </span>
                </div>
                <StatusBadge status={model.digitalEdition.status} size="sm" />
              </div>

              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                Jeux dématérialisés sur PlayStation Store. Format fin et léger.
              </p>

              {/* Prix */}
              <div className="bg-slate-50/80 rounded-2xl p-[clamp(0.85rem,1.5vw,1.15rem)] mb-4 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Meilleur prix dès
                </span>
                <div className="text-[clamp(1.5rem,2.5vw,2rem)] font-black text-slate-900 mt-0.5 leading-none">
                  {model.digitalEdition.currentLowestPrice > 0 
                    ? `${model.digitalEdition.currentLowestPrice.toFixed(2)} €` 
                    : 'Indisponible'}
                </div>
                <div className="text-xs text-slate-500 mt-1.5">
                  Chez <strong>{model.digitalEdition.currentLowestMerchant}</strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[clamp(0.75rem,1vw,0.8125rem)] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <span>Voir les prix ({model.digitalEdition.offers.length} offres)</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        )}

        {/* Édition avec Lecteur */}
        {model.discEdition && (
          <div
            onClick={() => onSelectEdition(model.discEdition!)}
            className="group bg-white border border-slate-200/80 hover:border-slate-300 rounded-[clamp(1rem,2vw,1.5rem)] p-[clamp(1.25rem,2.2vw,1.65rem)] transition-all duration-200 hover:shadow-lg cursor-pointer flex flex-col justify-between select-none"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <Disc className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-[clamp(0.95rem,1.3vw,1.05rem)] text-slate-900">
                    AVEC LECTEUR
                  </span>
                </div>
                <StatusBadge status={model.discEdition.status} size="sm" />
              </div>

              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                Lecteur Blu-ray 4K. Compatible disques physiques PS4, PS5 et films.
              </p>

              {/* Prix */}
              <div className="bg-slate-50/80 rounded-2xl p-[clamp(0.85rem,1.5vw,1.15rem)] mb-4 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Meilleur prix dès
                </span>
                <div className="text-[clamp(1.5rem,2.5vw,2rem)] font-black text-slate-900 mt-0.5 leading-none">
                  {model.discEdition.currentLowestPrice > 0 
                    ? `${model.discEdition.currentLowestPrice.toFixed(2)} €` 
                    : 'Indisponible'}
                </div>
                <div className="text-xs text-slate-500 mt-1.5">
                  Chez <strong>{model.discEdition.currentLowestMerchant}</strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[clamp(0.75rem,1vw,0.8125rem)] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <span>Voir les prix ({model.discEdition.offers.length} offres)</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
