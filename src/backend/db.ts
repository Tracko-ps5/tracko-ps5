import fs from 'fs';
import path from 'path';
import { Product, Merchant, LiveOffer, PriceHistoryEntry, ConnectorExecutionLog, BackendPriceAlert } from './types';

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
  { id: 'fnac-pilot', name: 'Fnac (Flux Pilote)', logo: '🟡', website: 'https://www.fnac.com', isOfficialFeed: true },
  { id: 'boulanger-pilot', name: 'Boulanger (Flux Pilote)', logo: '🟠', website: 'https://www.boulanger.com', isOfficialFeed: true },
  { id: 'cdiscount-pilot', name: 'Cdiscount (Flux Pilote)', logo: '📦', website: 'https://www.cdiscount.com', isOfficialFeed: true },
  { id: 'amazon', name: 'Amazon', logo: '🛒', website: 'https://www.amazon.fr', isOfficialFeed: false },
  { id: 'cdiscount', name: 'Cdiscount', logo: '📦', website: 'https://www.cdiscount.com', isOfficialFeed: false },
  { id: 'boulanger', name: 'Boulanger', logo: '🟠', website: 'https://www.boulanger.com', isOfficialFeed: false },
  { id: 'leclerc', name: 'E.Leclerc', logo: '🔵', website: 'https://www.e.leclerc', isOfficialFeed: false },
  { id: 'micromania', name: 'Micromania', logo: '🎮', website: 'https://www.micromania.fr', isOfficialFeed: false },
  { id: 'sony-direct', name: 'PlayStation Direct', logo: '🎮', website: 'https://direct.playstation.com', isOfficialFeed: false },
  { id: 'backmarket', name: 'Back Market', logo: '♻️', website: 'https://www.backmarket.fr', isOfficialFeed: false }
];

interface PersistedData {
  offers: LiveOffer[];
  priceHistory: PriceHistoryEntry[];
  priceAlerts: BackendPriceAlert[];
  savedAt: string;
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

  constructor() {
    INITIAL_PRODUCTS.forEach(p => this.products.set(p.id, p));
    INITIAL_MERCHANTS.forEach(m => this.merchants.set(m.id, m));
    
    // Chemin de persistance sur disque
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (err) {
        console.error('[TRACKO DB] Erreur création dossier data:', err);
      }
    }
    this.storageFilePath = path.join(dataDir, 'tracko_database.json');
    this.loadFromDisk();
  }

  /**
   * Charge les données sauvegardées sur disque pour survivre aux redémarrages
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
        console.log(`[TRACKO DB] 💾 Données persistantes chargées (${this.priceAlerts.size} alertes, ${this.offers.size} offres, ${this.priceHistory.length} historiques).`);
      }
    } catch (err) {
      console.error('[TRACKO DB] Erreur chargement fichier persistant:', err);
    }
  }

  /**
   * Sauvegarde synchrone et atomique sur disque
   */
  private saveToDisk(): void {
    if (this.isSaveDisabledForTests) return;

    try {
      const dataToSave: PersistedData = {
        offers: Array.from(this.offers.values()),
        priceHistory: this.priceHistory,
        priceAlerts: Array.from(this.priceAlerts.values()),
        savedAt: new Date().toISOString(),
      };
      fs.writeFileSync(this.storageFilePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('[TRACKO DB] Erreur écriture persistance disque:', err);
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
    return Array.from(this.offers.values());
  }

  public getOffersForProduct(productId: string, editionType?: 'digital' | 'disc'): LiveOffer[] {
    return Array.from(this.offers.values()).filter(offer => {
      const matchProduct = offer.productId === productId;
      const matchEdition = editionType ? offer.editionType === editionType : true;
      return matchProduct && matchEdition;
    });
  }

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

    this.saveToDisk();
  }

  // --- PRICE HISTORY ---
  public getHistory(productId: string, editionType: 'digital' | 'disc'): PriceHistoryEntry[] {
    return this.priceHistory.filter(
      h => h.productId === productId && h.editionType === editionType
    );
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
    this.saveToDisk();
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
      this.saveToDisk();
    }
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

// Instance globale du magasin de données (Singleton avec persistance disque)
export const db = new DatabaseStore();
