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
import { notificationService } from './src/backend/services/notificationService';
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

  // --- Authentification & Gestion Admin ---
  const checkExpressAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const secret = process.env.ADMIN_PASSWORD || 'tracko2026';
    const authHeader = req.headers.authorization || '';
    const xPass = req.headers['x-admin-password'] || '';

    if (xPass === secret || (authHeader.startsWith('Bearer ') && authHeader.slice(7) === secret)) {
      return next();
    }
    return res.status(403).json({ error: 'Accès refusé : mot de passe administrateur invalide.' });
  };

  app.post('/api/admin/auth', (req, res) => {
    const { password } = req.body || {};
    const secret = process.env.ADMIN_PASSWORD || 'tracko2026';
    if (password === secret) {
      return res.json({ success: true, token: secret, message: 'Authentification réussie.' });
    }
    return res.status(401).json({ success: false, message: 'Mot de passe administrateur incorrect.' });
  });

  app.get('/api/admin/offers', checkExpressAdmin, (req, res) => {
    res.json({
      offers: db.getAllOffers(),
      products: db.getProducts(),
      merchants: db.getMerchants(),
      history: db.getAllHistory(),
    });
  });

  app.post('/api/admin/offers/update', checkExpressAdmin, async (req, res) => {
    try {
      const { offer } = req.body || {};
      if (!offer || !offer.productId || !offer.merchantId || offer.price === undefined) {
        return res.status(400).json({ error: 'Champs obligatoires manquants (productId, merchantId, price).' });
      }
      const result = await db.saveManualOffer({
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
      });
      res.json({
        success: true,
        message: result.historyAdded ? 'Offre et observation de prix enregistrées.' : 'Offre enregistrée.',
        offer: result.offer,
        historyAdded: result.historyAdded,
        offers: db.getAllOffers(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erreur lors de la sauvegarde.' });
    }
  });

  app.post('/api/admin/offers/bulk-update', checkExpressAdmin, async (req, res) => {
    try {
      const { offers } = req.body || {};
      if (!Array.isArray(offers)) {
        return res.status(400).json({ error: 'Paramètre "offers" (tableau) obligatoire.' });
      }
      const inputs = offers.map(o => ({
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
      const result = await db.bulkSaveManualOffers(inputs);
      res.json({
        success: true,
        updatedCount: result.count,
        historyCount: result.historyCount,
        offers: db.getAllOffers(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erreur sauvegarde lot.' });
    }
  });

  app.get('/api/admin/history/latest', checkExpressAdmin, (req, res) => {
    res.json({ lastObservations: db.getLastObservations() });
  });

  app.get('/api/admin/backup', checkExpressAdmin, (req, res) => {
    res.json(db.exportBackup());
  });

  app.post('/api/admin/backup', checkExpressAdmin, async (req, res) => {
    try {
      await db.importBackup(req.body || {});
      res.json({ success: true, message: 'Sauvegarde restaurée avec succès.' });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erreur lors de la restauration.' });
    }
  });

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

  // 3.b Rafraîchissement forcé des offres et connecteurs
  app.post('/api/offers/refresh', async (req, res) => {
    try {
      const result = await freshnessManager.ensureFreshness('manual_refresh', true);
      res.json({
        success: true,
        freshness: freshnessManager.getStatus(),
        result,
        offersCount: db.getAllOffers().length,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Erreur lors du rafraîchissement' });
    }
  });

  // 4. Historique réel des prix
  app.get('/api/history', (req, res) => {
    const { productId, editionType } = req.query;
    if (productId && editionType) {
      return res.json(db.getHistory(productId as string, editionType as ('digital' | 'disc')));
    }
    return res.json(db.getAllHistory());
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
      mode: (awinFnacConnector.isConfigured() || awinCdiscountConnector.isConfigured()) ? 'production' : 'not_configured',
      note: 'Les appels réseau vers Awin sont inactifs tant que les variables d\'environnement ne sont pas configurées.'
    });
  });

  // Déclencher la synchronisation des connecteurs Awin
  app.post('/api/connectors/awin/sync', async (req, res) => {
    try {
      const fnacResult = await awinFnacConnector.fetchAndSync();
      const cdisResult = await awinCdiscountConnector.fetchAndSync();
      res.json({
        fnac: fnacResult,
        cdiscount: cdisResult,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Erreur d\'exécution Awin' });
    }
  });

  // Tester n'importe quelle URL de flux externe en temps réel (diagnostic en direct)
  app.post('/api/connectors/test-url', async (req, res) => {
    const { url, apiKey } = req.body;
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return res.status(400).json({
        status: 'PARSE_ERROR',
        message: 'Paramètre "url" (commençant par http/https) obligatoire.',
      });
    }

    try {
      const headers: Record<string, string> = {
        'User-Agent': 'TRACKO-Price-Tracker/1.0 (+https://tracko.fr)',
        'Accept': 'application/json, text/csv, application/xml, text/xml, */*'
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(url, { method: 'GET', headers });
      const rawText = await response.text();
      const contentType = response.headers.get('content-type') || '';

      const testConnector = new (awinFnacConnector.constructor as any)({
        merchantId: 'test-direct',
        merchantName: 'Test Externe',
        feedUrlEnvVar: 'NONE',
        apiKeyEnvVar: 'NONE',
      });

      let records: any[] = [];
      let format = 'unknown';
      if (contentType.includes('json') || rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
        format = 'json';
        const parsed = JSON.parse(rawText);
        records = Array.isArray(parsed) ? parsed : (parsed.products || parsed.items || parsed.data || []);
      } else if (contentType.includes('xml') || rawText.trim().startsWith('<')) {
        format = 'xml';
        records = testConnector.parseXml(rawText);
      } else {
        format = 'csv';
        records = testConnector.parseCsv(rawText);
      }

      let ps5Matched = 0;
      let sampleMatch: any = null;
      for (const rec of records) {
        const matched = testConnector.matchPs5Product(rec);
        if (matched) {
          ps5Matched++;
          if (!sampleMatch) {
            sampleMatch = {
              product: matched.modelName,
              record: rec,
            };
          }
        }
      }

      res.json({
        httpStatus: response.status,
        httpStatusText: response.statusText,
        contentType,
        formatDetected: format,
        itemsTotal: records.length,
        ps5Matched,
        sampleMatch,
        previewRawBytes: rawText.length,
      });
    } catch (err: any) {
      res.status(500).json({
        status: 'FETCH_ERROR',
        error: err?.message,
      });
    }
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

  // Supprimer définitivement une alerte
  app.delete('/api/alerts/:id', (req, res) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Identifiant d\'alerte requis.' });
    }
    const result = alertManager.deleteAlert(id);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  });

  // Modifier le seuil de prix d'une alerte existante
  app.patch('/api/alerts/:id', (req, res) => {
    const { id } = req.params;
    const { targetPrice, active } = req.body;

    if (active !== undefined) {
      const toggleResult = alertManager.toggleAlertStatus(id, Boolean(active));
      return res.json(toggleResult);
    }

    if (targetPrice !== undefined) {
      const result = alertManager.updateAlertTargetPrice(id, Number(targetPrice));
      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.json(result);
    }

    return res.status(400).json({ success: false, message: 'Aucune modification fournie (targetPrice ou active).' });
  });

  // Page et endpoint de désinscription directe en 1 clic
  app.get('/api/alerts/unsubscribe', (req, res) => {
    const token = String(req.query.token || '');
    const result = alertManager.unsubscribeByToken(token);

    if (!result.success) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head><meta charset="UTF-8"><title>Désinscription TRACKO</title>
        <style>body{font-family:sans-serif;text-align:center;padding:50px;background:#f8fafc;color:#1e293b;}</style></head>
        <body>
          <h1>Lien invalide ou expiré</h1>
          <p>${result.message}</p>
          <a href="/" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#0f172a;color:#fff;text-decoration:none;border-radius:8px;">Retour à TRACKO</a>
        </body>
        </html>
      `);
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="UTF-8"><title>Désinscription confirmée - TRACKO</title>
      <style>body{font-family:sans-serif;text-align:center;padding:50px;background:#f8fafc;color:#1e293b;}</style></head>
      <body>
        <h1>Désinscription confirmée</h1>
        <p>${result.message}</p>
        <p>Vous ne recevrez plus d'emails pour cette alerte de prix.</p>
        <a href="/" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#0f172a;color:#fff;text-decoration:none;border-radius:8px;">Retour à TRACKO</a>
      </body>
      </html>
    `);
  });

  // Vérifier et évaluer manuellement les alertes (Test / Diagnostic)
  app.post('/api/alerts/evaluate', async (req, res) => {
    try {
      const evaluation = await alertManager.evaluateAlerts();
      res.json(evaluation);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erreur lors de l\'évaluation des alertes' });
    }
  });

  // Statut détaillé du service de notifications et de Resend
  app.get('/api/alerts/status', (req, res) => {
    res.json({
      alertEngine: 'operational',
      persistence: 'operational',
      resend: notificationService.getStatus(),
      activeAlertsCount: db.getActiveAlerts().length,
      allAlertsCount: db.getAllAlerts().length,
    });
  });

  // Liste anonymisée et protégée des alertes (pour diagnostic et validation)
  app.get('/api/alerts', (req, res) => {
    res.json(alertManager.getPublicAlertsSummary());
  });

  // Exécution de la suite de tests automatisés du moteur d'alertes
  app.get('/api/alerts/run-tests', async (req, res) => {
    try {
      const testResults = await runAlertEngineTests();
      // Ré-initialisation propre de la base avec les données réelles
      await freshnessManager.ensureFreshness('post_test_reset', true);
      res.json(testResults);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erreur lors des tests' });
    }
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
