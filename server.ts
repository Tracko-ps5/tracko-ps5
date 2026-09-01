import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/backend/db';
import { pilotConnector } from './src/backend/connectors/pilotMerchantConnector';
import { boulangerConnector } from './src/backend/connectors/boulangerMerchantConnector';
import { cdiscountConnector } from './src/backend/connectors/cdiscountMerchantConnector';
import { awinFnacConnector, awinCdiscountConnector } from './src/backend/connectors/awinProductFeedConnector';
import { freshnessManager } from './src/backend/freshnessManager';
import { alertManager } from './src/backend/alertManager';
import { runAlertEngineTests } from './src/backend/tests/alertEngine.test';

const currentDir = process.cwd();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Middleware automatique de vérification de fraîcheur pour les requêtes de données
  // Si les données ont plus de 6 heures, déclenche une synchro en arrière-plan sans bloquer la réponse
  app.use(async (req, res, next) => {
    if (req.path.startsWith('/api/offers') || req.path.startsWith('/api/products')) {
      freshnessManager.ensureFreshness('visite_utilisateur').catch(err => {
        console.error('[Middleware Fraîcheur] Erreur non bloquante :', err);
      });
    }
    next();
  });

  // ==========================================
  // API ROUTES (Backend TRACKO)
  // ==========================================

  // 1. État de santé et fraîcheur
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      time: new Date().toISOString(),
      freshness: freshnessManager.getStatus()
    });
  });

  // Statut de fraîcheur
  app.get('/api/freshness', (req, res) => {
    res.json(freshnessManager.getStatus());
  });

  // Point de test pour simuler des données vieilles de plus de 6 heures
  app.post('/api/freshness/simulate-stale', (req, res) => {
    const sevenHoursAgo = Date.now() - (7 * 60 * 60 * 1000);
    freshnessManager.setLastSyncTimestampForTesting(sevenHoursAgo);
    res.json({
      success: true,
      message: 'Timestamp simulé à -7 heures pour le test de fraîcheur.',
      status: freshnessManager.getStatus()
    });
  });

  // Point de test pour forcer la vérification de fraîcheur
  app.post('/api/freshness/check', async (req, res) => {
    const result = await freshnessManager.ensureFreshness('test_manuel');
    res.json({ result, status: freshnessManager.getStatus() });
  });

  // 2. Liste des produits
  app.get('/api/products', (req, res) => {
    res.json(db.getProducts());
  });

  // 3. Liste des offres actuelles (avec filtres optionnels)
  app.get('/api/offers', (req, res) => {
    const { productId, editionType } = req.query;
    if (productId) {
      return res.json(db.getOffersForProduct(productId as string, editionType as ('digital' | 'disc') | undefined));
    }
    return res.json(db.getAllOffers());
  });

  // 4. Historique réel des prix
  app.get('/api/history', (req, res) => {
    const { productId, editionType } = req.query;
    if (!productId || !editionType) {
      return res.status(400).json({ error: 'productId et editionType sont obligatoires' });
    }
    return res.json(db.getHistory(productId as string, editionType as ('digital' | 'disc')));
  });

  // 5. Exécution manuelle ou programmée des connecteurs
  app.post('/api/connectors/sync-all', async (req, res) => {
    try {
      const pilotRes = await pilotConnector.fetchAndSync();
      const blgRes = await boulangerConnector.fetchAndSync();
      const cdisRes = await cdiscountConnector.fetchAndSync();
      res.json({
        success: pilotRes.success && blgRes.success && cdisRes.success,
        results: { fnac: pilotRes, boulanger: blgRes, cdiscount: cdisRes }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Erreur inconnue' });
    }
  });

  app.post('/api/connectors/pilot/sync', async (req, res) => {
    try {
      const result = await pilotConnector.fetchAndSync();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Erreur inconnue' });
    }
  });

  app.post('/api/connectors/boulanger/sync', async (req, res) => {
    try {
      const result = await boulangerConnector.fetchAndSync();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Erreur inconnue' });
    }
  });

  app.post('/api/connectors/cdiscount/sync', async (req, res) => {
    try {
      const result = await cdiscountConnector.fetchAndSync();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Erreur inconnue' });
    }
  });

  // Statut des connecteurs Awin Production
  app.get('/api/connectors/awin/status', (req, res) => {
    res.json({
      configured: {
        fnac: awinFnacConnector.isConfigured(),
        cdiscount: awinCdiscountConnector.isConfigured(),
      },
      envVariablesRequired: [
        'AWIN_API_TOKEN',
        'AWIN_PUBLISHER_ID',
        'AWIN_FNAC_FEED_URL',
        'AWIN_CDISCOUNT_FEED_URL'
      ],
      mode: (awinFnacConnector.isConfigured() || awinCdiscountConnector.isConfigured()) ? 'production' : 'demo_simulation',
      note: 'Les appels réseau vers Awin sont inactifs tant que les variables d\'environnement ne sont pas configurées.'
    });
  });

  // 6. Logs d'exécution des connecteurs
  app.get('/api/connectors/logs', (req, res) => {
    res.json(db.getLogs());
  });

  // ==========================================
  // API ALERTES DE PRIX (PRICE_ALERTS)
  // ==========================================
  // Créer une alerte
  app.post('/api/alerts', (req, res) => {
    const { email, productId, productName, editionType, targetPrice, currentPriceAtCreation } = req.body;
    
    if (!email || !productId || !editionType || !targetPrice) {
      return res.status(400).json({
        success: false,
        message: 'Champs requis manquants (email, productId, editionType, targetPrice).'
      });
    }

    const result = alertManager.createAlert({
      email,
      productId,
      productName: productName || productId,
      editionType,
      targetPrice: Number(targetPrice),
      currentPriceAtCreation: Number(currentPriceAtCreation || 0),
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  });

  // Vérifier et évaluer manuellement les alertes (Test / Diagnostic)
  app.post('/api/alerts/evaluate', (req, res) => {
    const evaluation = alertManager.evaluateAlerts();
    res.json(evaluation);
  });

  // Liste anonymisée et protégée des alertes (pour diagnostic et validation)
  app.get('/api/alerts', (req, res) => {
    res.json(alertManager.getPublicAlertsSummary());
  });

  // Exécution de la suite de tests automatisés du moteur d'alertes
  app.get('/api/alerts/run-tests', (req, res) => {
    const testResults = runAlertEngineTests();
    // Ré-initialisation propre de la base avec les données réelles
    freshnessManager.ensureFreshness('post_test_reset');
    res.json(testResults);
  });

  // Exécution initiale et enregistrement de fraîcheur au démarrage
  try {
    console.log('[TRACKO Backend] Initialisation de la fraîcheur au démarrage...');
    await freshnessManager.ensureFreshness('demarrage_serveur');
    console.log('[TRACKO Backend] Fraîcheur initiale vérifiée avec succès !');
  } catch (err) {
    console.error('[TRACKO Backend] Erreur lors de l\'initialisation de fraîcheur :', err);
  }

  // ==========================================
  // AUTOMATISATION EN ARRIÈRE-PLAN (CYCLE OFFICIEL: 6 HEURES)
  // ==========================================
  // NOTE DE PRODUCTION / ARCHITECTURE :
  // Le timer ci-dessous tourne dans le processus Node.js.
  // Sur un hébergement Cloud (type Cloud Run / Serverless), le conteneur peut se mettre en veille
  // lorsqu'il n'y a aucun trafic (Scale-to-Zero).
  // C'est pourquoi le système possède une double sécurité :
  // 1. Le timer interne ci-dessous (lorsque le serveur est actif et tourne en continu).
  // 2. Le middleware 'freshnessManager' à chaque visite d'un utilisateur (si le serveur sort de veille
  //    ou si les données datent de > 6h, la mise à jour est déclenchée immédiatement).
  const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 heures
  const SYNC_INTERVAL_HOURS = 6;
  console.log(`[TRACKO Scheduler] Démarrage du minuteur automatique (cycle officiel : toutes les ${SYNC_INTERVAL_HOURS} heures)...`);

  setInterval(async () => {
    const cycleTime = new Date().toLocaleTimeString('fr-FR');
    console.log(`[TRACKO Scheduler] [${cycleTime}] Déclenchement automatique du cycle 6h via freshnessManager...`);
    await freshnessManager.ensureFreshness('timer_6h_automatique');
  }, SYNC_INTERVAL_MS);

  // ==========================================
  // SEO & FICHIERS PUBLICS RACINE (robots.txt, sitemap.xml)
  // ==========================================
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.sendFile(path.join(process.cwd(), 'public', 'robots.txt'));
  });

  app.get('/sitemap.xml', (req, res) => {
    res.type('application/xml');
    res.sendFile(path.join(process.cwd(), 'public', 'sitemap.xml'));
  });

  // ==========================================
  // VITE MIDDLEWARE (Dev) / STATIC ASSETS (Prod)
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TRACKO Backend] Serveur démarré sur http://0.0.0.0:${PORT}`);
  });
}

startServer();
