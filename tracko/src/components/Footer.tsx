import React from 'react';
import { APP_CONFIG } from '../data/config';
import { Info, Gamepad2 } from 'lucide-react';

interface FooterProps {
  onNavigate?: (path: string) => void;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenAdmin }) => {
  const handleNav = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  return (
    <footer className="mt-[clamp(2.5rem,5vw,4.5rem)] bg-white border-t border-slate-200/80 text-slate-500 text-xs py-[clamp(2rem,3.5vw,3rem)] w-full">
      <div className="w-full max-w-[min(100%,1320px)] mx-auto px-[clamp(1rem,3vw,2.5rem)] space-y-[clamp(1.5rem,2.5vw,2.25rem)]">
        
        {/* Colonnes SEO & Liens */}
        <div className="grid grid-cols-1 min-[440px]:grid-cols-2 lg:grid-cols-4 gap-[clamp(1.25rem,2vw,2rem)] pb-6 border-b border-slate-100">
          
          {/* Colonne 1 : À propos */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Gamepad2 className="w-4 h-4" />
              <span>TRACKO</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Comparateur et tracker de prix indépendant pour la PlayStation 5 en France.
            </p>
          </div>

          {/* Colonne 2 : Modèles PS5 */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Modèles PS5
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button
                  onClick={() => handleNav('/ps5-slim-digital')}
                  className="hover:text-slate-900 transition-colors text-left cursor-pointer"
                >
                  PS5 Slim Digitale
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/ps5-slim-disc')}
                  className="hover:text-slate-900 transition-colors text-left cursor-pointer"
                >
                  PS5 Slim avec Lecteur
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/ps5-pro')}
                  className="hover:text-slate-900 transition-colors text-left cursor-pointer"
                >
                  PlayStation 5 Pro
                </button>
              </li>
            </ul>
          </div>

          {/* Colonne 3 : Guides d'Achat */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Guides d'Achat
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button
                  onClick={() => handleNav('/comparatif-ps5-digital-vs-lecteur')}
                  className="hover:text-slate-900 transition-colors text-left cursor-pointer"
                >
                  Digitale vs Lecteur
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/ps5-neuf-vs-reconditionne')}
                  className="hover:text-slate-900 transition-colors text-left cursor-pointer"
                >
                  Neuf vs Reconditionné
                </button>
              </li>
            </ul>
          </div>

          {/* Colonne 4 : Marchands */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Marchands Suivis
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Fnac, Amazon France, Cdiscount, Boulanger, E.Leclerc, Micromania, PlayStation Direct.
            </p>
          </div>
        </div>

        {/* Note de Transparence */}
        <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60 flex items-start gap-2.5 text-slate-600 text-xs">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-slate-500">
            TRACKO est un service indépendant. Les prix et disponibilités sont relevés auprès des marchands français et peuvent varier selon les stocks.
          </p>
        </div>

        {/* Copyright & Accès Admin */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <div>
            © {new Date().getFullYear()} TRACKO — Tous droits réservés.
          </div>
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="text-[11px] text-slate-400 hover:text-slate-700 underline transition-colors cursor-pointer"
            >
              Administration
            </button>
          )}
        </div>
      </div>
    </footer>
  );
};
