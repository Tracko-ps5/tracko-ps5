import React, { useState } from 'react';
import { FaqItem, MAIN_FAQS } from '../data/seoContent';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqSectionProps {
  items?: FaqItem[];
  title?: string;
  subtitle?: string;
}

export const FaqSection: React.FC<FaqSectionProps> = ({
  items = MAIN_FAQS,
  title = "Foire Aux Questions (FAQ) - Prix & Achat PS5",
  subtitle = "Toutes les réponses essentielles pour acheter votre PlayStation 5 au meilleur prix."
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="my-16 max-w-4xl mx-auto px-4 sm:px-6" aria-labelledby="faq-title">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider mb-3">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
          <span>Guide & Questions Fréquentes</span>
        </div>
        <h2 id="faq-title" className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {title}
        </h2>
        <p className="text-slate-500 text-sm sm:text-base mt-2 max-w-2xl mx-auto">
          {subtitle}
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-2xs transition-all"
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-slate-900 hover:text-slate-800 text-base sm:text-lg cursor-pointer"
                aria-expanded={isOpen}
              >
                <span>{item.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-slate-900' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-100 bg-slate-50/50">
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
