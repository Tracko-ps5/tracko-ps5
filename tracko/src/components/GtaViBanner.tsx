import React, { useState, useEffect } from 'react';
import { APP_CONFIG } from '../data/config';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isReleased: boolean;
}

export const GtaViBanner: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isReleased: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const targetTime = new Date(APP_CONFIG.gtaViReleaseDate).getTime();
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isReleased: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isReleased: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full relative overflow-hidden rounded-[clamp(1rem,2vw,1.5rem)] border border-slate-200/80 bg-slate-950 shadow-md group max-w-full">
      {/* Conteneur d'image équilibré et généreux : hauteur fluide pour admirer le visuel sans écrasement */}
      <div className="relative w-full h-[clamp(210px,28vw,350px)] overflow-hidden">
        <img
          src="/images/gta-vi-banner.jpg"
          alt="Grand Theft Auto VI sur PS5"
          className="w-full h-full object-cover object-[center_30%] transition-transform duration-700 group-hover:scale-[1.01] pointer-events-none"
          loading="lazy"
        />

        {/* Dégradé cinématographique léger pour la profondeur sans masquer l'illustration */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/25 pointer-events-none" />

        {/* Panneau du compte à rebours : compact, sombre, translucide, avec relief et fort contraste */}
        <div className="absolute top-[clamp(0.6rem,1.8vw,1.1rem)] right-[clamp(0.6rem,1.8vw,1.1rem)] z-10 max-w-[calc(100%-1.2rem)]">
          <div className="bg-slate-950/85 backdrop-blur-md border border-white/20 rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-3.5 sm:py-2 shadow-xl shadow-black/50 text-white flex flex-col gap-0.5 sm:gap-1">
            {/* Ligne 1 : Titre & badge GTA VI · PS5 */}
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-0.5 sm:pb-1">
              <span className="font-black text-[10px] sm:text-xs tracking-wider text-pink-300 uppercase whitespace-nowrap">
                GTA VI · PS5
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse shrink-0" />
            </div>

            {/* Ligne 2 : Temps restant ou mention disponible */}
            {timeLeft.isReleased ? (
              <div className="text-xs sm:text-sm font-bold text-pink-300 tracking-wide select-none whitespace-nowrap py-0.5">
                Disponible aujourd'hui
              </div>
            ) : (
              <div className="flex items-baseline font-mono font-bold text-white text-[11px] sm:text-sm tracking-tight leading-none whitespace-nowrap select-none">
                <span>{timeLeft.days}</span>
                <span className="font-sans text-[9px] sm:text-[11px] font-medium text-slate-300 ml-0.5 mr-1 sm:mr-1.5">
                  j
                </span>

                <span>{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="font-sans text-[9px] sm:text-[11px] font-medium text-slate-300 ml-0.5 mr-1 sm:mr-1.5">
                  h
                </span>

                <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="font-sans text-[9px] sm:text-[11px] font-medium text-slate-300 ml-0.5 mr-1 sm:mr-1.5">
                  min
                </span>

                <span className="text-pink-300 font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="font-sans text-[9px] sm:text-[11px] font-medium text-pink-300 ml-0.5">
                  s
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
