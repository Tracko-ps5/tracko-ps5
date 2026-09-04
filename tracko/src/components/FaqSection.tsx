import React, { useState } from 'react';
import { FaqItem, MAIN_FAQS } from '../data/seoContent';
import { ChevronDown } from 'lucide-react';

interface FaqSectionProps {
  items?: FaqItem[];
  title?: string;
}

export const FaqSection: React.FC<FaqSectionProps> = ({
  items = MAIN_FAQS,
  title = "Questions fréquentes",
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="pt-6 pb-2 border-t border-slate-200/50 max-w-[min(100%,760px)] mx-auto w-full" aria-labelledby="faq-title">
      <div className="mb-3 text-center sm:text-left">
        <h2 id="faq-title" className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {title}
        </h2>
      </div>

      <div className="space-y-1.5">
        {items.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="border border-slate-200/50 rounded-xl bg-white/70 hover:bg-white overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer min-h-[42px]"
                aria-expanded={isOpen}
              >
                <span>{item.question}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-slate-900' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-3.5 pb-3 pt-0.5 text-slate-500 text-xs leading-relaxed border-t border-slate-100/80 bg-slate-50/40">
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
