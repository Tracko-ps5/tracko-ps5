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
