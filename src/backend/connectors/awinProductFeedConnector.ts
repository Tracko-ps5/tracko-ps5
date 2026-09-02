import { db } from '../db';
import { LiveOffer, ConnectorExecutionLog } from '../types';

/**
 * Interface normalisée pour les enregistrements de flux catalogue Awin / Marchands (CSV / JSON / XML)
 */
export interface AwinRawRecord {
  aw_product_id?: string;
  merchant_product_id?: string;
  product_name?: string;
  description?: string;
  search_price?: string | number;
  retail_price?: string | number;
  price?: string | number;
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
  product_url?: string;
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

export type ConnectorStatus = 'NOT_CONFIGURED' | 'FETCH_ERROR' | 'PARSE_ERROR' | 'EMPTY' | 'CONNECTED';

export interface ConnectorFetchResult {
  status: ConnectorStatus;
  httpStatus?: number;
  httpStatusText?: string;
  sourceUrl?: string;
  formatDetected?: 'json' | 'csv' | 'xml' | 'unknown';
  itemsTotal: number;
  ps5Matched: number;
  offersUpdated: number;
  firstRealOffer?: {
    merchant: string;
    product: string;
    price: number;
    url: string;
    inStock: boolean;
  };
  message: string;
}

export class AwinProductFeedConnector {
  private merchantId: string;
  private merchantName: string;
  private feedUrlEnvVar: string;
  private apiKeyEnvVar: string;
  private customStaticFeedUrl?: string;

  constructor(options: {
    merchantId: string;
    merchantName: string;
    feedUrlEnvVar: string;
    apiKeyEnvVar: string;
    customStaticFeedUrl?: string;
  }) {
    this.merchantId = options.merchantId;
    this.merchantName = options.merchantName;
    this.feedUrlEnvVar = options.feedUrlEnvVar;
    this.apiKeyEnvVar = options.apiKeyEnvVar;
    this.customStaticFeedUrl = options.customStaticFeedUrl;
  }

  /**
   * Retourne l'URL réelle du flux configurée dans les variables d'environnement
   */
  public getEffectiveFeedUrl(): string | null {
    const envUrl = process.env[this.feedUrlEnvVar];
    if (envUrl && envUrl.trim().length > 0 && !envUrl.includes('VOTRE_')) {
      return envUrl.trim();
    }
    if (this.customStaticFeedUrl && this.customStaticFeedUrl.startsWith('http')) {
      return this.customStaticFeedUrl;
    }
    return null;
  }

  /**
   * Vérifie si les identifiants ou URLs de production sont configurés
   */
  public isConfigured(): boolean {
    return this.getEffectiveFeedUrl() !== null;
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
                        title.includes('lecteur de disque seul') ||
                        title.includes('cable') ||
                        title.includes('volant');
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

    const rawPrice = record.search_price ?? record.price ?? 0;
    const price = typeof rawPrice === 'number' 
      ? rawPrice 
      : parseFloat(String(rawPrice || '0').replace(',', '.').replace(/[^0-9.]/g, ''));
    
    const rawRetail = record.retail_price ?? price;
    const originalPrice = typeof rawRetail === 'number' 
      ? rawRetail 
      : parseFloat(String(rawRetail || '0').replace(',', '.').replace(/[^0-9.]/g, ''));

    const rawDelivery = record.delivery_cost ?? 0;
    const deliveryPrice = typeof rawDelivery === 'number'
      ? rawDelivery
      : parseFloat(String(rawDelivery || '0').replace(',', '.').replace(/[^0-9.]/g, ''));

    const conditionRaw = (record.condition || '').toLowerCase();
    const isRefurbished = conditionRaw.includes('refurb') || conditionRaw.includes('reconditionn') || conditionRaw.includes('occasion');
    const condition: 'new' | 'refurbished' = isRefurbished ? 'refurbished' : 'new';

    const inStock = Boolean(
      record.in_stock === true || 
      record.in_stock === '1' || 
      record.in_stock === 1 || 
      String(record.in_stock).toLowerCase() === 'in stock' ||
      String(record.in_stock).toLowerCase() === 'en stock' ||
      String(record.in_stock).toLowerCase() === 'true'
    );

    const qty = record.stock_quantity ? parseInt(String(record.stock_quantity), 10) : undefined;
    const stockStatus = inStock ? (qty && qty < 5 ? 'low_stock' : 'in_stock') : 'out_of_stock';

    const deepLink = record.aw_deep_link || record.product_url || '';
    const offerId = `awin-${this.merchantId}-${matched.productId}-${matched.editionType}-${condition}-${record.aw_product_id || record.merchant_product_id || 'prod'}`;

    return {
      id: offerId,
      productId: matched.productId,
      editionType: matched.editionType,
      merchantId: this.merchantId,
      merchantName: this.merchantName,
      seller: record.merchant_name || this.merchantName,
      price: price,
      originalPrice: originalPrice > 0 ? originalPrice : price,
      currency: record.currency || 'EUR',
      condition: condition,
      conditionLabel: condition === 'refurbished' ? 'Reconditionné Certifié' : 'Neuf scellé en boîte',
      inStock: inStock,
      stockStatus: stockStatus,
      stockQuantity: qty,
      url: deepLink,
      deliveryPrice: isNaN(deliveryPrice) ? 0 : deliveryPrice,
      deliveryInfo: record.delivery_time 
        ? `Livraison : ${record.delivery_time}` 
        : ((deliveryPrice === 0 || isNaN(deliveryPrice)) ? 'Livraison gratuite' : `Livraison ${deliveryPrice.toFixed(2)}€`),
      totalPrice: price + (isNaN(deliveryPrice) ? 0 : deliveryPrice),
      isBestPrice: false,
      lastChecked: nowISO,
      lastCheckedFormatted: nowFormatted,
      sourceType: 'automated_feed',
      feedSourceUrl: `AWIN_FEED [${this.merchantId}]`,
    };
  }

  /**
   * Analyseur CSV tolérant avec support des guillemets et séparateurs multiples
   */
  public parseCsv(content: string): AwinRawRecord[] {
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    // Détecter le séparateur (, ; \t |)
    const firstLine = lines[0];
    const separators = [',', ';', '\t', '|'];
    let bestSep = ',';
    let maxCount = 0;
    for (const sep of separators) {
      const count = firstLine.split(sep).length;
      if (count > maxCount) {
        maxCount = count;
        bestSep = sep;
      }
    }

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === bestSep && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, ''));
      return result;
    };

    const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_'));
    const records: AwinRawRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;

      const record: any = {};
      headers.forEach((header, index) => {
        const val = values[index] ?? '';
        if (header.includes('product_name') || header === 'title' || header === 'name') record.product_name = val;
        else if (header.includes('search_price') || header === 'price') record.search_price = val;
        else if (header.includes('retail_price') || header === 'msrp') record.retail_price = val;
        else if (header.includes('deep_link') || header.includes('aw_link') || header === 'url' || header === 'link') record.aw_deep_link = val;
        else if (header.includes('ean') || header.includes('barcode')) record.ean = val;
        else if (header.includes('merchant_name') || header === 'brand') record.merchant_name = val;
        else if (header.includes('in_stock') || header === 'stock') record.in_stock = val;
        else if (header.includes('delivery_cost') || header.includes('shipping')) record.delivery_cost = val;
        else if (header.includes('condition')) record.condition = val;
        else record[header] = val;
      });

      if (record.product_name || record.ean) {
        records.push(record as AwinRawRecord);
      }
    }

    return records;
  }

  /**
   * Analyseur XML simplifié pour flux produits (<product> / <item>)
   */
  public parseXml(content: string): AwinRawRecord[] {
    const records: AwinRawRecord[] = [];
    const itemRegex = /<(?:product|item|entry)[\s>]([\s\S]*?)<\/(?:product|item|entry)>/gi;
    let match: RegExpExecArray | null;

    const extractTag = (xml: string, tag: string): string => {
      const tagRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
      const m = tagRegex.exec(xml);
      if (!m) return '';
      return m[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
    };

    while ((match = itemRegex.exec(content)) !== null) {
      const block = match[1];
      const record: AwinRawRecord = {
        aw_product_id: extractTag(block, 'aw_product_id') || extractTag(block, 'id') || extractTag(block, 'g:id'),
        product_name: extractTag(block, 'product_name') || extractTag(block, 'title') || extractTag(block, 'name') || extractTag(block, 'g:title'),
        description: extractTag(block, 'description') || extractTag(block, 'g:description'),
        search_price: extractTag(block, 'search_price') || extractTag(block, 'price') || extractTag(block, 'g:price'),
        retail_price: extractTag(block, 'retail_price') || extractTag(block, 'g:sale_price'),
        currency: extractTag(block, 'currency') || 'EUR',
        merchant_name: extractTag(block, 'merchant_name') || extractTag(block, 'brand') || extractTag(block, 'g:brand'),
        in_stock: extractTag(block, 'in_stock') || extractTag(block, 'g:availability') || extractTag(block, 'availability'),
        ean: extractTag(block, 'ean') || extractTag(block, 'g:gtin') || extractTag(block, 'upc'),
        aw_deep_link: extractTag(block, 'aw_deep_link') || extractTag(block, 'link') || extractTag(block, 'g:link') || extractTag(block, 'url'),
        delivery_cost: extractTag(block, 'delivery_cost') || extractTag(block, 'g:shipping_price'),
        condition: extractTag(block, 'condition') || extractTag(block, 'g:condition'),
      };

      if (record.product_name || record.ean) {
        records.push(record);
      }
    }

    return records;
  }

  /**
   * Télécharge réellement le flux via HTTP, le parse et le synchronise dans la base de données TRACKO
   */
  public async fetchAndSync(): Promise<ConnectorFetchResult> {
    const feedUrl = this.getEffectiveFeedUrl();
    const apiKey = process.env[this.apiKeyEnvVar];

    if (!feedUrl) {
      return {
        status: 'NOT_CONFIGURED',
        itemsTotal: 0,
        ps5Matched: 0,
        offersUpdated: 0,
        message: `Source non configurée. Variable requise : ${this.feedUrlEnvVar}`
      };
    }

    const headers: Record<string, string> = {
      'User-Agent': 'TRACKO-Price-Tracker/1.0 (+https://tracko.fr)',
      'Accept': 'application/json, text/csv, application/xml, text/xml, */*'
    };

    if (apiKey && apiKey.trim().length > 0 && !apiKey.includes('VOTRE_')) {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    }

    let response: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

      response = await fetch(feedUrl, {
        method: 'GET',
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchErr: any) {
      const errorMsg = fetchErr?.name === 'AbortError' ? 'Délai d\'attente dépassé (20s)' : (fetchErr?.message || 'Erreur réseau');
      
      db.addLog({
        timestamp: new Date().toISOString(),
        merchantId: this.merchantId,
        itemsProcessed: 0,
        offersUpdated: 0,
        historyEntriesAdded: 0,
        status: 'error',
        message: `[FETCH_ERROR] Impossible de joindre l'URL : ${errorMsg}`,
      });

      return {
        status: 'FETCH_ERROR',
        sourceUrl: feedUrl,
        itemsTotal: 0,
        ps5Matched: 0,
        offersUpdated: 0,
        message: `Erreur HTTP lors de la requête : ${errorMsg}`
      };
    }

    if (!response.ok) {
      db.addLog({
        timestamp: new Date().toISOString(),
        merchantId: this.merchantId,
        itemsProcessed: 0,
        offersUpdated: 0,
        historyEntriesAdded: 0,
        status: 'error',
        message: `[HTTP ${response.status}] ${response.statusText} sur ${feedUrl}`,
      });

      return {
        status: 'FETCH_ERROR',
        httpStatus: response.status,
        httpStatusText: response.statusText,
        sourceUrl: feedUrl,
        itemsTotal: 0,
        ps5Matched: 0,
        offersUpdated: 0,
        message: `Le serveur distant a répondu avec une erreur HTTP ${response.status} (${response.statusText}).`
      };
    }

    const rawText = await response.text();
    if (!rawText || rawText.trim().length === 0) {
      return {
        status: 'EMPTY',
        httpStatus: response.status,
        httpStatusText: response.statusText,
        sourceUrl: feedUrl,
        itemsTotal: 0,
        ps5Matched: 0,
        offersUpdated: 0,
        message: 'Le flux téléchargé est vide (0 octet).'
      };
    }

    // Détection du format
    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    let formatDetected: 'json' | 'csv' | 'xml' | 'unknown' = 'unknown';
    let records: AwinRawRecord[] = [];

    try {
      if (contentType.includes('json') || rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
        formatDetected = 'json';
        const parsed = JSON.parse(rawText);
        if (Array.isArray(parsed)) {
          records = parsed;
        } else if (parsed && typeof parsed === 'object') {
          records = parsed.products || parsed.items || parsed.data || parsed.results || [];
        }
      } else if (contentType.includes('xml') || rawText.trim().startsWith('<?xml') || rawText.trim().startsWith('<')) {
        formatDetected = 'xml';
        records = this.parseXml(rawText);
      } else {
        formatDetected = 'csv';
        records = this.parseCsv(rawText);
      }
    } catch (parseErr: any) {
      return {
        status: 'PARSE_ERROR',
        httpStatus: response.status,
        formatDetected,
        sourceUrl: feedUrl,
        itemsTotal: 0,
        ps5Matched: 0,
        offersUpdated: 0,
        message: `Erreur de parsing du format ${formatDetected} : ${parseErr?.message}`
      };
    }

    if (records.length === 0) {
      return {
        status: 'EMPTY',
        httpStatus: response.status,
        formatDetected,
        sourceUrl: feedUrl,
        itemsTotal: 0,
        ps5Matched: 0,
        offersUpdated: 0,
        message: `Flux parsé (${formatDetected}) mais 0 produit trouvé.`
      };
    }

    // Extraction et normalisation des offres PS5
    let ps5Matched = 0;
    let offersUpdated = 0;
    let firstRealOffer: ConnectorFetchResult['firstRealOffer'] = undefined;

    for (const record of records) {
      const matched = this.matchPs5Product(record);
      if (!matched) continue;
      ps5Matched++;

      const offer = this.normalizeAwinRecord(record, matched);
      if (offer.price > 0 && offer.url) {
        db.upsertOffer(offer);
        offersUpdated++;

        if (!firstRealOffer) {
          firstRealOffer = {
            merchant: offer.merchantName,
            product: matched.modelName,
            price: offer.price,
            url: offer.url,
            inStock: offer.inStock,
          };
        }
      }
    }

    const log: ConnectorExecutionLog = {
      timestamp: new Date().toISOString(),
      merchantId: this.merchantId,
      itemsProcessed: records.length,
      offersUpdated,
      historyEntriesAdded: offersUpdated,
      status: offersUpdated > 0 ? 'success' : 'partial',
      message: `[CONNECTED] Flux ${formatDetected.toUpperCase()} téléchargé : ${records.length} produits, ${ps5Matched} PS5, ${offersUpdated} offres enregistrées.`,
    };
    db.addLog(log);

    return {
      status: offersUpdated > 0 ? 'CONNECTED' : (ps5Matched === 0 ? 'EMPTY' : 'CONNECTED'),
      httpStatus: response.status,
      httpStatusText: response.statusText,
      sourceUrl: feedUrl,
      formatDetected,
      itemsTotal: records.length,
      ps5Matched,
      offersUpdated,
      firstRealOffer,
      message: `${offersUpdated} offre(s) PS5 enregistrée(s) avec succès depuis le flux réel.`
    };
  }
}

// Instances prêtes pour Fnac, Cdiscount et flux générique Awin
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

export const awinGenericConnector = new AwinProductFeedConnector({
  merchantId: 'awin-generic',
  merchantName: 'Awin Multi-Marchands',
  feedUrlEnvVar: 'AWIN_PRODUCT_FEED_URL',
  apiKeyEnvVar: 'AWIN_API_TOKEN',
});
