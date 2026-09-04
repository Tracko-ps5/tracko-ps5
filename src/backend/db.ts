import fs from 'fs';
import path from 'path';
import { Product, Merchant, LiveOffer, PriceHistoryEntry, ConnectorExecutionLog, BackendPriceAlert } from './types';
import { getStore } from '@netlify/blobs';

// Produits de base suivis par TRACKO
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'ps5-slim',
    name: 'PlayStation®5 Slim',
    shortName: 'PS5 Slim',
    model: 'Slim',
    version: 'both',
    storage: 'SSD 1 To',
    image: '/images/ps5-slim.jpg',
    msrp: 549.99,
  },
  {
    id: 'ps5-pro',
    name: 'PlayStation®5 Pro',
    shortName: 'PS5 Pro',
    model: 'Pro',
    version: 'digital',
    storage: 'SSD 2 To',
    image: '/images/ps5-pro.jpg',
    msrp: 799.99,
  },
  {
    id: 'ps5-standard',
    name: 'PlayStation®5 (Originale)',
    shortName: 'PS5 Classique',
    model: 'Original',
    version: 'both',
    storage: 'SSD 825 Go',
    image: '/images/ps5-standard.jpg',
    msrp: 549.99,
  }
];

const INITIAL_MERCHANTS: Merchant[] = [
  { id: 'amazon', name: 'Amazon', logo: '🛒', website: 'https://www.amazon.fr', isOfficialFeed: false },
  { id: 'fnac', name: 'Fnac', logo: '🟡', website: 'https://www.fnac.com', isOfficialFeed: false },
  { id: 'cdiscount', name: 'Cdiscount', logo: '📦', website: 'https://www.cdiscount.com', isOfficialFeed: false },
  { id: 'boulanger', name: 'Boulanger', logo: '🟠', website: 'https://www.boulanger.com', isOfficialFeed: false },
  { id: 'leclerc', name: 'E.Leclerc', logo: '🔵', website: 'https://www.e.leclerc', isOfficialFeed: false },
  { id: 'micromania', name: 'Micromania', logo: '🎮', website: 'https://www.micromania.fr', isOfficialFeed: false },
  { id: 'sony-direct', name: 'PlayStation Direct', logo: '🎮', website: 'https://direct.playstation.com', isOfficialFeed: false },
  { id: 'backmarket', name: 'Back Market', logo: '♻️', website: 'https://www.backmarket.fr', isOfficialFeed: false },
];

export interface PersistedData {
  offers: LiveOffer[];
  priceHistory: PriceHistoryEntry[];
  priceAlerts: BackendPriceAlert[];
  savedAt: string;
}

export interface ManualOfferInput {
  productId: string;
  editionType: 'digital' | 'disc';
  merchantId: string;
  merchantName: string;
  price: number;
  originalPrice?: number;
  condition: 'new' | 'refurbished';
  conditionLabel?: string;
  inStock: boolean;
  url: string;
  deliveryPrice?: number;
  deliveryInfo?: string;
  notes?: string;
}

class DatabaseStore {
  private products: Map<string, Product> = new Map();
  private merchants: Map<string, Merchant> = new Map();
  private offers: Map<string, LiveOffer> = new Map();
  private priceHistory: PriceHistoryEntry[] = [];
  private logs: ConnectorExecutionLog[] = [];
  private priceAlerts: Map<string, BackendPriceAlert> = new Map();
  private storageFilePath: string;
  private isSaveDisabledForTests: boolean = false;
  private isInitializedFromBlob: boolean = false;

  constructor() {
    INITIAL_PRODUCTS.forEach(p => this.products.set(p.id, p));
    INITIAL_MERCHANTS.forEach(m => this.merchants.set(m.id, m));
    
    // Chemin de persistance sur disque local
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (err) {
        // Mode read-only serverless
      }
    }
    this.storageFilePath = path.join(dataDir, 'tracko_database.json');
    this.loadFromDisk();
  }

  /**
   * Initialise et synchronise depuis Netlify Blobs si disponible
   */
  public async ensureLoadedFromCloud(): Promise<void> {
    if (this.isInitializedFromBlob) return;

    try {
      // Tenter de charger depuis Netlify Blobs
      const store = getStore('tracko-database');
      const blobData = await store.get('main', { type: 'json' }) as PersistedData | null;
      if (blobData && typeof blobData === 'object') {
        if (Array.isArray(blobData.offers)) {
          blobData.offers.forEach(o => this.offers.set(o.id, o));
        }
        if (Array.isArray(blobData.priceHistory)) {
          this.priceHistory = blobData.priceHistory;
        }
        if (Array.isArray(blobData.priceAlerts)) {
          blobData.priceAlerts.forEach(a => this.priceAlerts.set(a.id, a));
        }
        this.isInitializedFromBlob = true;
        console.log(`[TRACKO DB] ☁️ Synchronisé depuis Netlify Blobs (${this.offers.size} offres, ${this.priceHistory.length} historiques).`);
      }
    } catch (err) {
      // Hors environnement Netlify ou blob non encore initialisé -> fallback local
    }
  }

  /**
   * Sauvegarde sur disque et sur Netlify Blobs
   */
  public async persistToStorage(): Promise<void> {
    if (this.isSaveDisabledForTests) return;

    const dataToSave: PersistedData = {
      offers: Array.from(this.offers.values()),
      priceHistory: this.priceHistory,
      priceAlerts: Array.from(this.priceAlerts.values()),
      savedAt: new Date().toISOString(),
    };

    // 1. Sauvegarde sur disque local (dev / container)
    try {
      fs.writeFileSync(this.storageFilePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      // Ignorer si filesystem read-only
    }

    // 2. Sauvegarde sur Netlify Blobs (serverless cloud persistant)
    try {
      const store = getStore('tracko-database');
      await store.setJSON('main', dataToSave);
      console.log('[TRACKO DB] ☁️ Sauvegardé avec succès dans Netlify Blobs.');
    } catch (err) {
      // Non fatal en local
    }
  }

  /**
   * Charge les données sauvegardées sur disque pour survivre aux redémarrages locaux
   */
  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.storageFilePath)) {
        const fileContent = fs.readFileSync(this.storageFilePath, 'utf-8');
        const parsed: PersistedData = JSON.parse(fileContent);
        
        if (Array.isArray(parsed.offers)) {
          parsed.offers.forEach(o => this.offers.set(o.id, o));
        }
        if (Array.isArray(parsed.priceHistory)) {
          this.priceHistory = parsed.priceHistory;
        }
        if (Array.isArray(parsed.priceAlerts)) {
          parsed.priceAlerts.forEach(a => this.priceAlerts.set(a.id, a));
        }
      }
    } catch (err) {
      console.error('[TRACKO DB] Erreur chargement fichier persistant:', err);
    }
  }

  // --- PRODUCTS ---
  public getProducts(): Product[] {
    return Array.from(this.products.values());
  }

  public getProduct(id: string): Product | undefined {
    return this.products.get(id);
  }

  // --- MERCHANTS ---
  public getMerchants(): Merchant[] {
    return Array.from(this.merchants.values());
  }

  // --- OFFERS ---
  public getAllOffers(): LiveOffer[] {
    // Calculer dynamiquement le meilleur prix parmi les offres disponibles en stock
    const offers = Array.from(this.offers.values());
    this.recalculateBestPrices(offers);
    return offers;
  }

  public getOffersForProduct(productId: string, editionType?: 'digital' | 'disc'): LiveOffer[] {
    const offers = Array.from(this.offers.values()).filter(offer => {
      const matchProduct = offer.productId === productId;
      const matchEdition = editionType ? offer.editionType === editionType : true;
      return matchProduct && matchEdition;
    });
    this.recalculateBestPrices(offers);
    return offers;
  }

  private recalculateBestPrices(offers: LiveOffer[]): void {
    // Regrouper par (productId, editionType)
    const groups = new Map<string, LiveOffer[]>();
    offers.forEach(o => {
      const key = `${o.productId}-${o.editionType}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(o);
      o.isBestPrice = false; // reset
    });

    groups.forEach(groupOffers => {
      // Le meilleur prix ne s'applique qu'aux offres en stock et neuves de préférence
      const inStockNewOffers = groupOffers.filter(o => o.inStock && o.condition === 'new');
      if (inStockNewOffers.length > 0) {
        let lowestPrice = Infinity;
        inStockNewOffers.forEach(o => {
          if (o.price < lowestPrice) lowestPrice = o.price;
        });
        inStockNewOffers.forEach(o => {
          if (o.price === lowestPrice) o.isBestPrice = true;
        });
      }
    });
  }

  /**
   * Ajoute ou met à jour une offre issue d'un connecteur automatique
   */
  public upsertOffer(offer: LiveOffer): void {
    const existing = this.offers.get(offer.id);
    this.offers.set(offer.id, offer);

    if (!existing || existing.price !== offer.price || existing.inStock !== offer.inStock) {
      const historyEntry: PriceHistoryEntry = {
        id: `${offer.id}-${Date.now()}`,
        productId: offer.productId,
        editionType: offer.editionType,
        merchantId: offer.merchantId,
        merchantName: offer.merchantName,
        price: offer.price,
        condition: offer.condition === 'refurbished' ? 'refurbished' : 'new',
        inStock: offer.inStock,
        checkedAt: offer.lastChecked,
        dateLabel: new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(offer.lastChecked)),
      };
      this.priceHistory.push(historyEntry);
    }

    this.persistToStorage().catch(() => {});
  }

  /**
   * Enregistre une mise à jour manuelle via le Panneau Admin
   * Crée une observation réelle dans l'historique et persiste les données
   */
  public async saveManualOffer(input: ManualOfferInput): Promise<{ offer: LiveOffer; historyAdded: boolean }> {
    const now = new Date();
    const offerId = `${input.merchantId}-${input.productId}-${input.editionType}-${input.condition}`;
    const existing = this.offers.get(offerId);

    const price = parseFloat(Number(input.price).toFixed(2));
    const originalPrice = input.originalPrice ? parseFloat(Number(input.originalPrice).toFixed(2)) : (existing ? existing.originalPrice : price);
    const inStock = Boolean(input.inStock);

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateFormatted = `${day}/${month}/${year} à ${hours}:${minutes}`;

    const updatedOffer: LiveOffer = {
      id: offerId,
      productId: input.productId,
      editionType: input.editionType,
      merchantId: input.merchantId,
      merchantName: input.merchantName,
      seller: input.merchantName,
      price: price,
      originalPrice: originalPrice > price ? originalPrice : price,
      currency: 'EUR',
      condition: input.condition,
      conditionLabel: input.conditionLabel || (input.condition === 'refurbished' ? 'Reconditionné vérifié' : 'Neuf sous blister'),
      inStock: inStock,
      stockStatus: inStock ? 'in_stock' : 'out_of_stock',
      url: input.url,
      deliveryPrice: input.deliveryPrice ?? 0,
      deliveryInfo: input.deliveryInfo || (inStock ? 'Livraison standard' : 'Indisponible'),
      totalPrice: price + (input.deliveryPrice ?? 0),
      isBestPrice: false,
      lastChecked: now.toISOString(),
      lastCheckedFormatted: dateFormatted,
      sourceType: 'manual_verification',
    };

    this.offers.set(offerId, updatedOffer);

    // Enregistrer systématiquement une véritable observation dans l'historique certifié
    // (évite seulement les duplicatas exacts dans un intervalle de 30 secondes)
    let historyAdded = false;
    if (price > 0) {
      const lastSameEntry = [...this.priceHistory]
        .reverse()
        .find(h => h.productId === input.productId && h.editionType === input.editionType && h.merchantId === input.merchantId);

      const isVeryRecentDuplicate = lastSameEntry && 
        lastSameEntry.price === price && 
        lastSameEntry.inStock === inStock &&
        (now.getTime() - new Date(lastSameEntry.checkedAt).getTime() < 30 * 1000);

      if (!isVeryRecentDuplicate) {
        const historyEntry: PriceHistoryEntry = {
          id: `real-obs-${offerId}-${now.getTime()}`,
          productId: input.productId,
          editionType: input.editionType,
          merchantId: input.merchantId,
          merchantName: input.merchantName,
          price: price,
          condition: input.condition,
          inStock: inStock,
          checkedAt: now.toISOString(),
          dateLabel: `${day}/${month} ${hours}:${minutes}`,
        };
        this.priceHistory.push(historyEntry);
        historyAdded = true;
      }
    }

    await this.persistToStorage();
    return { offer: updatedOffer, historyAdded };
  }

  /**
   * Enregistre un lot d'offres manuelles
   */
  public async bulkSaveManualOffers(inputs: ManualOfferInput[]): Promise<{ count: number; historyCount: number }> {
    let historyCount = 0;
    for (const input of inputs) {
      const result = await this.saveManualOffer(input);
      if (result.historyAdded) historyCount++;
    }
    return { count: inputs.length, historyCount };
  }

  /**
   * Récupère la dernière observation enregistrée pour chaque combinaison
   * Utile pour la fonction « Copier les prix d'hier »
   */
  public getLastObservations(): Array<{
    productId: string;
    editionType: 'digital' | 'disc';
    merchantId: string;
    merchantName: string;
    price: number;
    originalPrice?: number;
    condition: 'new' | 'refurbished';
    inStock: boolean;
    url: string;
    lastChecked: string;
  }> {
    const results: Array<any> = [];
    this.offers.forEach(o => {
      results.push({
        productId: o.productId,
        editionType: o.editionType,
        merchantId: o.merchantId,
        merchantName: o.merchantName,
        price: o.price,
        originalPrice: o.originalPrice,
        condition: o.condition,
        inStock: o.inStock,
        url: o.url,
        lastChecked: o.lastChecked,
      });
    });
    return results;
  }

  // --- PRICE HISTORY ---
  public getHistory(productId: string, editionType: 'digital' | 'disc'): PriceHistoryEntry[] {
    return this.priceHistory.filter(
      h => h.productId === productId && h.editionType === editionType
    );
  }

  public getAllHistory(): PriceHistoryEntry[] {
    return this.priceHistory;
  }

  // --- BACKUP & RESTORE ---
  public exportBackup(): PersistedData {
    return {
      offers: Array.from(this.offers.values()),
      priceHistory: this.priceHistory,
      priceAlerts: Array.from(this.priceAlerts.values()),
      savedAt: new Date().toISOString(),
    };
  }

  public async importBackup(data: Partial<PersistedData>): Promise<boolean> {
    if (Array.isArray(data.offers)) {
      this.offers.clear();
      data.offers.forEach(o => this.offers.set(o.id, o));
    }
    if (Array.isArray(data.priceHistory)) {
      this.priceHistory = data.priceHistory;
    }
    if (Array.isArray(data.priceAlerts)) {
      this.priceAlerts.clear();
      data.priceAlerts.forEach(a => this.priceAlerts.set(a.id, a));
    }
    await this.persistToStorage();
    return true;
  }

  // --- LOGS ---
  public addLog(log: ConnectorExecutionLog): void {
    this.logs.unshift(log);
    if (this.logs.length > 50) this.logs.pop();
  }

  public getLogs(): ConnectorExecutionLog[] {
    return this.logs;
  }

  // --- PRICE ALERTS ---
  public saveAlert(alert: BackendPriceAlert): void {
    this.priceAlerts.set(alert.id, alert);
    this.persistToStorage().catch(() => {});
  }

  public getAlert(id: string): BackendPriceAlert | undefined {
    return this.priceAlerts.get(id);
  }

  public getAllAlerts(): BackendPriceAlert[] {
    return Array.from(this.priceAlerts.values());
  }

  public getActiveAlerts(): BackendPriceAlert[] {
    return Array.from(this.priceAlerts.values()).filter(a => a.status === 'active');
  }

  public updateAlertStatus(id: string, updates: Partial<BackendPriceAlert>): void {
    const alert = this.priceAlerts.get(id);
    if (alert) {
      this.priceAlerts.set(id, { ...alert, ...updates });
      this.persistToStorage().catch(() => {});
    }
  }

  public deleteAlert(id: string): boolean {
    const deleted = this.priceAlerts.delete(id);
    if (deleted) {
      this.persistToStorage().catch(() => {});
    }
    return deleted;
  }

  public clearAlertsForTesting(): void {
    this.priceAlerts.clear();
  }

  public clearOffersForTesting(): void {
    this.offers.clear();
  }

  public setSaveDisabledForTests(disabled: boolean): void {
    this.isSaveDisabledForTests = disabled;
  }
}

// Instance globale du magasin de données (Singleton avec persistance Netlify Blobs & disque)
export const db = new DatabaseStore();

