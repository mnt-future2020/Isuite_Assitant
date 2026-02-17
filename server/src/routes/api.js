import express from 'express';
import * as chatController from '../controllers/chatController.js';
import * as integrationController from '../controllers/integrationController.js';
import * as uploadController from '../controllers/uploadController.js';
import { listAvailableProviders } from '../services/providerService.js';

const router = express.Router();

// Chat & Execution
router.post('/chat', chatController.chat);
router.post('/abort', chatController.abort);
router.post('/generate-title', chatController.generateTitle);

// Uploads
router.post('/upload', uploadController.uploadImage);

// Providers
router.get('/providers', (req, res) => res.json(listAvailableProviders()));

// Integrations
router.get('/apps', integrationController.getApps);
router.get('/connections', integrationController.getConnections);
router.post('/connect', integrationController.connect);
router.post('/disconnect', integrationController.disconnect);

// Health
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

export default router;
