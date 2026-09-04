import React from 'react';
import { PriceAlert } from '../types';
import { X, Bell, Trash2, CheckCircle2 } from 'lucide-react';

interface ActiveAlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: PriceAlert[];
  onDeleteAlert: (id: string) => void;
}

export const ActiveAlertsDrawer: React.FC<ActiveAlertsDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onDeleteAlert,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl p-6 flex flex-col justify-between">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Mes alertes actives ({alerts.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Notifications par email lors des baisses
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="py-4 space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Bell className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">Aucune alerte enregistrée</p>
                  <p className="text-xs text-slate-500 max-w-[240px] mx-auto">
                    Cliquez sur "Alerte prix" sur n'importe quel modèle pour être notifié des baisses.
                  </p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 relative group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          {alert.modelName} ({alert.editionType === 'digital' ? 'Digitale' : 'Avec Lecteur'})
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Envoyé à : {alert.email}
                        </span>
                      </div>
                      <button
                        onClick={() => onDeleteAlert(alert.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Supprimer cette alerte"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs">
                      <span className="text-slate-500">Seuil de déclenchement :</span>
                      <span className="font-mono font-bold text-blue-600">
                        ≤ {alert.targetPrice} €
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer close */}
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
