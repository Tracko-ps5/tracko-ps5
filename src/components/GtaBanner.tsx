import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const GtaBanner: React.FC = () => {
  // Target: Grand Theft Auto VI Release
  const targetDate = new Date('2026-10-31T00:00:00');

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-slate-200 bg-slate-900 group">
      {/* Background Image: Original user visual preserved completely */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-[360px] overflow-hidden">
        <img
          src="/images/gta-vi-banner.jpg"
          alt="Bandeau GTA VI PlayStation 5"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-[1.01] transition-transform duration-500"
        />

        {/* Live Countdown in TOP-RIGHT corner */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20">
          <div className="bg-slate-950/85 backdrop-blur-md border border-white/20 text-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-2xl">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-amber-300 uppercase tracking-wider mb-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Sortie GTA VI</span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 text-center font-mono">
              <div className="bg-white/10 rounded-lg px-2 py-1 min-w-[34px] sm:min-w-[42px]">
                <span className="text-xs sm:text-base font-black block text-white">
                  {timeLeft.days}
                </span>
                <span className="text-[8px] sm:text-[9px] text-slate-300 font-sans uppercase">Jours</span>
              </div>

              <span className="text-xs sm:text-sm font-bold text-white/60">:</span>

              <div className="bg-white/10 rounded-lg px-1.5 py-1 min-w-[28px] sm:min-w-[34px]">
                <span className="text-xs sm:text-base font-black block text-white">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[8px] sm:text-[9px] text-slate-300 font-sans uppercase">H</span>
              </div>

              <span className="text-xs sm:text-sm font-bold text-white/60">:</span>

              <div className="bg-white/10 rounded-lg px-1.5 py-1 min-w-[28px] sm:min-w-[34px]">
                <span className="text-xs sm:text-base font-black block text-white">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[8px] sm:text-[9px] text-slate-300 font-sans uppercase">Min</span>
              </div>

              <span className="text-xs sm:text-sm font-bold text-white/60">:</span>

              <div className="bg-white/10 rounded-lg px-1.5 py-1 min-w-[28px] sm:min-w-[34px]">
                <span className="text-xs sm:text-base font-black block text-amber-400">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[8px] sm:text-[9px] text-slate-300 font-sans uppercase">Sec</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
