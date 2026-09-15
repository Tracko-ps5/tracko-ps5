# Données — mock vs système réel

`mock-ps5.ts` contient exclusivement des **données de démonstration**, utilisées
pour construire l'interface tant que Tracko n'a pas de source de prix réelle.

Quand une source réelle sera branchée (API affiliée, partenaire autorisé, etc.),
créer un module séparé (ex: `live-ps5.ts`) qui exporte les mêmes types
(`Ps5Model`, `Merchant`, `PricePoint`) et la même fonction `getModelBySlug`.
Les pages `.astro` importent aujourd'hui depuis `mock-ps5.ts` — il suffira de
changer l'import pour basculer sur les données réelles, sans toucher au reste
du site.

Ne jamais scraper un site marchand sans avoir vérifié au préalable que c'est
autorisé par ses conditions d'utilisation.
