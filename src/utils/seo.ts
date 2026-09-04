import { MAIN_FAQS } from '../data/seoContent';
import { PS5Model, EditionDetails } from '../types';

export interface SeoConfig {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  h1: string;
}

export const SEO_ROUTES: Record<string, SeoConfig> = {
  '/': {
    title: 'TRACKO - Tracker & Comparateur de Prix PS5',
    description: 'TRACKO compare les offres et prix vérifiés de la PlayStation 5 (Standard, Slim, Pro). Alertes stocks, historique des prix et comparatif des marchands.',
    canonical: 'https://tracko.fr/',
    ogTitle: 'TRACKO - Comparateur de Prix PlayStation 5',
    ogDescription: 'Trouvez la PS5 au meilleur prix. Historique des prix, alertes de stock et comparatif des offres marchands.',
    ogImage: '/images/gta-vi-banner.jpg',
    h1: 'Comparateur & Tracker de Prix PlayStation 5'
  },
  '/ps5': {
    title: 'Prix PS5 Standard (Châssis d\'origine) - Comparateur TRACKO',
    description: 'Suivez le prix et la disponibilité de la PlayStation 5 Standard (Édition Digitale et avec Lecteur de disque) chez les marchands.',
    canonical: 'https://tracko.fr/ps5',
    ogTitle: 'PS5 Standard - Comparateur de Prix et Disponibilité | TRACKO',
    ogDescription: 'Toutes les offres pour la PlayStation 5 classique. Suivi des prix et état des stocks.',
    ogImage: '/images/ps5-standard.jpg',
    h1: 'PlayStation 5 Standard - Comparatif des prix'
  },
  '/ps5-slim': {
    title: 'Prix PS5 Slim (Digitale & Lecteur) - Meilleures Offres | TRACKO',
    description: 'Comparez les prix de la Sony PlayStation 5 Slim. Suivi des versions Digitale et avec Lecteur de disque Blu-ray Ultra HD.',
    canonical: 'https://tracko.fr/ps5-slim',
    ogTitle: 'PS5 Slim - Comparateur de Prix et Disponibilités | TRACKO',
    ogDescription: 'Offres et historique de prix pour la PlayStation 5 Slim.',
    ogImage: '/images/ps5-slim.jpg',
    h1: 'PlayStation 5 Slim - Comparatif des offres'
  },
  '/ps5-slim-digital': {
    title: 'Prix PS5 Slim Édition Digitale (1 To) - Comparateur TRACKO',
    description: 'Meilleur prix pour la PlayStation 5 Slim Digitale (1 To SSD sans lecteur). Comparez les offres neuves et reconditionnées certifiées.',
    canonical: 'https://tracko.fr/ps5-slim-digital',
    ogTitle: 'PS5 Slim Digitale - Prix le Plus Bas et Disponibilité | TRACKO',
    ogDescription: 'Toutes les offres disponibles pour la PS5 Slim Édition Digitale avec historique des prix.',
    ogImage: '/images/ps5-slim.jpg',
    h1: 'PS5 Slim Édition Digitale - Suivi des prix'
  },
  '/ps5-slim-disc': {
    title: 'Prix PS5 Slim avec Lecteur Blu-ray (1 To) - Comparateur TRACKO',
    description: 'Trouvez la PlayStation 5 Slim avec lecteur de disque au meilleur prix. Comparatif des marchands et alertes de baisse de prix.',
    canonical: 'https://tracko.fr/ps5-slim-disc',
    ogTitle: 'PS5 Slim avec Lecteur - Offres et Disponibilités | TRACKO',
    ogDescription: 'Comparateur de prix pour la PS5 Slim avec Lecteur Blu-ray Ultra HD.',
    ogImage: '/images/ps5-slim.jpg',
    h1: 'PS5 Slim avec Lecteur - Suivi des offres'
  },
  '/ps5-pro': {
    title: 'Prix PS5 Pro 2 To - Comparateur et Suivi de Stock | TRACKO',
    description: 'Suivi des prix et stocks de la PlayStation 5 Pro (2 To SSD, PlayStation Spectral Super Resolution). Comparatif des marchands officiels.',
    canonical: 'https://tracko.fr/ps5-pro',
    ogTitle: 'PS5 Pro 2 To - Meilleur Prix et Disponibilité | TRACKO',
    ogDescription: 'Consultez les offres et la disponibilité de la PlayStation 5 Pro.',
    ogImage: '/images/ps5-pro.jpg',
    h1: 'PlayStation 5 Pro - Comparatif et suivi de prix'
  },
  '/comparatif-ps5-digital-vs-lecteur': {
    title: 'PS5 Digitale vs PS5 avec Lecteur : Quel modèle choisir ? | TRACKO',
    description: 'Faut-il acheter la PS5 Slim Digitale ou la version avec lecteur de disque ? Découvrez le comparatif des prix, avantages, inconvénients et rentabilité.',
    canonical: 'https://tracko.fr/comparatif-ps5-digital-vs-lecteur',
    ogTitle: 'PS5 Digitale vs PS5 avec Lecteur : Comparatif & Guide d\'achat | TRACKO',
    ogDescription: 'Comparatif complet pour choisir entre la PS5 Digitale et la version Lecteur.',
    ogImage: '/images/ps5-slim.jpg',
    h1: 'PS5 Digitale vs PS5 avec Lecteur : Le Comparatif'
  },
  '/ps5-neuf-vs-reconditionne': {
    title: 'PS5 Neuve ou Reconditionnée : Comparatif Prix et Garanties | TRACKO',
    description: 'Est-ce rentable d\'acheter une PS5 reconditionnée ? Garanties, état de la manette DualSense, prix moyens constatés et conseils d\'experts.',
    canonical: 'https://tracko.fr/ps5-neuf-vs-reconditionne',
    ogTitle: 'PS5 Neuve vs Reconditionnée : Le Guide Complet | TRACKO',
    ogDescription: 'Conseils et comparatif pour acheter une PS5 neuve ou reconditionnée en toute sérénité.',
    ogImage: '/images/ps5-slim.jpg',
    h1: 'PS5 Neuve ou Reconditionnée : Comparatif et Garanties'
  }
};

/**
 * Met à jour dynamiquement les balises Meta, Title, Canonical et Open Graph
 */
export function updateDocumentSeo(pathname: string) {
  const normalizedPath = pathname.endsWith('/') && pathname.length > 1 
    ? pathname.slice(0, -1) 
    : pathname;

  const seo = SEO_ROUTES[normalizedPath] || SEO_ROUTES['/'];

  // 1. Titre
  document.title = seo.title;

  // 2. Meta description
  let descMeta = document.querySelector('meta[name="description"]');
  if (!descMeta) {
    descMeta = document.createElement('meta');
    descMeta.setAttribute('name', 'description');
    document.head.appendChild(descMeta);
  }
  descMeta.setAttribute('content', seo.description);

  // 3. Balise Canonical
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', seo.canonical);

  // 4. Open Graph
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', seo.ogTitle);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', seo.ogDescription);

  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) ogImage.setAttribute('content', seo.ogImage);

  // 5. Mise à jour de l'URL dans le navigateur sans recharger la page
  if (window.location.pathname !== normalizedPath) {
    window.history.pushState({}, '', normalizedPath);
  }
}

/**
 * Injecte ou met à jour le schéma JSON-LD pour les pages de produits et FAQ
 */
export function injectStructuredData(
  type: 'home' | 'product' | 'guide',
  data?: {
    model?: PS5Model;
    edition?: EditionDetails;
  }
) {
  let scriptTag = document.getElementById('dynamic-jsonld') as HTMLScriptElement | null;
  if (!scriptTag) {
    scriptTag = document.createElement('script');
    scriptTag.id = 'dynamic-jsonld';
    scriptTag.type = 'application/ld+json';
    document.head.appendChild(scriptTag);
  }

  const structuredData: any = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://tracko.fr/#website',
        'url': 'https://tracko.fr/',
        'name': 'TRACKO',
        'description': 'Comparateur et tracker de prix spécialisé PlayStation 5'
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://tracko.fr/#faq',
        'mainEntity': MAIN_FAQS.map(faq => ({
          '@type': 'Question',
          'name': faq.question,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': faq.answer
          }
        }))
      }
    ]
  };

  if (type === 'product' && data?.model && data?.edition) {
    const { model, edition } = data;
    const inStockOffers = edition.offers.filter(o => o.inStock);
    const lowPrice = inStockOffers.length > 0 ? Math.min(...inStockOffers.map(o => o.price)) : edition.currentLowestPrice;
    const highPrice = inStockOffers.length > 0 ? Math.max(...inStockOffers.map(o => o.price)) : edition.msrp;

    structuredData['@graph'].push({
      '@type': 'Product',
      '@id': `https://tracko.fr/product/${model.id}#product`,
      'name': `${model.name} — ${edition.type === 'digital' ? 'Édition Digitale' : 'Édition Standard'}`,
      'description': `Console Sony ${model.name} (${edition.storage}). Comparateur de prix en direct chez les marchands officiels.`,
      'image': `https://tracko.fr${model.image}`,
      'brand': {
        '@type': 'Brand',
        'name': 'Sony PlayStation'
      },
      'offers': {
        '@type': 'AggregateOffer',
        'priceCurrency': 'EUR',
        'lowPrice': lowPrice,
        'highPrice': highPrice,
        'offerCount': inStockOffers.length,
        'offers': inStockOffers.map(o => ({
          '@type': 'Offer',
          'price': o.price,
          'priceCurrency': 'EUR',
          'url': o.url,
          'itemCondition': o.condition === 'new' ? 'https://schema.org/NewCondition' : 'https://schema.org/RefurbishedCondition',
          'availability': o.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          'seller': {
            '@type': 'Organization',
            'name': o.merchantName
          }
        }))
      }
    });
  }

  scriptTag.textContent = JSON.stringify(structuredData);
}
