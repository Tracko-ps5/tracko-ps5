import React, { useState, useEffect } from 'react';
import { APP_CONFIG } from '../data/config';
import { Sparkles } from 'lucide-react';

export const GtaViBanner: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(APP_CONFIG.gtaViReleaseDate).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, target - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full relative overflow-hidden rounded-2xl md:rounded-3xl shadow-lg border border-slate-200/80 bg-slate-950 group">
      {/* Background Image - Clean and unobstructed */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] md:aspect-[21/8] max-h-[360px] overflow-hidden">
        <img
          src="/images/gta-vi-banner.jpg"
          alt="GTA VI"
          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.01]"
          loading="lazy"
        />

        {/* Re-adapted Compact Countdown (Sleek on mobile, elegant on desktop) */}
        <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-10">
          <div className="bg-slate-950/80 backdrop-blur-md border border-white/20 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-xl text-white">
            <div className="flex items-center gap-1 sm:gap-1.5 mb-1 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-pink-400">
              <Sparkles className="w-2.5 h-2.5 animate-pulse" />
              <span>COMPTE À REBOURS</span>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 font-mono text-center">
              {/* Jours */}
              <div className="bg-white/10 rounded-md px-1.5 py-0.5 min-w-[28px] sm:min-w-[34px]">
                <span className="text-xs sm:text-sm font-black text-white leading-none block">
                  {timeLeft.days}
                </span>
                <span className="text-[8px] text-slate-300 uppercase leading-none block mt-0.5">
                  j
                </span>
              </div>

              <span className="text-white/40 text-xs font-bold">:</span>

              {/* Heures */}
              <div className="bg-white/10 rounded-md px-1.5 py-0.5 min-w-[28px] sm:min-w-[34px]">
                <span className="text-xs sm:text-sm font-black text-white leading-none block">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[8px] text-slate-300 uppercase leading-none block mt-0.5">
                  h
                </span>
              </div>

              <span className="text-white/40 text-xs font-bold">:</span>

              {/* Minutes */}
              <div className="bg-white/10 rounded-md px-1.5 py-0.5 min-w-[28px] sm:min-w-[34px]">
                <span className="text-xs sm:text-sm font-black text-white leading-none block">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[8px] text-slate-300 uppercase leading-none block mt-0.5">
                  m
                </span>
              </div>

              <span className="text-white/40 text-xs font-bold">:</span>

              {/* Secondes */}
              <div className="bg-pink-500/20 border border-pink-500/40 rounded-md px-1.5 py-0.5 min-w-[28px] sm:min-w-[34px]">
                <span className="text-xs sm:text-sm font-black text-pink-400 leading-none block">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[8px] text-pink-300 uppercase leading-none block mt-0.5">
                  s
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
