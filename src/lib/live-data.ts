// Couche "données live" : surcouche modifiable via l'administration, appliquée
// par-dessus les données de référence (mock-ps5.ts). Tant qu'aucune modification
// n'a été enregistrée depuis l'administration, le site affiche les données de
// référence telles quelles — jamais de page cassée ou vide.
import { getStore } from "@netlify/blobs";
import { variants as staticVariants, computeLevel } from "../data/mock-ps5";
import type { Variant, Merchant } from "../data/mock-ps5";

export interface LiveMerchant {
  id: string;
  name: string;
  price: number;
  available: boolean;
  url: string;
  trustRating: number;
}

// Surcouche éditable pour une variante : la liste des marchands, plus un prix
// de référence ("prix moyen") optionnel. Ce prix de référence sert de base au
// badge "Bon prix"/"Excellent prix" (voir computeLevel dans mock-ps5.ts). Si
// l'admin ne le renseigne pas, on retombe sur la moyenne des données de
// démonstration — jamais de valeur inventée présentée comme définitive, mais
// jamais de page cassée non plus.
export interface VariantOverride {
  merchants: LiveMerchant[];
  averagePrice?: number;
}

// Clé : "familySlug:edition:version" → surcouche pour cette variante
export type LiveOverrides = Record<string, VariantOverride>;

const STORE_NAME = "tracko-admin";
const OVERRIDES_KEY = "overrides";

function variantKey(familySlug: string, edition: string, version: string): string {
  return `${familySlug}:${edition}:${version}`;
}

// Ancien format sauvegardé (avant l'ajout de averagePrice) : directement un
// tableau de marchands par clé. On le reconnaît et on le convertit à la volée
// pour ne jamais casser une sauvegarde déjà existante.
function normalizeOverride(raw: unknown): VariantOverride | undefined {
  if (!raw) return undefined;
  if (Array.isArray(raw)) {
    return raw.length > 0 ? { merchants: raw as LiveMerchant[] } : undefined;
  }
  const obj = raw as Partial<VariantOverride>;
  if (!Array.isArray(obj.merchants) || obj.merchants.length === 0) return undefined;
  return {
    merchants: obj.merchants,
    averagePrice: typeof obj.averagePrice === "number" && Number.isFinite(obj.averagePrice) && obj.averagePrice > 0
      ? obj.averagePrice
      : undefined,
  };
}

export async function getLiveOverrides(): Promise<LiveOverrides> {
  try {
    const store = getStore(STORE_NAME);
    const data = await store.get(OVERRIDES_KEY, { type: "json" });
    return (data as LiveOverrides) || {};
  } catch {
    // Netlify Blobs indisponible (ex: en dev local sans `netlify dev`) → on retombe
    // silencieusement sur les données de référence.
    return {};
  }
}

export async function saveLiveOverrides(overrides: LiveOverrides): Promise<void> {
  const store = getStore(STORE_NAME);
  await store.setJSON(OVERRIDES_KEY, overrides);
}

export function applyOverride(variant: Variant, overrides: LiveOverrides): Variant {
  const key = variantKey(variant.familySlug, variant.edition, variant.version);
  const override = normalizeOverride((overrides as Record<string, unknown>)[key]);
  if (!override) return variant;

  const merchants: Merchant[] = override.merchants.map((m) => ({
    id: m.id,
    name: m.name,
    price: m.price,
    available: m.available,
    trustRating: m.trustRating,
    url: m.url,
    updatedAt: new Date().toISOString().slice(0, 10),
  }));

  const availablePrices = merchants.filter((m) => m.available).map((m) => m.price);
  const currentPrice =
    availablePrices.length > 0 ? Math.min(...availablePrices) : Math.min(...merchants.map((m) => m.price));

  // Prix de référence : celui saisi par l'admin s'il existe, sinon la moyenne
  // des données de démonstration (comportement inchangé si rien n'est saisi).
  const averagePrice = override.averagePrice ?? variant.averagePrice;
  const { level, reason } = computeLevel(currentPrice, averagePrice);

  return {
    ...variant,
    merchants,
    currentPrice,
    averagePrice,
    priceLevel: level,
    priceLevelReason: reason,
  };
}

export async function getLiveVariant(familySlug: string, edition: string, version: string): Promise<Variant | undefined> {
  const base = staticVariants.find((v) => v.familySlug === familySlug && v.edition === edition && v.version === version);
  if (!base) return undefined;
  const overrides = await getLiveOverrides();
  return applyOverride(base, overrides);
}

export async function getLiveVariantsForFamily(familySlug: string): Promise<Variant[]> {
  const overrides = await getLiveOverrides();
  return staticVariants.filter((v) => v.familySlug === familySlug).map((v) => applyOverride(v, overrides));
}

export async function getAllLiveVariants(): Promise<Variant[]> {
  const overrides = await getLiveOverrides();
  return staticVariants.map((v) => applyOverride(v, overrides));
}

// Équivalent live de getBestOverallDeal() (mock-ps5.ts) : la meilleure offre
// "neuf" toutes familles confondues, mais calculée à partir des données live
// (donc à jour si l'admin a modifié des prix), pas des données de démo brutes.
export async function getLiveBestOverallDeal(): Promise<Variant> {
  const all = await getAllLiveVariants();
  return [...all].filter((v) => v.edition === "neuf").sort((a, b) => a.currentPrice - b.currentPrice)[0];
}

// Utilitaire pour l'écran d'administration : construit l'état actuel (live si
// présent, sinon référence) sous la forme éditable LiveOverrides complète.
export async function getEditableSnapshot(): Promise<LiveOverrides> {
  const overrides = await getLiveOverrides();
  const snapshot: LiveOverrides = {};
  for (const v of staticVariants) {
    const key = variantKey(v.familySlug, v.edition, v.version);
    const existing = normalizeOverride((overrides as Record<string, unknown>)[key]);
    snapshot[key] = existing
      ? { merchants: existing.merchants, averagePrice: existing.averagePrice ?? v.averagePrice }
      : {
          averagePrice: v.averagePrice,
          merchants: v.merchants.map((m) => ({
            id: m.id,
            name: m.name,
            price: m.price,
            available: m.available,
            url: m.url,
            trustRating: m.trustRating,
          })),
        };
  }
  return snapshot;
}
