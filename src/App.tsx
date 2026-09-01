import React, { useState, useEffect } from 'react';
import { PS5_MODELS } from './data/ps5Data';
import { PS5Model, EditionDetails, ProductCondition } from './types';
import { fetchLiveOffers } from './services/api';
import { mergeModelsWithLiveOffers } from './services/dataMerger';
import { updateDocumentSeo, injectStructuredData } from './utils/seo';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { GtaViBanner } from './components/GtaViBanner';
import { ModelCard } from './components/ModelCard';
import { HomeModelRow } from './components/HomeModelRow';
import { EditionChoice } from './components/EditionChoice';
import { ComparisonView } from './components/ComparisonView';
import { FaqSection } from './components/FaqSection';
import { SeoGuideView } from './components/SeoGuideView';
import { SEO_GUIDES } from './data/seoContent';
import { ArrowRight, CheckCircle2, Sparkles, RefreshCw, Layers, BookOpen } from 'lucide-react';

export function App() {
  // Navigation step state: 'home' -> 'models' -> 'editions' -> 'comparison' | 'guide'
  const [step, setStep] = useState<'home' | 'models' | 'editions' | 'comparison' | 'guide'>('home');
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);
  const [conditionFilter, setConditionFilter] = useState<'all' | ProductCondition>('all');
  const [models, setModels] = useState<PS5Model[]>(PS5_MODELS);
  const [selectedModel, setSelectedModel] = useState<PS5Model | null>(null);
  const [selectedEdition, setSelectedEdition] = useState<EditionDetails | null>(null);

  // Initialisation du routage par URL au chargement de la page
  useEffect(() => {
    const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    updateDocumentSeo(path);

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

    // Gestion du bouton précédent/suivant du navigateur
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

  // Chargement des données fraîches depuis l'API backend
  useEffect(() => {
    async function loadData() {
      try {
        const liveOffers = await fetchLiveOffers();
        if (liveOffers && liveOffers.length > 0) {
          const updated = mergeModelsWithLiveOffers(PS5_MODELS, liveOffers);
          setModels(updated);
        }
      } catch (e) {
        console.error('Erreur chargement live offers:', e);
      }
    }
    loadData();
  }, []);

  // Synchronise selectedModel et selectedEdition si les modèles se mettent à jour
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

  // Transition handler when clicking "DÉMARRER"
  const handleStart = () => {
    setStep('models');
    updateDocumentSeo('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler when a user selects a console model (PS5, PS5 Slim, PS5 Pro)
  const handleSelectModel = (model: PS5Model) => {
    setSelectedModel(model);
    setStep('editions');
    if (model.id === 'ps5-standard') updateDocumentSeo('/ps5');
    else if (model.id === 'ps5-slim') updateDocumentSeo('/ps5-slim');
    else if (model.id === 'ps5-pro') updateDocumentSeo('/ps5-pro');
    injectStructuredData('product', { model, edition: model.digitalEdition });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler when a user selects an edition (Digital vs Disc)
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

  // Reset to Home
  const handleGoHome = () => {
    setStep('home');
    setSelectedModel(null);
    setSelectedEdition(null);
    setActiveGuideId(null);
    updateDocumentSeo('/');
    injectStructuredData('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back to Models selection
  const handleBackToModels = () => {
    setStep('models');
    setSelectedEdition(null);
    updateDocumentSeo('/');
    injectStructuredData('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back to Editions selection
  const handleBackToEditions = () => {
    if (selectedModel) {
      setStep('editions');
      if (selectedModel.id === 'ps5-standard') updateDocumentSeo('/ps5');
      else if (selectedModel.id === 'ps5-slim') updateDocumentSeo('/ps5-slim');
      else if (selectedModel.id === 'ps5-pro') updateDocumentSeo('/ps5-pro');
      injectStructuredData('product', { model: selectedModel, edition: selectedModel.digitalEdition });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setStep('models');
      updateDocumentSeo('/');
    }
  };

  // Navigation vers un guide d'achat
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

  // Navigation universelle depuis le footer
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Persistent Global Header */}
      <Header onGoHome={handleGoHome} isAtHome={step === 'home'} />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 md:py-10">
        {/* =========================================================================
            1. ACCUEIL (Screen 1)
            Conformément à la Règle N°3 : disparaît totalement quand on clique sur DÉMARRER
           ========================================================================= */}
        {step === 'home' && (
          <div className="space-y-10 sm:space-y-14 animate-in fade-in duration-500">
            {/* Hero Section */}
            <div className="text-center max-w-3xl mx-auto space-y-5 pt-2 sm:pt-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-2xs text-xs font-semibold text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Comparateur & Tracker de Prix PS5 en Direct</span>
              </div>

              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Trouve le meilleur prix.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Au bon moment.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
                Compare en direct les offres <strong>Neuves</strong> et <strong>Reconditionnées</strong> chez Amazon, Fnac, Cdiscount, Back Market, Boulanger et PlayStation Direct.
              </p>

              {/* Bouton DÉMARRER Principal */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleStart}
                  className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-black text-sm sm:text-base rounded-2xl transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 cursor-pointer group"
                >
                  <span>DÉMARRER LE COMPARATEUR</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
                </button>
              </div>

              {/* Badges de confiance */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-1 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Neuf & Reconditionné Certifié</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Marchands Officiels Français</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Liens directs vers les annonces</span>
                </div>
              </div>
            </div>

            {/* Aperçu horizontal des annonces de la gamme PS5 (non cliquable avant Démarrer) */}
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    Aperçu des modèles PlayStation 5
                  </h2>
                  <p className="text-xs text-slate-500">
                    Cliquez sur <strong>Démarrer</strong> ci-dessus pour lancer la sélection personnalisée
                  </p>
                </div>
              </div>

              {/* Annonces horizontales disposées les unes sur les autres */}
              <div className="flex flex-col gap-3.5 sm:gap-4">
                {models.map((model) => (
                  <HomeModelRow key={model.id} model={model} />
                ))}
              </div>
            </div>

            {/* RÈGLE N°5 : BANDEAU GTA VI AVEC COMPTE À REBOURS EN HAUT À DROITE */}
            <section aria-labelledby="gta-banner-heading" className="pt-2 max-w-4xl mx-auto">
              <h2 id="gta-banner-heading" className="sr-only">
                Compte à rebours sortie Grand Theft Auto VI sur PS5
              </h2>
              <GtaViBanner />
            </section>

            {/* GUIDES D'ACHAT & DOSSIERS SEO */}
            <section className="max-w-4xl mx-auto pt-4" aria-labelledby="guides-heading">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <h2 id="guides-heading" className="text-lg sm:text-xl font-bold text-slate-900">
                    Guides d'Achat & Conseils PS5
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  onClick={() => handleOpenGuide('digital-vs-lecteur')}
                  className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-1">
                    Comparatif Matériel
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                    PS5 Digitale vs PS5 avec Lecteur : Le Guide Complet
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    Comparatif technique, calcul de rentabilité sur le long terme et critères pour faire le bon choix.
                  </p>
                  <span className="text-xs font-bold text-slate-900 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Lire le guide <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div 
                  onClick={() => handleOpenGuide('neuf-vs-reconditionne')}
                  className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-1">
                    Guide Économies & Sécurité
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors mb-2">
                    PS5 Neuve ou Reconditionnée : Pièges à éviter et Garanties
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    Les points de contrôle sur la console, les garanties légales et les économies réelles constatées.
                  </p>
                  <span className="text-xs font-bold text-slate-900 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Lire le guide <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </section>

            {/* SECTION FAQ (RÈGLE N°7 & N°8 SEO) */}
            <FaqSection />
          </div>
        )}

        {/* =========================================================================
            2. ÉTAPE 1 : CHOIX DU MODÈLE PS5 AVEC BOUTONS NEUF / RECONDITIONNÉ
            (PS5 Slim, PS5 Pro, PS5 Classique) - Cartes cliquables
           ========================================================================= */}
        {step === 'models' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header step */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Étape 1 sur 3
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Quel modèle de PS5 cherchez-vous ?
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Cliquez sur la console de votre choix pour voir les tarifs et marchands en direct
                </p>
              </div>

              <button
                onClick={handleGoHome}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl self-start md:self-auto hover:bg-slate-50 transition-colors cursor-pointer"
              >
                ← Retour à l'accueil
              </button>
            </div>

            {/* BOUTONS DE FILTRAGE : NEUF / RECONDITIONNÉ */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-600 font-medium text-center sm:text-left">
                Filtrer par type d'état :
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setConditionFilter('all')}
                  className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    conditionFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Tous les états</span>
                </button>

                <button
                  onClick={() => setConditionFilter('new')}
                  className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    conditionFilter === 'new'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Neuf scellé</span>
                </button>

                <button
                  onClick={() => setConditionFilter('refurbished')}
                  className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    conditionFilter === 'refurbished'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reconditionné</span>
                </button>
              </div>
            </div>

            {/* Grid of 3 PS5 Models */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {models.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  onSelect={handleSelectModel}
                  conditionFilter={conditionFilter}
                />
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            3. ÉTAPE 2 : CHOIX DE L'ÉDITION (Screen 3)
            (Digital vs Avec Lecteur)
           ========================================================================= */}
        {step === 'editions' && selectedModel && (
          <div className="animate-in fade-in duration-500">
            <EditionChoice
              model={selectedModel}
              onSelectEdition={handleSelectEdition}
              onBack={handleBackToModels}
            />
          </div>
        )}

        {/* =========================================================================
            4. ÉTAPE 3 : TABLEAU COMPARATIF, HISTORIQUE ET ALERTES (Screen 4)
           ========================================================================= */}
        {step === 'comparison' && selectedModel && selectedEdition && (
          <div className="animate-in fade-in duration-500">
            <ComparisonView
              model={selectedModel}
              edition={selectedEdition}
              onBackToModels={handleBackToModels}
              onBackToEditions={handleBackToEditions}
            />
          </div>
        )}

        {/* =========================================================================
            5. PAGE GUIDE D'ACHAT DÉDIÉE (SEO)
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

      {/* Global Footer avec Maillage Interne */}
      <Footer onNavigate={handleFooterNavigate} />
    </div>
  );
}

export default App;
