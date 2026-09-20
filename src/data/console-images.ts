// Chemins déjà pré-remplis avec les noms de fichiers attendus — dépose juste
// tes fichiers dans /public/images/ avec exactement ces noms, rien d'autre à
// modifier ici. Tant qu'un fichier n'existe pas encore, le site continue
// d'afficher l'illustration d'origine automatiquement (aucune image cassée).
import type { Family } from "./mock-ps5";

export const consoleImagePaths: Record<Family["slug"], string | null> = {
  ps5: "/images/ps5.png",
  "ps5-slim": "/images/ps5-slim.png",
  "ps5-pro": "/images/ps5-pro.png",
};

// Textes alternatifs (accessibilité + SEO images) : ils décrivent ce que montre
// réellement chaque visuel. Si tu remplaces une image par un autre visuel,
// pense à adapter aussi son texte ici.
export const consoleImageAlts: Record<Family["slug"], string> = {
  ps5: "Console PlayStation 5 blanche et noire avec lecteur de disques, posée à la verticale à côté d'une manette DualSense",
  "ps5-slim":
    "Console PlayStation 5 Slim blanche et noire, modèle sans lecteur de disques, posée à la verticale à côté d'une manette DualSense",
  "ps5-pro":
    "Console PlayStation 5 Pro blanche et noire, avec ses ailettes noires sur le côté, posée à la verticale à côté d'une manette DualSense",
};
