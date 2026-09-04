import { db, ManualOfferInput } from '../../src/backend/db';
import { freshnessManager } from '../../src/backend/freshnessManager';
import { alertManager } from '../../src/backend/alertManager';
import { notificationService } from '../../src/backend/services/notificationService';
import { runAlertEngineTests } from '../../src/backend/tests/alertEngine.test';
import { pilotConnector } from '../../src/backend/connectors/pilotMerchantConnector';
import { boulangerConnector } from '../../src/backend/connectors/boulangerMerchantConnector';
import { cdiscountConnector } from '../../src/backend/connectors/cdiscountMerchantConnector';
import { awinFnacConnector, awinCdiscountConnector, awinGenericConnector } from '../../src/backend/connectors/awinProductFeedConnector';

interface NetlifyEvent {
  path: string;
  httpMethod: string;
  headers: Record<string, string>;
  queryStringParameters: Record<string, string> | null;
  body: string | null;
  isBase64Encoded: boolean;
}

interface NetlifyResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

const CORS_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Password',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

function checkAdminAuth(headers: Record<string, string>): boolean {
  const secret = process.env.ADMIN_PASSWORD || 'tracko2026';
  const authHeader = headers['authorization'] || headers['Authorization'] || '';
  const xPass = headers['x-admin-password'] || headers['X-Admin-Password'] || '';
  
  if (xPass && xPass === secret) return true;
  if (authHeader.startsWith('Bearer ') && authHeader.slice(7) === secret) return true;
  return false;
}

export async function handler(event: NetlifyEvent): Promise<NetlifyResponse> {
  // Gérer le préflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  // Initialiser les données depuis Netlify Blobs si existantes
  await db.ensureLoadedFromCloud();

  // Normaliser le chemin : supporte /api/offers, /.netlify/functions/api/offers, /offers
  let route = event.path;
  route = route.replace(/^\/\.netlify\/functions\/api/, '');
  route = route.replace(/^\/api/, '');
  if (!route.startsWith('/')) {
    route = '/' + route;
  }
  // Enlever les éventuels slashes de fin
  if (route.length > 1 && route.endsWith('/')) {
    route = route.slice(0, -1);
  }

  const method = event.httpMethod.toUpperCase();
  const query = event.queryStringParameters || {};

  try {
    // ==========================================
    // 1. AUTHENTIFICATION & ADMINISTRATION PRIVÉE
    // ==========================================

    // POST /admin/auth (Vérification mot de passe Admin)
    if (method === 'POST' && route === '/admin/auth') {
      const body = event.body ? JSON.parse(event.body) : {};
      const expectedPassword = process.env.ADMIN_PASSWORD || 'tracko2026';
      const providedPassword = body.password || '';

      if (providedPassword === expectedPassword) {
        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            success: true,
            token: expectedPassword,
            message: 'Authentification réussie.',
          }),
        };
      } else {
        return {
          statusCode: 401,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            success: false,
            message: 'Mot de passe administrateur incorrect.',
          }),
        };
      }
    }

    // GET /admin/offers (Liste de gestion des offres)
    if (method === 'GET' && route === '/admin/offers') {
      if (!checkAdminAuth(event.headers)) {
        return {
          statusCode: 403,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Accès refusé : token administrateur manquant ou invalide.' }),
        };
      }
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          offers: db.getAllOffers(),
          products: db.getProducts(),
          merchants: db.getMerchants(),
          history: db.getAllHistory(),
        }),
      };
    }

    // POST /admin/offers/update (Sauvegarde manuelle d'une offre avec rupture et historique)
    if (method === 'POST' && route === '/admin/offers/update') {
      if (!checkAdminAuth(event.headers)) {
        return {
          statusCode: 403,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Accès refusé : token administrateur manquant ou invalide.' }),
        };
      }
      const body = event.body ? JSON.parse(event.body) : {};
      const { offer } = body;
      if (!offer || !offer.productId || !offer.merchantId || offer.price === undefined) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Champs obligatoires manquants (productId, merchantId, price).' }),
        };
      }

      const input: ManualOfferInput = {
        productId: offer.productId,
        editionType: offer.editionType || 'digital',
        merchantId: offer.merchantId,
        merchantName: offer.merchantName,
        price: Number(offer.price),
        originalPrice: offer.originalPrice ? Number(offer.originalPrice) : undefined,
        condition: offer.condition || 'new',
        conditionLabel: offer.conditionLabel,
        inStock: Boolean(offer.inStock),
        url: offer.url || '',
        deliveryPrice: offer.deliveryPrice !== undefined ? Number(offer.deliveryPrice) : 0,
        deliveryInfo: offer.deliveryInfo,
      };

      const result = await db.saveManualOffer(input);
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: true,
          message: result.historyAdded ? 'Offre et historique de prix enregistrés avec succès.' : 'Offre enregistrée avec succès.',
          offer: result.offer,
          historyAdded: result.historyAdded,
          offers: db.getAllOffers(),
        }),
      };
    }

    // POST /admin/offers/bulk-update (Sauvegarde groupée)
    if (method === 'POST' && route === '/admin/offers/bulk-update') {
      if (!checkAdminAuth(event.headers)) {
        return {
          statusCode: 403,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Accès refusé : token administrateur manquant ou invalide.' }),
        };
      }
      const body = event.body ? JSON.parse(event.body) : {};
      const { offers } = body;
      if (!Array.isArray(offers)) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Paramètre "offers" (tableau) obligatoire.' }),
        };
      }

      const inputs: ManualOfferInput[] = offers.map(o => ({
        productId: o.productId,
        editionType: o.editionType || 'digital',
        merchantId: o.merchantId,
        merchantName: o.merchantName,
        price: Number(o.price),
        originalPrice: o.originalPrice ? Number(o.originalPrice) : undefined,
        condition: o.condition || 'new',
        conditionLabel: o.conditionLabel,
        inStock: Boolean(o.inStock),
        url: o.url || '',
        deliveryPrice: o.deliveryPrice !== undefined ? Number(o.deliveryPrice) : 0,
        deliveryInfo: o.deliveryInfo,
      }));

      const res = await db.bulkSaveManualOffers(inputs);
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: true,
          updatedCount: res.count,
          historyCount: res.historyCount,
          offers: db.getAllOffers(),
        }),
      };
    }

    // GET /admin/history/latest (« Copier les prix d'hier »)
    if (method === 'GET' && route === '/admin/history/latest') {
      if (!checkAdminAuth(event.headers)) {
        return {
          statusCode: 403,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Accès refusé : token administrateur manquant ou invalide.' }),
        };
      }
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          lastObservations: db.getLastObservations(),
        }),
      };
    }

    // GET & POST /admin/backup (Sauvegarde / Restauration)
    if (method === 'GET' && route === '/admin/backup') {
      if (!checkAdminAuth(event.headers)) {
        return {
          statusCode: 403,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Accès refusé.' }),
        };
      }
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(db.exportBackup()),
      };
    }

    if (method === 'POST' && route === '/admin/backup') {
      if (!checkAdminAuth(event.headers)) {
        return {
          statusCode: 403,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Accès refusé.' }),
        };
      }
      const body = event.body ? JSON.parse(event.body) : {};
      await db.importBackup(body);
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true, message: 'Sauvegarde restaurée avec succès.' }),
      };
    }

    // ==========================================
    // 2. ROUTES PUBLIQUES TRACKO
    // ==========================================

    // GET /health
    if (method === 'GET' && (route === '/health' || route === '')) {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          status: 'ok',
          service: 'TRACKO API (Netlify Serverless)',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          version: '1.0.0',
          offersCount: db.getAllOffers().length,
        }),
      };
    }

    // GET /freshness
    if (method === 'GET' && route === '/freshness') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(freshnessManager.getStatus()),
      };
    }

    // GET /products
    if (method === 'GET' && route === '/products') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(db.getProducts()),
      };
    }

    // GET /offers
    if (method === 'GET' && route === '/offers') {
      // Déclencher automatiquement la synchronisation si les données sont périmées (> 6h)
      await freshnessManager.ensureFreshness('netlify_api_offers_request');

      const productId = query.productId;
      const editionType = query.editionType as 'digital' | 'disc' | undefined;

      if (productId) {
        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify(db.getOffersForProduct(productId, editionType)),
        };
      }

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(db.getAllOffers()),
      };
    }

    // POST /offers/refresh
    if (method === 'POST' && route === '/offers/refresh') {
      const result = await freshnessManager.ensureFreshness('netlify_manual_refresh', true);
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: true,
          freshness: freshnessManager.getStatus(),
          result,
          offersCount: db.getAllOffers().length,
        }),
      };
    }

    // GET /history
    if (method === 'GET' && route === '/history') {
      const productId = query.productId;
      const editionType = query.editionType as 'digital' | 'disc' | undefined;

      if (!productId || !editionType) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Paramètres "productId" et "editionType" obligatoires.' }),
        };
      }

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(db.getHistory(productId, editionType)),
      };
    }

    // 7. Alertes de prix & Notifications
    if (method === 'GET' && route === '/alerts/status') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          alertEngine: 'operational',
          persistence: 'operational',
          resend: notificationService.getStatus(),
          activeAlertsCount: db.getActiveAlerts().length,
          allAlertsCount: db.getAllAlerts().length,
        }),
      };
    }

    if (method === 'GET' && route === '/alerts/summary') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(alertManager.getPublicAlertsSummary()),
      };
    }

    if (method === 'GET' && route === '/alerts/unsubscribe') {
      const token = query.token || '';
      const result = alertManager.unsubscribeByToken(token);
      
      return {
        statusCode: result.success ? 200 : 400,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
        body: `
          <!DOCTYPE html>
          <html lang="fr">
          <head><meta charset="UTF-8"><title>Désinscription TRACKO</title>
          <style>body{font-family:sans-serif;text-align:center;padding:50px;background:#f8fafc;color:#1e293b;}</style></head>
          <body>
            <h1>${result.success ? 'Désinscription confirmée' : 'Erreur'}</h1>
            <p>${result.message}</p>
            ${result.success ? '<p>Vous ne recevrez plus d\'emails pour cette alerte de prix.</p>' : ''}
            <a href="/" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#0f172a;color:#fff;text-decoration:none;border-radius:8px;">Retour à TRACKO</a>
          </body>
          </html>
        `,
      };
    }

    if (method === 'POST' && route === '/alerts/evaluate') {
      const evaluation = await alertManager.evaluateAlerts();
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(evaluation),
      };
    }

    if (method === 'GET' && route === '/alerts/run-tests') {
      const testResults = await runAlertEngineTests();
      await freshnessManager.ensureFreshness('post_test_reset', true);
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(testResults),
      };
    }

    if (method === 'POST' && route === '/alerts') {
      const body = event.body ? JSON.parse(event.body) : {};
      const { email, productId, productName, editionType, targetPrice, currentPriceAtCreation } = body;

      if (!email || !productId || !editionType || !targetPrice) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ success: false, message: 'Paramètres manquants pour la création de l\'alerte.' }),
        };
      }

      const creation = alertManager.createAlert({
        email,
        productId,
        productName: productName || productId,
        editionType,
        targetPrice: parseFloat(String(targetPrice)),
        currentPriceAtCreation: currentPriceAtCreation ? parseFloat(String(currentPriceAtCreation)) : undefined,
      });

      return {
        statusCode: creation.success ? 201 : 400,
        headers: CORS_HEADERS,
        body: JSON.stringify(creation),
      };
    }

    // 8. Connecteurs Awin & diagnostic
    if (method === 'GET' && route === '/connectors/awin/status') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          configured: {
            fnac: awinFnacConnector.isConfigured(),
            cdiscount: awinCdiscountConnector.isConfigured(),
            generic: awinGenericConnector.isConfigured(),
          },
          envVariablesRequired: [
            'AWIN_FNAC_FEED_URL',
            'AWIN_CDISCOUNT_FEED_URL',
            'AWIN_API_TOKEN',
          ],
          mode: (awinFnacConnector.isConfigured() || awinCdiscountConnector.isConfigured()) ? 'production' : 'not_configured',
          note: 'Les flux AWIN sont interrogés dès que les variables d\'environnement AWIN_*_FEED_URL sont renseignées.',
        }),
      };
    }

    if (method === 'POST' && route === '/connectors/awin/sync') {
      const fnacResult = await awinFnacConnector.fetchAndSync();
      const cdisResult = await awinCdiscountConnector.fetchAndSync();
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          fnac: fnacResult,
          cdiscount: cdisResult,
        }),
      };
    }

    if (method === 'POST' && route === '/connectors/sync-all') {
      const fnacRes = await pilotConnector.fetchAndSync();
      const blgRes = await boulangerConnector.fetchAndSync();
      const cdisRes = await cdiscountConnector.fetchAndSync();
      let awinFnacRes = null;
      let awinCdisRes = null;

      if (awinFnacConnector.isConfigured()) {
        awinFnacRes = await awinFnacConnector.fetchAndSync();
      }
      if (awinCdiscountConnector.isConfigured()) {
        awinCdisRes = await awinCdiscountConnector.fetchAndSync();
      }

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: fnacRes.success && blgRes.success && cdisRes.success,
          pilotFnac: fnacRes,
          pilotBoulanger: blgRes,
          pilotCdiscount: cdisRes,
          awinFnac: awinFnacRes,
          awinCdiscount: awinCdisRes,
        }),
      };
    }

    // 404 Route non trouvée
    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Route introuvable',
        requestedRoute: route,
      }),
    };
  } catch (err: any) {
    console.error('[Netlify Function API Error]:', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Erreur interne du serveur',
        message: err?.message || 'Erreur inconnue',
      }),
    };
  }
}

