import { db } from '../../src/backend/db';
import { freshnessManager } from '../../src/backend/freshnessManager';
import { alertManager } from '../../src/backend/alertManager';
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
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export async function handler(event: NetlifyEvent): Promise<NetlifyResponse> {
  // Gérer le préflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

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
    // 1. GET /health
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
        }),
      };
    }

    // 2. GET /freshness
    if (method === 'GET' && route === '/freshness') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(freshnessManager.getStatus()),
      };
    }

    // 3. GET /products
    if (method === 'GET' && route === '/products') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(db.getProducts()),
      };
    }

    // 4. GET /offers
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

    // 5. POST /offers/refresh
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

    // 6. GET /history
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

    // 7. Alertes de prix
    if (method === 'GET' && route === '/alerts/summary') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(alertManager.getPublicAlertsSummary()),
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
        availableRoutes: [
          'GET /api/health',
          'GET /api/freshness',
          'GET /api/products',
          'GET /api/offers',
          'POST /api/offers/refresh',
          'GET /api/history',
          'POST /api/alerts',
          'GET /api/alerts/summary',
          'GET /api/connectors/awin/status',
          'POST /api/connectors/awin/sync',
          'POST /api/connectors/sync-all',
        ],
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
