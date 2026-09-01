import React from 'react';
import { APP_CONFIG } from '../data/config';
import { Gamepad2, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onGoHome: () => void;
  isAtHome: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onGoHome, isAtHome }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-2.5 text-left group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:bg-slate-800 transition-colors">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black tracking-tight text-slate-900 leading-none">
              {APP_CONFIG.name}
            </div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              TRACKER PS5
            </div>
          </div>
        </button>

        {/* Live Indicator & Transparency */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[11px] font-medium text-slate-600 border border-slate-200/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Prix vérifiés en continu</span>
          </div>

          {!isAtHome && (
            <button
              onClick={onGoHome}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Accueil
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
