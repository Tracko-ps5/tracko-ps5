/**
 * Structure de données TRACKO pour le comparateur automatisé
 */

export interface Product {
  id: string; // ex: 'ps5-slim', 'ps5-pro', 'ps5-standard'
  name: string;
  shortName: string;
  model: string;
  version: 'digital' | 'disc' | 'both';
  storage: string;
  image: string;
  msrp: number; // Prix conseillé Sony officiel
}

export interface Merchant {
  id: string;
  name: string;
  logo: string;
  website: string;
  isOfficialFeed: boolean;
}

export interface LiveOffer {
  id: string;
  productId: string; // 'ps5-slim' | 'ps5-pro' | 'ps5-standard'
  editionType: 'digital' | 'disc';
  merchantId: string;
  merchantName: string;
  seller: string;
  price: number;
  originalPrice: number;
  currency: string;
  condition: 'new' | 'refurbished' | 'used';
  conditionLabel: string;
  inStock: boolean;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  stockQuantity?: number;
  url: string;
  deliveryPrice: number;
  deliveryInfo: string;
  totalPrice: number;
  isBestPrice: boolean;
  lastChecked: string; // ISO String (ex: 2026-08-31T15:30:00Z)
  lastCheckedFormatted: string; // ex: "31/08/2026 à 15:30"
  sourceType: 'automated_feed' | 'official_api' | 'manual_verification';
  feedSourceUrl?: string;
}

export interface PriceHistoryEntry {
  id: string;
  productId: string;
  editionType: 'digital' | 'disc';
  merchantId: string;
  merchantName: string;
  price: number;
  condition: 'new' | 'refurbished';
  inStock: boolean;
  checkedAt: string; // ISO date
  dateLabel: string; // ex: "31/08" ou "J-1"
}

export interface ConnectorExecutionLog {
  timestamp: string;
  merchantId: string;
  itemsProcessed: number;
  offersUpdated: number;
  historyEntriesAdded: number;
  status: 'success' | 'error' | 'partial';
  message: string;
}

export interface BackendPriceAlert {
  id: string; // ex: 'alt-1788190000000-xyz'
  email: string; // Stocké de façon sécurisée (masqué pour l'extérieur)
  productId: string; // 'ps5-slim' | 'ps5-pro' | 'ps5-standard'
  productName: string;
  editionType: 'digital' | 'disc';
  targetPrice: number;
  currentPriceAtCreation: number;
  status: 'active' | 'triggered' | 'cancelled';
  unsubscribeToken: string; // Token sécurisé et aléatoire pour désinscription en 1 clic
  notificationStatus: 'none' | 'pending' | 'sent' | 'failed';
  retryCount: number; // Compteur de tentatives (max 3)
  createdAt: string; // ISO String
  lastCheckedAt?: string; // ISO String
  triggeredAt?: string; // ISO String
  notifiedAt?: string; // ISO String
  notificationDetails?: {
    service: string;
    mode: 'simulation' | 'production';
    messageId?: string;
    sentAt: string;
    simulated: boolean;
    error?: string;
  };
  triggerOffer?: {
    merchantId: string;
    merchantName: string;
    price: number;
    inStock: boolean;
    condition: string;
    isTestOffer: boolean;
  };
}
