import React, { useState } from 'react';
import { PS5Model, EditionDetails, PriceAlert } from '../types';
import { createPriceAlert } from '../services/api';
import { Bell, CheckCircle2, X, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: PS5Model;
  edition: EditionDetails;
  onAlertCreated: (alert: PriceAlert) => void;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  isOpen,
  onClose,
  model,
  edition,
  onAlertCreated,
}) => {
  const [targetPrice, setTargetPrice] = useState<number>(
    Math.round(edition.currentLowestPrice * 0.95)
  );
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Veuillez saisir une adresse email valide.');
      return;
    }
    if (targetPrice <= 0 || targetPrice >= edition.currentLowestPrice) {
      setError(`Le prix cible doit être inférieur au prix actuel (${edition.currentLowestPrice.toFixed(2)} €).`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await createPriceAlert({
        email,
        productId: model.id,
        productName: model.name,
        editionType: edition.type,
        targetPrice: Number(targetPrice),
        currentPriceAtCreation: edition.currentLowestPrice,
      });

      if (!response.success) {
        setError(response.message || 'Erreur lors de l\'enregistrement de l\'alerte.');
        setIsLoading(false);
        return;
      }

      const newAlert: PriceAlert = {
        id: response.alert?.id || ('alert_' + Date.now()),
        modelId: model.id,
        modelName: model.name,
        editionType: edition.type,
        targetPrice: Number(targetPrice),
        currentPriceAtCreation: edition.currentLowestPrice,
        email,
        createdAt: new Date().toLocaleDateString('fr-FR'),
        isActive: true,
      };

      onAlertCreated(newAlert);
      setIsSuccess(true);
    } catch (err: any) {
      setError('Impossible de joindre le serveur. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSuccess ? (
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                  Créer une alerte de prix
                </h3>
                <p className="text-xs text-slate-500">
                  {model.shortName} — {edition.label}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Reçois un email instantané dès que le prix descend en dessous de ton seuil souhaité.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Target Price */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alerte-moi si le prix passe sous :
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => {
                      setTargetPrice(Number(e.target.value));
                      setError(null);
                    }}
                    min={100}
                    max={edition.currentLowestPrice - 1}
                    step={1}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm"
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                    €
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>Prix actuel : {edition.currentLowestPrice.toFixed(2)} €</span>
                  <button
                    type="button"
                    onClick={() => setTargetPrice(Math.floor(edition.currentLowestPrice * 0.9))}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    -10% ({Math.floor(edition.currentLowestPrice * 0.9)} €)
                  </button>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ton adresse email :
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="exemple@email.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Garanti sans spam. Désabonnement en 1 clic.</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-75 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>Activer l'alerte gratuite</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Alerte enregistrée avec succès !
            </h3>
            <p className="text-xs text-slate-600 mb-4 max-w-xs mx-auto">
              Nous surveillons pour toi les stocks et baisses de prix sur {model.shortName} ({edition.label}). Tu recevras un email dès que le prix passera sous{' '}
              <strong className="text-slate-900">{targetPrice} €</strong>.
            </p>
            <button
              onClick={handleClose}
              className="py-2.5 px-6 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
