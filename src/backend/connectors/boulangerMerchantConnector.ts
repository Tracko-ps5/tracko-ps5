import { db } from '../db';
import { LiveOffer, ConnectorExecutionLog } from '../types';
import fs from 'fs';
import path from 'path';

interface RawFeedItem {
  sku: string;
  ean: string;
  title: string;
  category: string;
  brand: string;
  modelIdentifier?: string;
  editionType?: 'digital' | 'disc';
  price: number;
  originalPrice?: number;
  currency: string;
  inStock: boolean;
  stockQuantity?: number;
  condition?: string;
  merchantSeller?: string;
  deliveryPrice?: number;
  deliveryType?: string;
  productUrl: string;
  imageUrl?: string;
}

interface RawFeedResponse {
  lastUpdated: string;
  source: string;
  merchant: {
    id: string;
    name: string;
    website: string;
  };
  items: RawFeedItem[];
}

export class BoulangerMerchantConnector {
  private merchantId: string = 'boulanger-pilot';
  private merchantName: string = 'Boulanger (Flux Pilote)';
  private feedUrl: string = '/boulanger-feed.json';

  constructor(customFeedUrl?: string) {
    if (customFeedUrl) {
      this.feedUrl = customFeedUrl;
    }
  }

  private matchProduct(item: RawFeedItem): { productId: string; editionType: 'digital' | 'disc' } | null {
    if (item.modelIdentifier && item.editionType) {
      return { productId: item.modelIdentifier, editionType: item.editionType };
    }

    const titleLower = item.title.toLowerCase();

    if (titleLower.includes('pro')) {
      return { productId: 'ps5-pro', editionType: 'digital' };
    }

    if (titleLower.includes('slim')) {
      const isDigital = titleLower.includes('digital') || titleLower.includes('numérique') || titleLower.includes('sans lecteur');
      return {
        productId: 'ps5-slim',
        editionType: isDigital ? 'digital' : 'disc'
      };
    }

    if (titleLower.includes('ps5') || titleLower.includes('playstation 5')) {
      const isDigital = titleLower.includes('digital') || titleLower.includes('numérique');
      return {
        productId: 'ps5-standard',
        editionType: isDigital ? 'digital' : 'disc'
      };
    }

    return null;
  }

  public async fetchAndSync(): Promise<{ success: boolean; itemsProcessed: number; offersUpdated: number; message: string }> {
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

    try {
      let rawData: RawFeedResponse;

      const localFilePath = path.join(process.cwd(), 'public', 'boulanger-feed.json');
      if (fs.existsSync(localFilePath)) {
        const fileContent = fs.readFileSync(localFilePath, 'utf-8');
        rawData = JSON.parse(fileContent);
      } else {
        throw new Error(`Flux Boulanger introuvable : ${localFilePath}`);
      }

      if (!rawData || !Array.isArray(rawData.items)) {
        throw new Error('Format de flux Boulanger invalide : items[] manquant');
      }

      let offersUpdated = 0;

      for (const item of rawData.items) {
        const match = this.matchProduct(item);
        if (!match) continue;

        const condition = (item.condition === 'refurbished' || item.condition === 'used') ? 'refurbished' : 'new';
        const offerId = `${this.merchantId}-${match.productId}-${match.editionType}-${condition}`;

        const offer: LiveOffer = {
          id: offerId,
          productId: match.productId,
          editionType: match.editionType,
          merchantId: this.merchantId,
          merchantName: this.merchantName,
          seller: item.merchantSeller || 'Boulanger Officiel',
          price: Number(item.price),
          originalPrice: Number(item.originalPrice || item.price),
          currency: item.currency || 'EUR',
          condition: condition,
          conditionLabel: condition === 'refurbished'
            ? 'Reconditionné Certifié Boulanger (Garantie 2 ans)'
            : 'Neuf scellé en boîte d\'origine',
          inStock: Boolean(item.inStock),
          stockStatus: item.inStock ? ((item.stockQuantity && item.stockQuantity < 5) ? 'low_stock' : 'in_stock') : 'out_of_stock',
          stockQuantity: item.stockQuantity,
          url: item.productUrl,
          deliveryPrice: Number(item.deliveryPrice || 0),
          deliveryInfo: item.deliveryType || 'Retrait magasin 1h ou Livraison standard',
          totalPrice: Number(item.price) + Number(item.deliveryPrice || 0),
          isBestPrice: false,
          lastChecked: nowISO,
          lastCheckedFormatted: nowFormatted,
          sourceType: 'automated_feed',
          feedSourceUrl: this.feedUrl,
        };

        db.upsertOffer(offer);
        offersUpdated++;
      }

      const log: ConnectorExecutionLog = {
        timestamp: nowISO,
        merchantId: this.merchantId,
        itemsProcessed: rawData.items.length,
        offersUpdated: offersUpdated,
        historyEntriesAdded: offersUpdated,
        status: 'success',
        message: `Boulanger : ${offersUpdated} offres synchronisées avec succès (${nowFormatted})`,
      };
      db.addLog(log);

      return {
        success: true,
        itemsProcessed: rawData.items.length,
        offersUpdated,
        message: log.message,
      };

    } catch (err: any) {
      const errorMsg = err?.message || 'Erreur inconnue connecteur Boulanger';
      const log: ConnectorExecutionLog = {
        timestamp: nowISO,
        merchantId: this.merchantId,
        itemsProcessed: 0,
        offersUpdated: 0,
        historyEntriesAdded: 0,
        status: 'error',
        message: `Échec connecteur Boulanger : ${errorMsg}`,
      };
      db.addLog(log);

      return {
        success: false,
        itemsProcessed: 0,
        offersUpdated: 0,
        message: errorMsg,
      };
    }
  }
}

export const boulangerConnector = new BoulangerMerchantConnector();
