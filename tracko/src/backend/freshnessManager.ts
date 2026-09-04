import { pilotConnector } from './connectors/pilotMerchantConnector';
import { boulangerConnector } from './connectors/boulangerMerchantConnector';
import { cdiscountConnector } from './connectors/cdiscountMerchantConnector';
import { awinFnacConnector, awinCdiscountConnector, awinGenericConnector } from './connectors/awinProductFeedConnector';
import { alertManager } from './alertManager';
import { db } from './db';

export interface FreshnessStatus {
  lastSyncTimestamp: number;
  lastSyncDateFormatted: string;
  isStale: boolean;
  maxAgeHours: number;
  isCurrentlySyncing: boolean;
  lastSyncStatus: 'idle' | 'success' | 'partial_error' | 'error';
  activeSources: {
    awinFnac: boolean;
    awinCdiscount: boolean;
    awinGeneric: boolean;
    pilotFeeds: boolean;
  };
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
      activeSources: {
        awinFnac: awinFnacConnector.isConfigured(),
        awinCdiscount: awinCdiscountConnector.isConfigured(),
        awinGeneric: awinGenericConnector.isConfigured(),
        pilotFeeds: true,
      }
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
  public async ensureFreshness(reason: string = 'request', force: boolean = false): Promise<{ triggered: boolean; message: string }> {
    const now = Date.now();
    const age = now - this.lastSyncTimestamp;

    // 1. Si les données ont moins de 6 heures et qu'on ne force pas, on ne fait rien
    if (!force && this.lastSyncTimestamp > 0 && age < this.MAX_AGE_MS) {
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
    console.log(`[TRACKO FreshnessManager] Données obsolètes ou rafraîchissement demandé (déclenchement: ${reason}). Lancement de la synchronisation...`);

    let anySuccess = false;
    const syncResults: Record<string, string> = {};

    try {
      // Priorité 1 : Connecteurs réels Awin si configurés
      if (awinFnacConnector.isConfigured()) {
        try {
          const res = await awinFnacConnector.fetchAndSync();
          syncResults['awinFnac'] = res.status;
          if (res.status === 'CONNECTED') anySuccess = true;
        } catch (err: any) {
          syncResults['awinFnac'] = `ERROR: ${err?.message}`;
        }
      }

      if (awinCdiscountConnector.isConfigured()) {
        try {
          const res = await awinCdiscountConnector.fetchAndSync();
          syncResults['awinCdiscount'] = res.status;
          if (res.status === 'CONNECTED') anySuccess = true;
        } catch (err: any) {
          syncResults['awinCdiscount'] = `ERROR: ${err?.message}`;
        }
      }

      if (awinGenericConnector.isConfigured()) {
        try {
          const res = await awinGenericConnector.fetchAndSync();
          syncResults['awinGeneric'] = res.status;
          if (res.status === 'CONNECTED') anySuccess = true;
        } catch (err: any) {
          syncResults['awinGeneric'] = `ERROR: ${err?.message}`;
        }
      }

      // Connecteurs pilotes locaux (toujours disponibles comme base de fallback)
      try {
        const fnacRes = await pilotConnector.fetchAndSync();
        if (fnacRes.success) anySuccess = true;
        syncResults['pilotFnac'] = fnacRes.success ? 'OK' : 'KO';
      } catch (err: any) {
        syncResults['pilotFnac'] = `ERROR: ${err?.message}`;
      }

      try {
        const blgRes = await boulangerConnector.fetchAndSync();
        if (blgRes.success) anySuccess = true;
        syncResults['pilotBoulanger'] = blgRes.success ? 'OK' : 'KO';
      } catch (err: any) {
        syncResults['pilotBoulanger'] = `ERROR: ${err?.message}`;
      }

      try {
        const cdisRes = await cdiscountConnector.fetchAndSync();
        if (cdisRes.success) anySuccess = true;
        syncResults['pilotCdiscount'] = cdisRes.success ? 'OK' : 'KO';
      } catch (err: any) {
        syncResults['pilotCdiscount'] = `ERROR: ${err?.message}`;
      }

      // Mise à jour de l'horodatage si au moins un connecteur a réussi
      if (anySuccess) {
        this.lastSyncTimestamp = Date.now();
        this.lastSyncStatus = 'success';

        // Évaluation automatique des alertes de prix
        try {
          const evalResult = await alertManager.evaluateAlerts();
          if (evalResult.alertsTriggered > 0) {
            console.log(`[TRACKO FreshnessManager] ${evalResult.alertsTriggered} alerte(s) de prix déclenchée(s) suite à la synchronisation.`);
          }
        } catch (alertErr) {
          console.error('[FreshnessManager] Erreur lors de l\'évaluation des alertes :', alertErr);
        }
      } else {
        this.lastSyncStatus = 'error';
      }

      const statusMsg = `Synchronisation terminée : ${JSON.stringify(syncResults)}`;
      console.log(`[TRACKO FreshnessManager] ${statusMsg}`);

      return {
        triggered: true,
        message: statusMsg,
      };

    } finally {
      this.isCurrentlySyncing = false;
    }
  }
}

export const freshnessManager = new FreshnessManager();
