// ⚠️ DONNÉES DE DÉMONSTRATION (MOCK)
// Toutes les données de ce fichier sont fictives, utilisées uniquement pour
// construire l'interface de Tracko. Elles ne reflètent PAS des prix réels.
// Voir README.md dans ce dossier pour la marche à suivre quand une vraie
// source de prix sera branchée.

export type PriceLevel = "excellent" | "bon" | "correct" | "eleve" | "tres-cher";
export type Edition = "neuf" | "reconditionne";
export type Version = "digital" | "lecteur";

export interface Merchant {
  id: string;
  name: string;
  price: number;
  available: boolean;
  trustRating: number; // 1 à 5, note de confiance définie manuellement — pas un vrai avis client
  url: string;
  updatedAt: string; // ISO date
}

export interface PricePoint {
  date: string; // ISO date
  price: number;
}

export interface Family {
  slug: "ps5" | "ps5-slim" | "ps5-pro";
  name: string;
  tagline: string;
}

export interface Variant {
  familySlug: Family["slug"];
  edition: Edition;
  version: Version;
  currentPrice: number;
  averagePrice: number;
  lowestPrice: number;
  highestPrice: number;
  priceLevel: PriceLevel;
  priceLevelReason: string;
  weeklyChange: number;
  merchants: Merchant[];
  priceHistory: PricePoint[]; // 365 jours, filtré côté client par période
  isRealHistory: boolean; // false = historique généré pour la démo, pas de vraies données de marché
}

const priceLevelLabels: Record<PriceLevel, string> = {
  excellent: "Excellent prix",
  bon: "Bon prix",
  correct: "Prix correct",
  eleve: "Prix élevé",
  "tres-cher": "Très cher",
};

export function priceLevelLabel(level: PriceLevel): string {
  return priceLevelLabels[level];
}

// Version simplifiée à 3 niveaux (vert/orange/rouge) pour les affichages compacts
export type SimpleTier = "bon" | "moyen" | "mauvais";

const simpleTierMap: Record<PriceLevel, SimpleTier> = {
  excellent: "bon",
  bon: "bon",
  correct: "moyen",
  eleve: "mauvais",
  "tres-cher": "mauvais",
};

const simpleTierLabels: Record<SimpleTier, string> = {
  bon: "Bon prix",
  moyen: "Prix moyen",
  mauvais: "Prix élevé",
};

export function simpleTier(level: PriceLevel): SimpleTier {
  return simpleTierMap[level];
}

export function simpleTierLabel(level: PriceLevel): string {
  return simpleTierLabels[simpleTierMap[level]];
}

export const families: Family[] = [
  { slug: "ps5", name: "PS5", tagline: "Le modèle standard, fiable et éprouvé." },
  { slug: "ps5-slim", name: "PS5 Slim", tagline: "Plus compacte, plus légère." },
  { slug: "ps5-pro", name: "PS5 Pro", tagline: "Les meilleures performances graphiques." },
];

const versionLabels: Record<Version, string> = {
  digital: "Digital",
  lecteur: "Avec lecteur",
};

export function versionLabel(v: Version): string {
  return versionLabels[v];
}

// Certaines familles n'ont qu'une seule référence console (pas de choix
// digital/avec lecteur) : la PS5 Pro n'existe chez Sony qu'en un seul modèle
// sans lecteur de disque intégré — le lecteur est un accessoire séparé,
// jamais une console différente. Les offres marchands qui incluent un
// lecteur (bundle/accessoire) restent de simples offres sur cette même
// référence, pas une deuxième fiche produit.
const familyVersions: Record<Family["slug"], Version[]> = {
  ps5: ["digital", "lecteur"],
  "ps5-slim": ["digital", "lecteur"],
  "ps5-pro": ["digital"],
};

export function versionsForFamily(slug: Family["slug"]): Version[] {
  return familyVersions[slug];
}

const merchantPool = [
  { id: "amazon", name: "Amazon", trustRating: 5 },
  { id: "fnac", name: "Fnac", trustRating: 4 },
  { id: "cdiscount", name: "Cdiscount", trustRating: 3 },
  { id: "boulanger", name: "Boulanger", trustRating: 5 },
  { id: "playstation", name: "PlayStation Direct", trustRating: 5 },
  { id: "backmarket", name: "Back Market", trustRating: 4 },
  { id: "easycash", name: "Easy Cash", trustRating: 4 },
];

// Marche aléatoire déterministe (pas de Math.random) pour un historique stable au build
function generateHistory(basePrice: number, volatility: number, days = 365): PricePoint[] {
  const points: PricePoint[] = [];
  const today = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const wave = Math.sin(i / 18) * volatility + Math.sin(i / 5) * (volatility * 0.3);
    const trend = ((days - i) / days) * (volatility * 0.4); // légère baisse tendancielle sur l'année
    const price = Math.round(basePrice + wave - trend);
    points.push({ date: d.toISOString().slice(0, 10), price });
  }
  return points;
}

export function computeLevel(current: number, average: number): { level: PriceLevel; reason: string } {
  const diff = ((current - average) / average) * 100;
  if (diff <= -8) return { level: "excellent", reason: `Ce prix est inférieur de ${Math.abs(Math.round(diff))} % au prix moyen.` };
  if (diff <= -2) return { level: "bon", reason: `Ce prix est inférieur de ${Math.abs(Math.round(diff))} % au prix moyen.` };
  if (diff <= 3) return { level: "correct", reason: "Ce prix est proche du prix moyen observé." };
  if (diff <= 10) return { level: "eleve", reason: `Ce prix est supérieur de ${Math.round(diff)} % au prix moyen.` };
  return { level: "tres-cher", reason: `Ce prix est supérieur de ${Math.round(diff)} % au prix moyen — mieux vaut attendre.` };
}

// Prix de base par famille (référence "neuf digital"), calibrés sur les prix
// constatés courant 2026 chez les marchands français (Amazon, Cdiscount, Fnac,
// Back Market) — restent des données de démonstration, pas un flux live.
const basePrices: Record<Family["slug"], number> = {
  ps5: 449,
  "ps5-slim": 399,
  "ps5-pro": 799,
};

function buildVariant(familySlug: Family["slug"], edition: Edition, version: Version): Variant {
  let base = basePrices[familySlug];
  if (version === "lecteur") base += 50;
  if (edition === "reconditionne") base = Math.round(base * 0.82);

  const volatility = Math.round(base * 0.07);
  const history = generateHistory(base, volatility);
  const currentPrice = history[history.length - 1].price;
  const prices30d = history.slice(-30).map((p) => p.price);
  const averagePrice = Math.round(prices30d.reduce((a, b) => a + b, 0) / prices30d.length);
  const lowestPrice = Math.min(...history.map((p) => p.price));
  const highestPrice = Math.max(...history.map((p) => p.price));
  const { level, reason } = computeLevel(currentPrice, averagePrice);
  const weeklyChange = history[history.length - 1].price - history[history.length - 8].price;

  const merchants: Merchant[] = merchantPool
    .filter((m) => {
      if (m.id === "playstation") return edition === "neuf"; // pas de reconditionné en direct constructeur
      if (m.id === "backmarket") return edition === "reconditionne"; // Back Market = spécialiste du reconditionné
      return true;
    })
    .map((m, i) => {
      const spread = (i - 2) * Math.round(base * 0.015);
      return {
        id: m.id,
        name: m.name,
        price: Math.max(currentPrice + spread, Math.round(base * 0.85)),
        available: true,
        trustRating: m.trustRating,
        url: `https://www.${m.id === "playstation" ? "playstation.com" : m.id === "backmarket" ? "backmarket.fr" : m.id + ".fr"}`,
        updatedAt: history[history.length - 1 - i].date,
      };
    });

  return {
    familySlug,
    edition,
    version,
    currentPrice,
    averagePrice,
    lowestPrice,
    highestPrice,
    priceLevel: level,
    priceLevelReason: reason,
    weeklyChange,
    merchants,
    priceHistory: history,
    isRealHistory: false,
  };
}

export const variants: Variant[] = families.flatMap((f) =>
  (["neuf", "reconditionne"] as Edition[]).flatMap((edition) =>
    versionsForFamily(f.slug).map((version) => buildVariant(f.slug, edition, version))
  )
);

export function getFamily(slug: string): Family | undefined {
  return families.find((f) => f.slug === slug);
}

export function getVariantsForFamily(familySlug: string): Variant[] {
  return variants.filter((v) => v.familySlug === familySlug);
}

export function getVariant(familySlug: string, edition: string, version: string): Variant | undefined {
  return variants.find((v) => v.familySlug === familySlug && v.edition === edition && v.version === version);
}

// Note : la sélection de la "meilleure offre globale" (toutes familles
// confondues) vit désormais dans lib/live-data.ts (getLiveBestOverallDeal),
// pour toujours refléter les prix live édités depuis l'administration plutôt
// que ces données de démonstration brutes.
