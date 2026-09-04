export type PriceEvaluationStatus = 
  | 'excellent_price'
  | 'good_price' 
  | 'average_price' 
  | 'high_price' 
  | 'very_high_price';

export type ProductCondition = 'new' | 'refurbished';

export interface MerchantOffer {
  id: string;
  merchantName: string;
  merchantLogo: string;
  condition?: ProductCondition; // 'new' ou 'refurbished'
  conditionLabel?: string; // ex: 'Neuf scellé', 'Reconditionné Excellent état', etc.
  rating?: number; // ex: 4.8
  reviewsCount?: number; // ex: 1250
  price: number;
  originalPrice: number;
  inStock: boolean;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  deliveryInfo: string;
  url: string;
  isBestPrice?: boolean;
  lastUpdated: string;
  sourceType?: 'manual_verification' | 'live_feed' | 'pilot_feed' | 'static_reference';
  isLive?: boolean;
  feedSourceUrl?: string;
}

export interface PricePoint {
  date: string;
  price: number;
  merchant: string;
}

export interface EditionDetails {
  type: 'digital' | 'disc';
  label: string;
  msrp: number; // Prix catalogue officiel
  currentLowestPrice: number;
  currentLowestMerchant: string;
  averagePrice: number; // Prix moyen calculé
  lowestEverPrice: number;
  lowestEverDate: string;
  highestPrice: number;
  status: PriceEvaluationStatus;
  statusLabel: string;
  statusReason: string;
  storage: string;
  offers: MerchantOffer[];
  priceHistory: {
    '7d': PricePoint[];
    '30d': PricePoint[];
    '3m': PricePoint[];
    '6m': PricePoint[];
    '1y': PricePoint[];
  };
}

export interface PS5Model {
  id: 'ps5-slim' | 'ps5-pro' | 'ps5-standard';
  name: string;
  shortName: string;
  badge?: string;
  tagline: string;
  image: string;
  description: string;
  startingPrice: number;
  status: PriceEvaluationStatus;
  statusLabel: string;
  specs: {
    gpu: string;
    ram: string;
    rayTracing: string;
    weight: string;
    storageDefault: string;
  };
  digitalEdition?: EditionDetails;
  discEdition?: EditionDetails;
}

export interface PriceAlert {
  id: string;
  modelId: string;
  modelName: string;
  editionType: 'digital' | 'disc';
  targetPrice: number;
  currentPriceAtCreation: number;
  email: string;
  createdAt: string;
  isActive: boolean;
}
