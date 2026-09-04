import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  Save, 
  Copy, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  X, 
  ExternalLink,
  Clock,
  Download,
  History,
  Check,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';
import { 
  loginAdmin, 
  fetchAdminOffers, 
  saveAdminOffer, 
  bulkSaveAdminOffers, 
  fetchLatestObservations,
  exportAdminBackup,
} from '../services/api';
import { LiveOffer, PriceHistoryEntry } from '../backend/types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onDataUpdated?: () => void;
}

interface EditableOfferState {
  productId: string;
  editionType: 'digital' | 'disc';
  merchantId: string;
  merchantName: string;
  condition: 'new' | 'refurbished';
  price: number | string;
  originalPrice: number | string;
  inStock: boolean;
  url: string;
  deliveryPrice: number | string;
  deliveryInfo: string;
  lastCheckedFormatted?: string;
  isDirty?: boolean;
}

const DEFAULT_MERCHANTS = [
  { id: 'amazon', name: 'Amazon', url: 'https://www.amazon.fr' },
  { id: 'fnac', name: 'Fnac', url: 'https://www.fnac.com' },
  { id: 'cdiscount', name: 'Cdiscount', url: 'https://www.cdiscount.com' },
  { id: 'boulanger', name: 'Boulanger', url: 'https://www.boulanger.com' },
  { id: 'leclerc', name: 'E.Leclerc', url: 'https://www.e.leclerc' },
  { id: 'micromania', name: 'Micromania', url: 'https://www.micromania.fr' },
  { id: 'sony-direct', name: 'PlayStation Direct', url: 'https://direct.playstation.com' },
  { id: 'backmarket', name: 'Back Market', url: 'https://www.backmarket.fr', isRefurbished: true }
];

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, onDataUpdated }) => {
  // Auth state
  const [token, setToken] = useState<string>(() => localStorage.getItem('tracko_admin_token') || '');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Data state
  const [selectedProduct, setSelectedProduct] = useState<'ps5-slim' | 'ps5-pro' | 'ps5-standard'>('ps5-slim');
  const [selectedEdition, setSelectedEdition] = useState<'digital' | 'disc'>('digital');
  const [offersList, setOffersList] = useState<EditableOfferState[]>([]);
  const [rawOffers, setRawOffers] = useState<LiveOffer[]>([]);
  const [historyList, setHistoryList] = useState<PriceHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Charger les données dès que le token est présent
  useEffect(() => {
    if (isOpen && token) {
      loadData();
    }
  }, [isOpen, token]);

  // Synchroniser la liste éditable quand on change de produit/édition
  useEffect(() => {
    if (rawOffers.length > 0 || token) {
      buildEditableOffersForSelection(selectedProduct, selectedEdition);
    }
  }, [selectedProduct, selectedEdition, rawOffers]);

  // Décompte des lignes modifiées
  const dirtyCount = offersList.filter(o => o.isDirty).length;

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAdminOffers(token);
      setRawOffers(data.offers || []);
      setHistoryList(data.history || []);
    } catch (err: any) {
      console.error('Erreur chargement admin:', err);
      if (err?.message?.includes('Accès refusé')) {
        setToken('');
        localStorage.removeItem('tracko_admin_token');
        setAuthError('Session expirée ou invalide. Veuillez vous reconnecter.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthenticating(true);
    try {
      const res = await loginAdmin(passwordInput);
      if (res.success && res.token) {
        setToken(res.token);
        localStorage.setItem('tracko_admin_token', res.token);
        setPasswordInput('');
      } else {
        setAuthError(res.message || 'Mot de passe administrateur incorrect.');
      }
    } catch (err) {
      setAuthError('Erreur de connexion au serveur.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('tracko_admin_token');
    setOffersList([]);
    setRawOffers([]);
    setSaveFeedback(null);
  };

  const buildEditableOffersForSelection = (prodId: string, edType: 'digital' | 'disc') => {
    const existing = rawOffers.filter(o => o.productId === prodId && o.editionType === edType);

    const rows: EditableOfferState[] = DEFAULT_MERCHANTS.map(m => {
      const match = existing.find(o => o.merchantId === m.id);
      if (match) {
        return {
          productId: match.productId,
          editionType: match.editionType,
          merchantId: match.merchantId,
          merchantName: match.merchantName,
          condition: match.condition === 'refurbished' ? 'refurbished' : 'new',
          price: match.price,
          originalPrice: match.originalPrice || match.price,
          inStock: match.inStock,
          url: match.url || m.url,
          deliveryPrice: match.deliveryPrice || 0,
          deliveryInfo: match.deliveryInfo || 'Livraison standard',
          lastCheckedFormatted: match.lastCheckedFormatted,
          isDirty: false,
        };
      }

      const defaultPrice = prodId === 'ps5-pro' ? 799.99 : (edType === 'digital' ? 449.99 : 549.99);
      return {
        productId: prodId,
        editionType: edType,
        merchantId: m.id,
        merchantName: m.name,
        condition: m.isRefurbished ? 'refurbished' : 'new',
        price: defaultPrice,
        originalPrice: defaultPrice,
        inStock: true,
        url: m.url,
        deliveryPrice: 0,
        deliveryInfo: 'Livraison standard',
        isDirty: false,
      };
    });

    setOffersList(rows);
  };

  const handleFieldChange = (index: number, field: keyof EditableOfferState, value: any) => {
    setOffersList(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
        isDirty: true,
      };
      return next;
    });
  };

  const handleStockToggle = (index: number) => {
    setOffersList(prev => {
      const next = [...prev];
      const newStock = !next[index].inStock;
      next[index] = {
        ...next[index],
        inStock: newStock,
        isDirty: true,
      };
      return next;
    });
  };

  // « Copier les prix d'hier » : injecte les dernières observations
  const handleCopyYesterdayPrices = async () => {
    setIsLoading(true);
    setSaveFeedback(null);
    try {
      const res = await fetchLatestObservations(token);
      if (res.lastObservations && res.lastObservations.length > 0) {
        setOffersList(prev => {
          return prev.map(row => {
            const lastObs = res.lastObservations.find(
              o => o.productId === row.productId && o.editionType === row.editionType && o.merchantId === row.merchantId
            );
            if (lastObs) {
              return {
                ...row,
                price: lastObs.price,
                originalPrice: lastObs.originalPrice || lastObs.price,
                inStock: lastObs.inStock,
                url: lastObs.url || row.url,
                isDirty: true,
              };
            }
            return row;
          });
        });
        setSaveFeedback({
          type: 'success',
          message: '📋 Dernières observations appliquées. Ajustez vos valeurs puis enregistrez.',
        });
      } else {
        setSaveFeedback({
          type: 'error',
          message: 'Aucun relevé précédent disponible. Vous pouvez saisir les prix actuels pour enregistrer le premier relevé.',
        });
      }
    } catch (err) {
      setSaveFeedback({ type: 'error', message: 'Erreur lors de la récupération des données.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Sauvegarder une seule offre
  const handleSaveSingleOffer = async (index: number) => {
    const item = offersList[index];
    if (!item) return;

    setIsSaving(true);
    setSaveFeedback(null);
    try {
      const res = await saveAdminOffer(token, {
        productId: item.productId,
        editionType: item.editionType,
        merchantId: item.merchantId,
        merchantName: item.merchantName,
        price: Number(item.price),
        originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
        condition: item.condition,
        inStock: item.inStock,
        url: item.url,
        deliveryPrice: Number(item.deliveryPrice || 0),
        deliveryInfo: item.deliveryInfo,
      });

      if (res.success) {
        setOffersList(prev => {
          const next = [...prev];
          next[index] = { ...next[index], isDirty: false };
          return next;
        });
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        setLastSavedTime(timeStr);
        setSaveFeedback({
          type: 'success',
          message: `✓ Offre ${item.merchantName} enregistrée (${timeStr})`,
        });
        if (onDataUpdated) onDataUpdated();
        loadData();
      } else {
        setSaveFeedback({ type: 'error', message: res.message || 'Erreur lors de la sauvegarde.' });
      }
    } catch (err: any) {
      setSaveFeedback({ type: 'error', message: err?.message || 'Erreur réseau.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Sauvegarder toutes les offres de l'onglet actif
  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveFeedback(null);
    try {
      const payload = offersList.map(item => ({
        productId: item.productId,
        editionType: item.editionType,
        merchantId: item.merchantId,
        merchantName: item.merchantName,
        price: Number(item.price),
        originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
        condition: item.condition,
        inStock: item.inStock,
        url: item.url,
        deliveryPrice: Number(item.deliveryPrice || 0),
        deliveryInfo: item.deliveryInfo,
      }));

      const res = await bulkSaveAdminOffers(token, payload);
      if (res.success) {
        setOffersList(prev => prev.map(o => ({ ...o, isDirty: false })));
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        setLastSavedTime(timeStr);
        setSaveFeedback({
          type: 'success',
          message: `✓ Modifications enregistrées (${res.updatedCount} offres mises à jour à ${timeStr})`,
        });
        if (onDataUpdated) onDataUpdated();
        loadData();
      } else {
        setSaveFeedback({ type: 'error', message: 'Erreur lors de la sauvegarde groupée.' });
      }
    } catch (err: any) {
      setSaveFeedback({ type: 'error', message: err?.message || 'Erreur réseau.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Télécharger une sauvegarde JSON
  const handleExportBackup = async () => {
    try {
      const data = await exportAdminBackup(token);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tracko_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Erreur lors du téléchargement de la sauvegarde.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 md:p-6">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] text-slate-100">
        
        {/* ============================================================ */}
        {/* 1. HEADER COMPACT & PREMIUM */}
        {/* ============================================================ */}
        <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Administration TRACKO
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono font-medium">
                  Direct
                </span>
              </div>
              <p className="text-xs text-slate-400">Mise à jour des prix et disponibilités</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {token && (
              <button
                onClick={handleLogout}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition"
              >
                Déconnexion
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. ZONE PRINCIPALE (SCROLL UNIQUE SANS DOUBLE SCROLLBAR) */}
        {/* ============================================================ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* ÉCRAN DE CONNEXION */}
          {!token ? (
            <div className="max-w-md mx-auto py-10 text-center space-y-5">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Espace Administrateur Sécurisé</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Connectez-vous pour mettre à jour les prix en direct sans redéploiement.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <input
                    type="password"
                    placeholder="Mot de passe administrateur"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-center font-mono text-base"
                    required
                    autoFocus
                  />
                </div>

                {authError && (
                  <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-800/60 text-red-300 text-xs flex items-center gap-2 justify-center">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
                >
                  {isAuthenticating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Unlock className="w-4 h-4" />
                  )}
                  <span>Accéder au Panneau</span>
                </button>
              </form>
            </div>
          ) : (
            /* CONTENU DU DASHBOARD CONNECTÉ */
            <div className="space-y-3.5">

              {/* BARRE DE CONTRÔLES : MODÈLES, ÉDITIONS & ACTIONS RAPIDES */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/90 flex flex-wrap items-center justify-between gap-3">
                
                {/* Sélecteurs Modèle & Édition */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Modèle */}
                  <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                    {[
                      { id: 'ps5-slim', label: 'PS5 Slim' },
                      { id: 'ps5-pro', label: 'PS5 Pro' },
                      { id: 'ps5-standard', label: 'PS5 Originale' },
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedProduct(m.id as any)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                          selectedProduct === m.id
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {/* Édition */}
                  {selectedProduct !== 'ps5-pro' && (
                    <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                      <button
                        onClick={() => setSelectedEdition('digital')}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                          selectedEdition === 'digital'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Digitale
                      </button>
                      <button
                        onClick={() => setSelectedEdition('disc')}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                          selectedEdition === 'disc'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Avec Lecteur
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions rapides à droite */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyYesterdayPrices}
                    disabled={isLoading}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700/80 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                    title="Préremplit avec les prix de la dernière observation"
                  >
                    <Copy className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">Copier les prix d'hier</span>
                    <span className="sm:hidden">Copier hier</span>
                  </button>

                  <button
                    onClick={loadData}
                    disabled={isLoading}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700/60 transition cursor-pointer"
                    title="Actualiser les données"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* BARRE DE RÉSUMÉ COMPACTE */}
              <div className="px-3.5 py-2 bg-slate-950/40 border border-slate-800/80 rounded-lg flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-300">{offersList.length} marchands</span>
                  <span>·</span>
                  <span className={dirtyCount > 0 ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                    {dirtyCount > 0 ? `● ${dirtyCount} offre${dirtyCount > 1 ? 's' : ''} modifiée${dirtyCount > 1 ? 's' : ''}` : '0 modification en cours'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>Dernière sauvegarde : {lastSavedTime ? lastSavedTime : 'Non modifiée durant cette session'}</span>
                </div>
              </div>

              {/* NOTIFICATION FLOTTANTE DE SAUVEGARDE */}
              {saveFeedback && (
                <div
                  className={`p-2.5 px-3.5 rounded-xl border text-xs flex items-center justify-between gap-2.5 transition animate-in fade-in ${
                    saveFeedback.type === 'success'
                      ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                      : 'bg-red-950/50 border-red-800 text-red-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {saveFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                    )}
                    <span className="font-medium">{saveFeedback.message}</span>
                  </div>
                  <button 
                    onClick={() => setSaveFeedback(null)}
                    className="text-slate-400 hover:text-white p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* ============================================================ */}
              {/* 3. TABLEAU DES MARCHANDS : LIGNES ULTRA COMPACTES */}
              {/* ============================================================ */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                
                {/* En-tête de colonnes (Desktop uniquement) */}
                <div className="hidden md:grid md:grid-cols-12 gap-2 px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider items-center">
                  <div className="col-span-3">Marchand</div>
                  <div className="col-span-2 text-left">Prix (€)</div>
                  <div className="col-span-2 text-left">Prix Réf (€)</div>
                  <div className="col-span-2 text-center">Stock</div>
                  <div className="col-span-2">Lien URL</div>
                  <div className="col-span-1 text-right">Action</div>
                </div>

                {/* Liste des marchands */}
                <div className="divide-y divide-slate-800/60">
                  {offersList.map((item, index) => {
                    const isOutOfStock = !item.inStock;

                    return (
                      <div
                        key={item.merchantId}
                        className={`transition-colors ${
                          item.isDirty ? 'bg-indigo-950/20' : 'hover:bg-slate-900/40'
                        } ${isOutOfStock ? 'opacity-85' : ''}`}
                      >
                        {/* VERSION DESKTOP : LIGNE COMPACTE SUR 1 LIGNE */}
                        <div className="hidden md:grid md:grid-cols-12 gap-2 px-3.5 py-2 items-center text-xs">
                          
                          {/* 1. MARCHAND + STATUT MODIFIÉ */}
                          <div className="col-span-3 flex items-center gap-2 min-w-0">
                            <span className="font-semibold text-white truncate text-sm">
                              {item.merchantName}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium shrink-0 ${
                              item.condition === 'refurbished' 
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' 
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {item.condition === 'refurbished' ? 'Recond.' : 'Neuf'}
                            </span>
                            {item.isDirty && (
                              <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5 shrink-0" title="Non sauvegardé">
                                ● Modifié
                              </span>
                            )}
                          </div>

                          {/* 2. PRIX (VISUELLEMENT PRIORITAIRE) */}
                          <div className="col-span-2">
                            <div className="relative flex items-center">
                              <input
                                type="number"
                                step="0.01"
                                value={item.price}
                                onChange={(e) => handleFieldChange(index, 'price', e.target.value)}
                                className={`w-full pl-2.5 pr-6 py-1 rounded-lg border text-sm font-bold font-mono focus:outline-none transition ${
                                  isOutOfStock
                                    ? 'bg-slate-900/80 border-slate-700 text-slate-400 line-through'
                                    : 'bg-slate-950 border-indigo-500/40 focus:border-indigo-400 text-emerald-400 shadow-inner'
                                }`}
                              />
                              <span className="absolute right-2 text-xs font-semibold text-slate-500 pointer-events-none">
                                €
                              </span>
                            </div>
                          </div>

                          {/* 3. PRIX RÉF */}
                          <div className="col-span-2">
                            <div className="relative flex items-center">
                              <input
                                type="number"
                                step="0.01"
                                value={item.originalPrice}
                                onChange={(e) => handleFieldChange(index, 'originalPrice', e.target.value)}
                                className="w-full pl-2 pr-6 py-1 bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-400 focus:outline-none focus:border-indigo-500"
                              />
                              <span className="absolute right-2 text-xs text-slate-500 pointer-events-none">
                                €
                              </span>
                            </div>
                          </div>

                          {/* 4. STOCK (BOUTON TOGGLE COMPACT & CLAIR) */}
                          <div className="col-span-2 flex justify-center">
                            <button
                              type="button"
                              onClick={() => handleStockToggle(index)}
                              className={`w-full py-1 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                                item.inStock
                                  ? 'bg-emerald-950/40 border-emerald-600/70 text-emerald-300 hover:bg-emerald-900/40'
                                  : 'bg-red-950/60 border-red-600 text-red-300 hover:bg-red-900/60'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${item.inStock ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                              <span>{item.inStock ? 'En stock' : 'En rupture'}</span>
                            </button>
                          </div>

                          {/* 5. LIEN MARCHAND */}
                          <div className="col-span-2 flex items-center gap-1">
                            <input
                              type="text"
                              value={item.url}
                              onChange={(e) => handleFieldChange(index, 'url', e.target.value)}
                              placeholder="https://..."
                              className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-400 font-mono focus:outline-none focus:border-indigo-500 truncate"
                            />
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 text-slate-400 hover:text-indigo-400 transition shrink-0"
                                title="Ouvrir le lien"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>

                          {/* 6. BOUTON ENREGISTRER DISCRET */}
                          <div className="col-span-1 flex justify-end">
                            <button
                              onClick={() => handleSaveSingleOffer(index)}
                              disabled={isSaving}
                              className={`p-1.5 rounded-lg text-xs transition flex items-center justify-center cursor-pointer ${
                                item.isDirty
                                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm font-semibold'
                                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                              }`}
                              title="Enregistrer cette ligne uniquement"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>

                        {/* VERSION MOBILE (< md) : CARTE COMPACTE ÉLÉGANTE */}
                        <div className="md:hidden p-3 space-y-2.5 text-xs">
                          {/* Haut de carte : Nom + Stock Switch */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-sm">{item.merchantName}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                item.condition === 'refurbished' 
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' 
                                  : 'bg-slate-800 text-slate-400'
                              }`}>
                                {item.condition === 'refurbished' ? 'Recond.' : 'Neuf'}
                              </span>
                              {item.isDirty && (
                                <span className="text-[10px] text-amber-400 font-bold">● Modifié</span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleStockToggle(index)}
                              className={`py-1 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border cursor-pointer ${
                                item.inStock
                                  ? 'bg-emerald-950/40 border-emerald-600/70 text-emerald-300'
                                  : 'bg-red-950/60 border-red-600 text-red-300'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${item.inStock ? 'bg-emerald-400' : 'bg-red-500'}`} />
                              <span>{item.inStock ? 'En stock' : 'En rupture'}</span>
                            </button>
                          </div>

                          {/* Milieu de carte : Prix & Prix de réf */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-0.5">
                                Prix (€)
                              </label>
                              <div className="relative flex items-center">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.price}
                                  onChange={(e) => handleFieldChange(index, 'price', e.target.value)}
                                  className={`w-full pl-2.5 pr-6 py-1.5 rounded-lg border text-sm font-bold font-mono focus:outline-none ${
                                    isOutOfStock
                                      ? 'bg-slate-900 border-slate-700 text-slate-400 line-through'
                                      : 'bg-slate-950 border-indigo-500/50 text-emerald-400'
                                  }`}
                                />
                                <span className="absolute right-2 text-xs font-semibold text-slate-500 pointer-events-none">
                                  €
                                </span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-0.5">
                                Prix Réf (€)
                              </label>
                              <div className="relative flex items-center">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.originalPrice}
                                  onChange={(e) => handleFieldChange(index, 'originalPrice', e.target.value)}
                                  className="w-full pl-2.5 pr-6 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-400 focus:outline-none"
                                />
                                <span className="absolute right-2 text-xs text-slate-500 pointer-events-none">
                                  €
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Bas de carte : Lien & bouton sauvegarder discret */}
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                            <input
                              type="text"
                              value={item.url}
                              onChange={(e) => handleFieldChange(index, 'url', e.target.value)}
                              placeholder="https://..."
                              className="flex-1 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-400 font-mono truncate"
                            />
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-slate-400 hover:text-white"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => handleSaveSingleOffer(index)}
                              disabled={isSaving}
                              className={`px-2 py-1 rounded-lg text-xs transition flex items-center gap-1 ${
                                item.isDirty
                                  ? 'bg-amber-600 text-white font-medium'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              <Save className="w-3 h-3" />
                              <span>Sauver</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ACCORDÉON HISTORIQUE D'OBSERVATIONS (SECONDAIRE ET COMPACT) */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full px-3.5 py-2 flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition bg-slate-900/40 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <History className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-medium">Historique des observations enregistrées ({historyList.length})</span>
                  </div>
                  {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showHistory && (
                  <div className="p-3 max-h-36 overflow-y-auto divide-y divide-slate-800/60 text-xs">
                    {historyList.slice(-10).reverse().map((h) => (
                      <div key={h.id} className="py-1.5 flex items-center justify-between text-slate-400">
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-slate-500 text-[11px]">{h.dateLabel || h.checkedAt.slice(0, 10)}</span>
                          <span className="font-semibold text-white">{h.merchantName}</span>
                          <span className="text-[10px] text-slate-500">({h.productId} - {h.editionType})</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`font-mono font-bold ${h.inStock ? 'text-emerald-400' : 'text-red-400 line-through'}`}>
                            {h.price.toFixed(2)} €
                          </span>
                          <span className={`text-[10px] px-1 py-0.2 rounded ${h.inStock ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'}`}>
                            {h.inStock ? 'Stock' : 'Rupture'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* ============================================================ */}
        {/* 4. FOOTER AVEC BOUTON GLOBAL D'ENREGISTREMENT PRIORITAIRE */}
        {/* ============================================================ */}
        {token && (
          <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <button
              onClick={handleExportBackup}
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-slate-700/60 cursor-pointer"
              title="Télécharger une sauvegarde JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sauvegarder JSON</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
              >
                Fermer
              </button>

              <button
                onClick={handleSaveAll}
                disabled={isSaving}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer ${
                  dirtyCount > 0
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white ring-2 ring-indigo-500/30 shadow-indigo-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Save className="w-4 h-4 text-white" />
                )}
                <span>
                  {dirtyCount > 0 
                    ? `💾 ENREGISTRER TOUTES LES MODIFICATIONS (${dirtyCount})`
                    : '💾 ENREGISTRER TOUTES LES MODIFICATIONS'}
                </span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
