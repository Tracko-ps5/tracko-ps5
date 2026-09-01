import React from 'react';
import { APP_CONFIG } from '../data/config';
import { ShieldCheck, Info, Gamepad2, BookOpen, Layers } from 'lucide-react';

interface FooterProps {
  onNavigate?: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleNav = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  return (
    <footer className="mt-16 bg-white border-t border-slate-200/80 text-slate-500 text-xs py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        
        {/* Maillage Interne SEO (Règles N°7 & N°10) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 pb-8 border-b border-slate-100">
          
          {/* Colonne 1 : À propos */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Gamepad2 className="w-4 h-4" />
              <span>TRACKO</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Le comparateur et tracker de prix indépendant spécialisé sur la PlayStation 5 en France.
            </p>
          </div>

          {/* Colonne 2 : Modèles & Comparatifs */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Modèles PS5
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button
                  onClick={() => handleNav('/ps5-slim-digital')}
                  className="hover:text-slate-900 transition-colors text-left cursor-pointer"
                >
                  PS5 Slim Édition Digitale
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
                  PlayStation 5 Pro 2 To
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/ps5')}
                  className="hover:text-slate-900 transition-colors text-left cursor-pointer"
                >
                  PS5 Modèle Standard (2020)
                </button>
              </li>
            </ul>
          </div>

          {/* Colonne 3 : Guides d'Achat SEO */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Guides d'Achat
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button
                  onClick={() => handleNav('/comparatif-ps5-digital-vs-lecteur')}
                  className="hover:text-slate-900 transition-colors text-left cursor-pointer"
                >
                  PS5 Digitale vs Lecteur
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

          {/* Colonne 4 : Marchands Suivis */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Marchands Référencés
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Fnac, Amazon France, Cdiscount, Boulanger, E.Leclerc, Micromania, PlayStation Direct.
            </p>
          </div>
        </div>

        {/* Transparency Disclaimer (Règle N°6) */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-start gap-3 text-slate-600">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
              Note d'information & Transparence
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              {APP_CONFIG.mockDataDisclaimer} TRACKO est un comparateur indépendant. PlayStation® et le logo PS5 sont des marques déposées de Sony Interactive Entertainment Inc.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 text-slate-400 text-[11px]">
          <div>
            © {new Date().getFullYear()} {APP_CONFIG.name} — Comparateur et tracker de prix PlayStation 5.
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-600 cursor-pointer">Mentions légales</span>
            <span>·</span>
            <span className="hover:text-slate-600 cursor-pointer">Confidentialité</span>
            <span>·</span>
            <span className="hover:text-slate-600 cursor-pointer">Contact</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
