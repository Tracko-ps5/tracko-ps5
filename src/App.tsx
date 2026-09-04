import React, { useState, useEffect } from 'react';
import { PS5_MODELS } from './data/ps5Data';
import { PS5Model, EditionDetails, ProductCondition } from './types';
import { fetchLiveOffers, fetchPriceHistory } from './services/api';
import { mergeModelsWithLiveOffers } from './services/dataMerger';
import { updateDocumentSeo, injectStructuredData } from './utils/seo';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { GtaViBanner } from './components/GtaViBanner';
import { ModelCard } from './components/ModelCard';
import { EditionChoice } from './components/EditionChoice';
import { ComparisonView } from './components/ComparisonView';
import { FaqSection } from './components/FaqSection';
import { SeoGuideView } from './components/SeoGuideView';
import { AdminPanel } from './components/AdminPanel';
import { SEO_GUIDES } from './data/seoContent';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export function App() {
  // Navigation : 'home' -> 'editions' -> 'comparison' | 'guide'
  const [step, setStep] = useState<'home' | 'editions' | 'comparison' | 'guide'>('home');
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);
  const [models, setModels] = useState<PS5Model[]>(PS5_MODELS);
  const [selectedModel, setSelectedModel] = useState<PS5Model | null>(null);
  const [selectedEdition, setSelectedEdition] = useState<EditionDetails | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [liveOffers, allHistory] = await Promise.all([
        fetchLiveOffers(),
        fetchPriceHistory(),
      ]);
      const updated = mergeModelsWithLiveOffers(PS5_MODELS, liveOffers || [], allHistory || []);
      setModels(updated);
    } catch (e) {
      console.error('Erreur chargement données live TRACKO:', e);
    }
  };

  // Initialisation du routage par URL
  useEffect(() => {
    const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    updateDocumentSeo(path);

    if (path === '/admin' || window.location.hash === '#admin') {
      setIsAdminOpen(true);
    }

    if (path === '/ps5') {
      const model = PS5_MODELS.find(m => m.id === 'ps5-standard') || PS5_MODELS[0];
      setSelectedModel(model);
      setStep('editions');
      injectStructuredData('product', { model, edition: model.digitalEdition });
    } else if (path === '/ps5-slim') {
      const model = PS5_MODELS.find(m => m.id === 'ps5-slim') || PS5_MODELS[1];
      setSelectedModel(model);
      setStep('editions');
      injectStructuredData('product', { model, edition: model.digitalEdition });
    } else if (path === '/ps5-slim-digital') {
      const model = PS5_MODELS.find(m => m.id === 'ps5-slim') || PS5_MODELS[1];
      setSelectedModel(model);
      setSelectedEdition(model.digitalEdition);
      setStep('comparison');
      injectStructuredData('product', { model, edition: model.digitalEdition });
    } else if (path === '/ps5-slim-disc') {
      const model = PS5_MODELS.find(m => m.id === 'ps5-slim') || PS5_MODELS[1];
      setSelectedModel(model);
      if (model.discEdition) {
        setSelectedEdition(model.discEdition);
        injectStructuredData('product', { model, edition: model.discEdition });
      }
      setStep('comparison');
    } else if (path === '/ps5-pro') {
      const model = PS5_MODELS.find(m => m.id === 'ps5-pro') || PS5_MODELS[2];
      setSelectedModel(model);
      setSelectedEdition(model.digitalEdition);
      setStep('comparison');
      injectStructuredData('product', { model, edition: model.digitalEdition });
    } else if (path === '/comparatif-ps5-digital-vs-lecteur') {
      setActiveGuideId('digital-vs-lecteur');
      setStep('guide');
      injectStructuredData('guide');
    } else if (path === '/ps5-neuf-vs-reconditionne') {
      setActiveGuideId('neuf-vs-reconditionne');
      setStep('guide');
      injectStructuredData('guide');
    } else {
      injectStructuredData('home');
    }

    const handlePopState = () => {
      const currentPath = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
      updateDocumentSeo(currentPath);
      if (currentPath === '/') {
        setStep('home');
        setSelectedModel(null);
        setSelectedEdition(null);
        setActiveGuideId(null);
        injectStructuredData('home');
      } else if (currentPath === '/comparatif-ps5-digital-vs-lecteur') {
        setActiveGuideId('digital-vs-lecteur');
        setStep('guide');
      } else if (currentPath === '/ps5-neuf-vs-reconditionne') {
        setActiveGuideId('neuf-vs-reconditionne');
        setStep('guide');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedModel) {
      const freshModel = models.find((m) => m.id === selectedModel.id);
      if (freshModel) {
        setSelectedModel(freshModel);
        if (selectedEdition) {
          if (selectedEdition.type === 'digital') {
            setSelectedEdition(freshModel.digitalEdition);
            injectStructuredData('product', { model: freshModel, edition: freshModel.digitalEdition });
          } else if (freshModel.discEdition) {
            setSelectedEdition(freshModel.discEdition);
            injectStructuredData('product', { model: freshModel, edition: freshModel.discEdition });
          }
        }
      }
    }
  }, [models]);

  // Sélection du modèle
  const handleSelectModel = (model: PS5Model) => {
    setSelectedModel(model);
    setStep('editions');
    if (model.id === 'ps5-standard') updateDocumentSeo('/ps5');
    else if (model.id === 'ps5-slim') updateDocumentSeo('/ps5-slim');
    else if (model.id === 'ps5-pro') updateDocumentSeo('/ps5-pro');
    injectStructuredData('product', { model, edition: model.digitalEdition });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sélection de l'édition
  const handleSelectEdition = (edition: EditionDetails) => {
    setSelectedEdition(edition);
    setStep('comparison');
    if (selectedModel?.id === 'ps5-slim') {
      if (edition.type === 'digital') updateDocumentSeo('/ps5-slim-digital');
      else updateDocumentSeo('/ps5-slim-disc');
    } else if (selectedModel?.id === 'ps5-pro') {
      updateDocumentSeo('/ps5-pro');
    } else {
      updateDocumentSeo('/ps5');
    }
    if (selectedModel) {
      injectStructuredData('product', { model: selectedModel, edition });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigation retour
  const handleGoHome = () => {
    setStep('home');
    setSelectedModel(null);
    setSelectedEdition(null);
    setActiveGuideId(null);
    updateDocumentSeo('/');
    injectStructuredData('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToEditions = () => {
    if (selectedModel) {
      setStep('editions');
      if (selectedModel.id === 'ps5-standard') updateDocumentSeo('/ps5');
      else if (selectedModel.id === 'ps5-slim') updateDocumentSeo('/ps5-slim');
      else if (selectedModel.id === 'ps5-pro') updateDocumentSeo('/ps5-pro');
      injectStructuredData('product', { model: selectedModel, edition: selectedModel.digitalEdition });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleGoHome();
    }
  };

  const handleOpenGuide = (guideId: string) => {
    const guide = SEO_GUIDES[guideId];
    if (guide) {
      setActiveGuideId(guideId);
      setStep('guide');
      updateDocumentSeo(guide.slug);
      injectStructuredData('guide');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFooterNavigate = (path: string) => {
    if (path === '/comparatif-ps5-digital-vs-lecteur') {
      handleOpenGuide('digital-vs-lecteur');
    } else if (path === '/ps5-neuf-vs-reconditionne') {
      handleOpenGuide('neuf-vs-reconditionne');
    } else if (path === '/ps5-slim-digital') {
      const model = models.find(m => m.id === 'ps5-slim') || models[0];
      setSelectedModel(model);
      setSelectedEdition(model.digitalEdition);
      setStep('comparison');
      updateDocumentSeo('/ps5-slim-digital');
      injectStructuredData('product', { model, edition: model.digitalEdition });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (path === '/ps5-slim-disc') {
      const model = models.find(m => m.id === 'ps5-slim') || models[0];
      setSelectedModel(model);
      if (model.discEdition) {
        setSelectedEdition(model.discEdition);
        injectStructuredData('product', { model, edition: model.discEdition });
      }
      setStep('comparison');
      updateDocumentSeo('/ps5-slim-disc');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (path === '/ps5-pro') {
      const model = models.find(m => m.id === 'ps5-pro') || models[2];
      setSelectedModel(model);
      setSelectedEdition(model.digitalEdition);
      setStep('comparison');
      updateDocumentSeo('/ps5-pro');
      injectStructuredData('product', { model, edition: model.digitalEdition });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (path === '/ps5') {
      const model = models.find(m => m.id === 'ps5-standard') || models[0];
      setSelectedModel(model);
      setStep('editions');
      updateDocumentSeo('/ps5');
      injectStructuredData('product', { model, edition: model.digitalEdition });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleGoHome();
    }
  };

  const scrollToModels = () => {
    const el = document.getElementById('models-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      const popular = models.find(m => m.id === 'ps5-slim') || models[0];
      handleSelectModel(popular);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-900 font-sans antialiased overflow-x-hidden w-full max-w-full">
      {/* Header compact & identifiable : TRACKO PS5 */}
      <Header onGoHome={handleGoHome} isAtHome={step === 'home'} />

      {/* Conteneur principal fluide et adaptatif */}
      <main className="flex-1 w-full max-w-[min(100%,1320px)] mx-auto px-[clamp(1rem,3vw,2.5rem)] py-[clamp(1.25rem,2.5vw,2.25rem)]">
        {/* =========================================================================
            1. ACCUEIL (Screen 1) : Hero court + Produits immédiats + GTA VI + FAQ
           ========================================================================= */}
        {step === 'home' && (
          <div className="space-y-[clamp(1.75rem,3.5vw,3rem)] animate-in fade-in duration-300">
            {/* Hero compact & percutant : laisse immédiatement la place aux produits */}
            <div className="text-center space-y-2 pt-1 pb-1">
              <h1 className="text-[clamp(1.65rem,4vw,2.6rem)] font-black text-slate-900 tracking-tight leading-[1.15] max-w-[640px] mx-auto">
                Le meilleur prix pour votre PS5.
              </h1>
              <p className="text-[clamp(0.8125rem,1.1vw,0.9375rem)] font-medium text-slate-500 tracking-normal">
                Tracké. Comparé. Au bon moment.
              </p>

              <div className="pt-2 flex justify-center">
                <button
                  onClick={scrollToModels}
                  className="px-5 py-2.5 min-h-[44px] bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <span>Comparer les prix</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Modèles PS5 : 1 col mobile / 2 col tablette / 3 col desktop fluide */}
            <section id="models-section" className="pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[clamp(1rem,2vw,1.75rem)] w-full [&>*:nth-child(3)]:sm:col-span-2 [&>*:nth-child(3)]:lg:col-span-1 [&>*:nth-child(3)]:sm:max-w-[420px] [&>*:nth-child(3)]:sm:mx-auto [&>*:nth-child(3)]:sm:w-full [&>*:nth-child(3)]:lg:max-w-none">
                {models.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    onSelect={handleSelectModel}
                  />
                ))}
              </div>
            </section>

            {/* Bandeau GTA VI compact et fluide */}
            <section aria-labelledby="gta-banner-heading" className="pt-1">
              <h2 id="gta-banner-heading" className="sr-only">
                Compte à rebours GTA VI sur PS5
              </h2>
              <GtaViBanner />
            </section>

            {/* FAQ concise */}
            <FaqSection />
          </div>
        )}

        {/* =========================================================================
            2. ÉTAPE 2 : CHOIX DE L'ÉDITION (Screen 2)
           ========================================================================= */}
        {step === 'editions' && selectedModel && (
          <div className="animate-in fade-in duration-300">
            <EditionChoice
              model={selectedModel}
              onSelectEdition={handleSelectEdition}
              onBack={handleGoHome}
            />
          </div>
        )}

        {/* =========================================================================
            3. ÉTAPE 3 : FICHE PRODUIT / COMPARATEUR (Screen 3)
           ========================================================================= */}
        {step === 'comparison' && selectedModel && selectedEdition && (
          <div className="animate-in fade-in duration-300">
            <ComparisonView
              model={selectedModel}
              edition={selectedEdition}
              onBackToModels={handleGoHome}
              onBackToEditions={handleBackToEditions}
            />
          </div>
        )}

        {/* =========================================================================
            4. GUIDES D'ACHAT SEO
           ========================================================================= */}
        {step === 'guide' && activeGuideId && SEO_GUIDES[activeGuideId] && (
          <SeoGuideView
            guide={SEO_GUIDES[activeGuideId]}
            onGoHome={handleGoHome}
            onSelectModel={(modelId) => {
              const model = models.find(m => m.id === modelId) || models[0];
              handleSelectModel(model);
            }}
            models={models}
          />
        )}
      </main>

      {/* Global Footer */}
      <Footer 
        onNavigate={handleFooterNavigate} 
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Panneau d'Administration */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onDataUpdated={loadData}
      />
    </div>
  );
}

export default App;
