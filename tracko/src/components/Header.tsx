import React from 'react';
import { APP_CONFIG } from '../data/config';
import { Gamepad2 } from 'lucide-react';

interface HeaderProps {
  onGoHome: () => void;
  isAtHome: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onGoHome, isAtHome }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100/90 w-full transition-all">
      <div className="w-full max-w-[min(100%,1320px)] mx-auto px-[clamp(1rem,3vw,2.5rem)] h-[clamp(3.25rem,4vw,3.75rem)] flex items-center justify-between">
        {/* Brand : TRACKO PS5 */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-[clamp(0.4rem,1vw,0.6rem)] text-left group cursor-pointer focus:outline-none select-none"
        >
          <div className="w-[clamp(1.75rem,2.2vw,2.125rem)] h-[clamp(1.75rem,2.2vw,2.125rem)] rounded-lg bg-slate-900 flex items-center justify-center text-white transition-transform group-hover:scale-105 shrink-0">
            <Gamepad2 className="w-[clamp(0.95rem,1.3vw,1.15rem)] h-[clamp(0.95rem,1.3vw,1.15rem)]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[clamp(1.05rem,1.8vw,1.35rem)] font-black tracking-tight text-slate-900">
              {APP_CONFIG.name}
            </span>
            <span className="text-[clamp(0.65rem,0.9vw,0.75rem)] font-black tracking-widest text-slate-900 uppercase">
              PS5
            </span>
          </div>
        </button>

        {/* Action & Statut */}
        <div className="flex items-center gap-[clamp(0.5rem,1.5vw,1rem)]">
          <div className="hidden min-[420px]:flex items-center gap-1.5 text-[clamp(0.7rem,0.9vw,0.75rem)] text-slate-500 font-medium bg-slate-100/70 px-2.5 py-1 rounded-full border border-slate-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="whitespace-nowrap">Prix en direct</span>
          </div>

          {!isAtHome && (
            <button
              onClick={onGoHome}
              className="text-[clamp(0.75rem,1vw,0.8125rem)] font-bold text-slate-900 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-[clamp(0.75rem,1.5vw,1rem)] py-[clamp(0.35rem,0.8vw,0.45rem)] rounded-lg transition-colors cursor-pointer shrink-0"
            >
              Accueil
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

