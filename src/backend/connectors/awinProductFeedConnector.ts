import { db } from '../db';
import { LiveOffer, ConnectorExecutionLog } from '../types';

/**
 * Interface normalisée pour les lignes d'un flux catalogue Awin (CSV / JSON / XML export)
 */
export interface AwinRawRecord {
  aw_product_id?: string;
  merchant_product_id?: string;
  product_name?: string;
  description?: string;
  search_price?: string | number;
  retail_price?: string | number;
  currency?: string;
  merchant_name?: string;
  merchant_id?: string;
  category_name?: string;
  in_stock?: string | number | boolean;
  stock_quantity?: string | number;
  condition?: string;
  delivery_cost?: string | number;
  delivery_time?: string;
  ean?: string;
  isbn?: string;
  upc?: string;
  mpn?: string;
  merchant_image_url?: string;
  aw_deep_link?: string;
  valid_to?: string;
}

/**
 * Mapping des codes EAN officiels de référence pour la PlayStation 5
 */
export const OFFICIAL_PS5_EAN_MAP: Record<string, { productId: string; editionType: 'digital' | 'disc'; modelName: string }> = {
  // PS5 Slim Digitale
  '0711719577249': { productId: 'ps5-slim', editionType: 'digital', modelName: 'PS5 Slim Édition Digitale' },
  '711719577249': { productId: 'ps5-slim', editionType: 'digital', modelName: 'PS5 Slim Édition Digitale' },

  // PS5 Slim avec Lecteur (Standard)
  '0711719577140': { productId: 'ps5-slim', editionType: 'disc', modelName: 'PS5 Slim Standard avec Lecteur' },
  '711719577140': { productId: 'ps5-slim', editionType: 'disc', modelName: 'PS5 Slim Standard avec Lecteur' },

  // PS5 Pro
  '0711719580003': { productId: 'ps5-pro', editionType: 'digital', modelName: 'PS5 Pro 2 To' },
  '711719580003': { productId: 'ps5-pro', editionType: 'digital', modelName: 'PS5 Pro 2 To' },

  // PS5 Châssis Original (Standard)
  '0711719395003': { productId: 'ps5-standard', editionType: 'disc', modelName: 'PS5 Standard Originale' },
  '711719395003': { productId: 'ps5-standard', editionType: 'disc', modelName: 'PS5 Standard Originale' },

  // PS5 Châssis Original (Digitale)
  '0711719395102': { productId: 'ps5-standard', editionType: 'digital', modelName: 'PS5 Digitale Originale' },
  '711719395102': { productId: 'ps5-standard', editionType: 'digital', modelName: 'PS5 Digitale Originale' }
};

export class AwinProductFeedConnector {
  private merchantId: string;
  private merchantName: string;
  private feedUrlEnvVar: string;
  private apiKeyEnvVar: string;

  constructor(options: {
    merchantId: string;
    merchantName: string;
    feedUrlEnvVar: string;
    apiKeyEnvVar: string;
  }) {
    this.merchantId = options.merchantId;
    this.merchantName = options.merchantName;
    this.feedUrlEnvVar = options.feedUrlEnvVar;
    this.apiKeyEnvVar = options.apiKeyEnvVar;
  }

  /**
   * Vérifie si les identifiants de production sont configurés
   */
  public isConfigured(): boolean {
    const feedUrl = process.env[this.feedUrlEnvVar];
    return Boolean(feedUrl && feedUrl.trim().length > 0 && !feedUrl.includes('VOTRE_'));
  }

  /**
   * Identifie un produit à partir de son code EAN ou de son titre
   */
  public matchPs5Product(record: AwinRawRecord): { productId: string; editionType: 'digital' | 'disc'; modelName: string } | null {
    const rawEan = (record.ean || record.upc || '').trim().replace(/[^0-9]/g, '');
    if (rawEan && OFFICIAL_PS5_EAN_MAP[rawEan]) {
      return OFFICIAL_PS5_EAN_MAP[rawEan];
    }

    const title = (record.product_name || '').toLowerCase();
    if (!title.includes('ps5') && !title.includes('playstation 5')) {
      return null;
    }

    // Exclure les accessoires qui ne sont pas des consoles
    const isAccessory = title.includes('manette') || 
                        title.includes('dualsense') || 
                        title.includes('casque') || 
                        title.includes('chargeur') || 
                        title.includes('coque') || 
                        title.includes('support') ||
                        title.includes('lecteur de disque seul');
    if (isAccessory) {
      return null;
    }

    if (title.includes('pro')) {
      return { productId: 'ps5-pro', editionType: 'digital', modelName: 'PS5 Pro' };
    }

    if (title.includes('slim')) {
      const isDigital = title.includes('digital') || title.includes('digitale') || title.includes('sans lecteur');
      return {
        productId: 'ps5-slim',
        editionType: isDigital ? 'digital' : 'disc',
        modelName: isDigital ? 'PS5 Slim Digitale' : 'PS5 Slim Standard'
      };
    }

    const isDigital = title.includes('digital') || title.includes('digitale');
    return {
      productId: 'ps5-standard',
      editionType: isDigital ? 'digital' : 'disc',
      modelName: isDigital ? 'PS5 Standard Digitale' : 'PS5 Standard'
    };
  }

  /**
   * Transforme un enregistrement brut Awin en offre standardisée TRACKO
   */
  public normalizeAwinRecord(record: AwinRawRecord, matched: { productId: string; editionType: 'digital' | 'disc' }): LiveOffer {
    const now = new Date();
    const nowISO = now.toISOString();
    const nowFormatted = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(now);

    const price = typeof record.search_price === 'number' 
      ? record.search_price 
      : parseFloat(String(record.search_price || '0').replace(',', '.'));
    
    const originalPrice = record.retail_price 
      ? (typeof record.retail_price === 'number' ? record.retail_price : parseFloat(String(record.retail_price).replace(',', '.')))
      : price;

    const deliveryPrice = record.delivery_cost
      ? (typeof record.delivery_cost === 'number' ? record.delivery_cost : parseFloat(String(record.delivery_cost).replace(',', '.')))
      : 0;

    const conditionRaw = (record.condition || '').toLowerCase();
    const isRefurbished = conditionRaw.includes('refurb') || conditionRaw.includes('reconditionn') || conditionRaw.includes('occasion');
    const condition: 'new' | 'refurbished' = isRefurbished ? 'refurbished' : 'new';

    const inStock = Boolean(
      record.in_stock === true || 
      record.in_stock === '1' || 
      record.in_stock === 1 || 
      String(record.in_stock).toLowerCase() === 'in stock' ||
      String(record.in_stock).toLowerCase() === 'en stock'
    );

    const qty = record.stock_quantity ? parseInt(String(record.stock_quantity), 10) : undefined;
    const stockStatus = inStock ? (qty && qty < 5 ? 'low_stock' : 'in_stock') : 'out_of_stock';

    const offerId = `awin-${this.merchantId}-${matched.productId}-${matched.editionType}-${condition}-${record.aw_product_id || record.merchant_product_id || 'prod'}`;

    return {
      id: offerId,
      productId: matched.productId,
      editionType: matched.editionType,
      merchantId: this.merchantId,
      merchantName: this.merchantName,
      seller: record.merchant_name || this.merchantName,
      price: price,
      originalPrice: originalPrice,
      currency: record.currency || 'EUR',
      condition: condition,
      conditionLabel: condition === 'refurbished' ? 'Reconditionné Certifié' : 'Neuf scellé',
      inStock: inStock,
      stockStatus: stockStatus,
      stockQuantity: qty,
      url: record.aw_deep_link || '',
      deliveryPrice: deliveryPrice,
      deliveryInfo: record.delivery_time ? `Livraison : ${record.delivery_time}` : (deliveryPrice === 0 ? 'Livraison gratuite' : `Livraison ${deliveryPrice.toFixed(2)}€`),
      totalPrice: price + deliveryPrice,
      isBestPrice: false,
      lastChecked: nowISO,
      lastCheckedFormatted: nowFormatted,
      sourceType: 'automated_feed',
      feedSourceUrl: `AWIN_FEED [${this.merchantId}]`,
    };
  }

  /**
   * Traite une liste de données Awin (JSON/CSV déjà parsé)
   * N'effectue aucun appel réseau si les variables d'environnement ne sont pas définies
   */
  public async syncRecords(records: AwinRawRecord[]): Promise<{ success: boolean; offersUpdated: number; message: string }> {
    const startTime = new Date();
    const nowISO = startTime.toISOString();
    const nowFormatted = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(startTime);

    let offersUpdated = 0;

    for (const record of records) {
      const matched = this.matchPs5Product(record);
      if (!matched) continue;

      const offer = this.normalizeAwinRecord(record, matched);
      if (offer.price > 0 && offer.url) {
        db.upsertOffer(offer);
        offersUpdated++;
      }
    }

    const log: ConnectorExecutionLog = {
      timestamp: nowISO,
      merchantId: this.merchantId,
      itemsProcessed: records.length,
      offersUpdated,
      historyEntriesAdded: offersUpdated,
      status: 'success',
      message: `Awin [${this.merchantName}] : ${offersUpdated} offres réelles synchronisées (${nowFormatted})`,
    };
    db.addLog(log);

    return {
      success: true,
      offersUpdated,
      message: log.message,
    };
  }

  /**
   * Point d'entrée principal pour la synchronisation
   * En mode DEMO : signale de façon transparente que le flux est en attente d'identifiants
   */
  public async fetchAndSync(): Promise<{ success: boolean; isConfigured: boolean; message: string }> {
    if (!this.isConfigured()) {
      return {
        success: true,
        isConfigured: false,
        message: `Connecteur Awin (${this.merchantName}) en attente de configuration. Variable requise : ${this.feedUrlEnvVar}`,
      };
    }

    // Le code de téléchargement HTTP sera activé uniquement lorsque l'URL de flux réelle sera injectée
    return {
      success: true,
      isConfigured: true,
      message: `Connecteur Awin (${this.merchantName}) configuré et prêt pour l'exécution réseau.`,
    };
  }
}

// Instances prêtes pour Fnac et Cdiscount via Awin
export const awinFnacConnector = new AwinProductFeedConnector({
  merchantId: 'fnac-awin',
  merchantName: 'Fnac (Officiel Awin)',
  feedUrlEnvVar: 'AWIN_FNAC_FEED_URL',
  apiKeyEnvVar: 'AWIN_API_TOKEN',
});

export const awinCdiscountConnector = new AwinProductFeedConnector({
  merchantId: 'cdiscount-awin',
  merchantName: 'Cdiscount (Officiel Awin)',
  feedUrlEnvVar: 'AWIN_CDISCOUNT_FEED_URL',
  apiKeyEnvVar: 'AWIN_API_TOKEN',
});
