import React from 'react';
import { PS5Model, EditionDetails } from '../types';
import { X, TrendingDown, ArrowDownRight, Award } from 'lucide-react';

interface PriceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: PS5Model | null;
  edition: EditionDetails | null;
}

export const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({
  isOpen,
  onClose,
  model,
  edition,
}) => {
  if (!isOpen || !model || !edition) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <TrendingDown className="w-4 h-4" />
            <span>Historique & Évolution du Prix</span>
          </div>
          <h3 className="text-xl font-black text-slate-900">
            {model.shortName}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {edition.label}
          </p>
        </div>

        {/* 2 Key Stats Boxes */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 uppercase">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>Plus bas historique</span>
            </div>
            <div className="text-2xl font-black text-emerald-950 font-mono mt-1">
              {edition.lowestEverPrice.toFixed(2)} €
            </div>
            <span className="text-[11px] text-emerald-700 font-medium">
              Enregistré {edition.lowestEverDate}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase">
              Prix Actuel
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">
              {edition.currentLowestPrice.toFixed(2)} €
            </div>
            <span className="text-[11px] text-blue-600 font-medium">
              chez {edition.currentLowestMerchant}
            </span>
          </div>
        </div>

        {/* Price History Progression Table */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            Historique des relevés récents
          </span>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
            {edition.priceHistory.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-700">{item.date}</span>
                  <span className="text-[11px] text-slate-400">({item.merchant})</span>
                </div>
                <div className="flex items-center gap-2 font-mono font-bold text-slate-900">
                  <span>{item.price.toFixed(2)} €</span>
                  {item.price <= edition.lowestEverPrice && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      Record
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};
