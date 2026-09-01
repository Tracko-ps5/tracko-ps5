import { pilotConnector } from './connectors/pilotMerchantConnector';
import { boulangerConnector } from './connectors/boulangerMerchantConnector';
import { cdiscountConnector } from './connectors/cdiscountMerchantConnector';
import { alertManager } from './alertManager';
import { db } from './db';

export interface FreshnessStatus {
  lastSyncTimestamp: number;
  lastSyncDateFormatted: string;
  isStale: boolean;
  maxAgeHours: number;
  isCurrentlySyncing: boolean;
  lastSyncStatus: 'idle' | 'success' | 'partial_error' | 'error';
}

class FreshnessManager {
  private lastSyncTimestamp: number = 0;
  private isCurrentlySyncing: boolean = false;
  private readonly MAX_AGE_MS: number = 6 * 60 * 60 * 1000; // 6 heures
  private lastSyncStatus: 'idle' | 'success' | 'partial_error' | 'error' = 'idle';

  /**
   * Retourne l'état actuel de fraîcheur des données
   */
  public getStatus(): FreshnessStatus {
    const now = Date.now();
    const age = now - this.lastSyncTimestamp;
    const isStale = this.lastSyncTimestamp === 0 || age >= this.MAX_AGE_MS;

    return {
      lastSyncTimestamp: this.lastSyncTimestamp,
      lastSyncDateFormatted: this.lastSyncTimestamp > 0 
        ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(this.lastSyncTimestamp))
        : 'Jamais synchronisé',
      isStale,
      maxAgeHours: 6,
      isCurrentlySyncing: this.isCurrentlySyncing,
      lastSyncStatus: this.lastSyncStatus,
    };
  }

  /**
   * Permet de modifier artificiellement le timestamp (UNIQUEMENT POUR LES TESTS)
   */
  public setLastSyncTimestampForTesting(timestamp: number) {
    this.lastSyncTimestamp = timestamp;
  }

  /**
   * Vérifie la fraîcheur des données.
   * Si les données datent de plus de 6 heures (ou jamais synchronisées),
   * déclenche une synchronisation sécurisée avec verrou anti-doublon.
   */
  public async ensureFreshness(reason: string = 'request'): Promise<{ triggered: boolean; message: string }> {
    const now = Date.now();
    const age = now - this.lastSyncTimestamp;

    // 1. Si les données ont moins de 6 heures, on ne fait rien
    if (this.lastSyncTimestamp > 0 && age < this.MAX_AGE_MS) {
      const minutesRemaining = Math.round((this.MAX_AGE_MS - age) / 60000);
      return {
        triggered: false,
        message: `Données fraîches (synchronisées il y a ${Math.round(age / 60000)} min, prochaine synchro dans ${minutesRemaining} min).`,
      };
    }

    // 2. Mécanisme Anti-Doublon : si une synchro est déjà en cours, on ne relance pas
    if (this.isCurrentlySyncing) {
      return {
        triggered: false,
        message: 'Synchronisation déjà en cours par un autre processus / visiteur (verrou actif).',
      };
    }

    // 3. Poser le verrou
    this.isCurrentlySyncing = true;
    console.log(`[TRACKO FreshnessManager] Données obsolètes (> 6h ou initiales, déclenchement: ${reason}). Lancement de la synchronisation...`);

    let fnacSuccess = false;
    let blgSuccess = false;
    let cdisSuccess = false;

    try {
      // Connecteur 1 : Fnac
      try {
        const fnacRes = await pilotConnector.fetchAndSync();
        fnacSuccess = fnacRes.success;
      } catch (err: any) {
        console.error('[FreshnessManager] Échec isolé sur Fnac :', err?.message);
      }

      // Connecteur 2 : Boulanger
      try {
        const blgRes = await boulangerConnector.fetchAndSync();
        blgSuccess = blgRes.success;
      } catch (err: any) {
        console.error('[FreshnessManager] Échec isolé sur Boulanger :', err?.message);
      }

      // Connecteur 3 : Cdiscount
      try {
        const cdisRes = await cdiscountConnector.fetchAndSync();
        cdisSuccess = cdisRes.success;
      } catch (err: any) {
        console.error('[FreshnessManager] Échec isolé sur Cdiscount :', err?.message);
      }

      // Mise à jour de l'horodatage si au moins un connecteur a réussi
      if (fnacSuccess || blgSuccess || cdisSuccess) {
        this.lastSyncTimestamp = Date.now();
        this.lastSyncStatus = (fnacSuccess && blgSuccess && cdisSuccess) ? 'success' : 'partial_error';

        // Évaluation automatique des alertes de prix
        try {
          const evalResult = alertManager.evaluateAlerts();
          if (evalResult.alertsTriggered > 0) {
            console.log(`[TRACKO FreshnessManager] ${evalResult.alertsTriggered} alerte(s) de prix déclenchée(s) suite à la synchronisation.`);
          }
        } catch (alertErr) {
          console.error('[FreshnessManager] Erreur lors de l\'évaluation des alertes :', alertErr);
        }
      } else {
        this.lastSyncStatus = 'error';
      }

      const statusMsg = `Synchronisation terminée (Fnac: ${fnacSuccess ? 'OK' : 'KO'}, Boulanger: ${blgSuccess ? 'OK' : 'KO'}, Cdiscount: ${cdisSuccess ? 'OK' : 'KO'}).`;
      console.log(`[TRACKO FreshnessManager] ${statusMsg}`);

      return {
        triggered: true,
        message: statusMsg,
      };

    } finally {
      // Libérer le verrou quoi qu'il arrive
      this.isCurrentlySyncing = false;
    }
  }
}

export const freshnessManager = new FreshnessManager();
