import React from 'react';
import { SeoGuideData } from '../data/seoContent';
import { BookOpen, Clock, Calendar, ArrowLeft, ArrowRight, Lightbulb, CheckCircle2 } from 'lucide-react';
import { PS5Model } from '../types';

interface SeoGuideViewProps {
  guide: SeoGuideData;
  onGoHome: () => void;
  onSelectModel?: (modelId: string) => void;
  models: PS5Model[];
}

export const SeoGuideView: React.FC<SeoGuideViewProps> = ({
  guide,
  onGoHome,
  onSelectModel,
  models
}) => {
  const relatedModel = guide.relatedModelId ? models.find(m => m.id === guide.relatedModelId) : null;

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fadeIn">
      {/* Navigation retour */}
      <button
        onClick={onGoHome}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 mb-6 group cursor-pointer transition-colors"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Retour au comparateur TRACKO</span>
      </button>

      {/* En-tête de l'article */}
      <header className="mb-10 border-b border-slate-200/80 pb-8">
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700">
            <BookOpen className="w-3.5 h-3.5" />
            Guide d'achat PS5
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Lecture {guide.readingTime}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Mis à jour le {guide.publishedDate}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4">
          {guide.title}
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
          {guide.subtitle}
        </p>
      </header>

      {/* Corps du guide */}
      <div className="space-y-10 text-slate-700 text-base leading-relaxed">
        {guide.sections.map((section, idx) => (
          <section key={idx} className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {section.heading}
            </h2>
            
            {section.content.map((paragraph, pIdx) => (
              <p key={pIdx} className="text-slate-600 leading-relaxed">
                {paragraph}
              </p>
            ))}

            {section.tips && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3.5 text-amber-900 text-sm sm:text-base my-4">
                <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="font-medium leading-relaxed">
                  {section.tips}
                </div>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* Appel à l'action vers le comparateur */}
      {relatedModel && onSelectModel && (
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <div className="text-xs uppercase font-bold tracking-widest text-emerald-400 mb-1">
              Prix en direct
            </div>
            <h3 className="text-xl sm:text-2xl font-black">
              Voir les offres pour la {relatedModel.name}
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Comparez les prix Fnac, Amazon, Cdiscount et Boulanger en direct.
            </p>
          </div>
          <button
            onClick={() => onSelectModel(relatedModel.id)}
            className="w-full sm:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <span>Comparer les prix</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </article>
  );
};
