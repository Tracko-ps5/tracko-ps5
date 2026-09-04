import React, { useState } from 'react';
import { FAQ_ITEMS } from '../data/ps5Data';
import { ChevronDown, HelpCircle, BookOpen, Lightbulb, Flame, Award } from 'lucide-react';

export const BuyingGuide: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="guide-achat" className="space-y-8">
      {/* FAQ Accordion Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl md:rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 text-slate-900 text-xs font-bold uppercase tracking-wider mb-2">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <span>Foire Aux Questions (FAQ)</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-6">
          Questions Fréquentes sur l'Achat d'une PS5
        </h2>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-slate-500 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-200/50 bg-white">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
