import * as integrationService from '../services/integrationService.js';

async function getApps(req, res) {
    try {
        const apps = await integrationService.listApps();
        res.json({ toolkits: apps });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function getConnections(req, res) {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    
    try {
        const connections = await integrationService.listConnections(userId);
        res.json({ connections });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function connect(req, res) {
    // Use environment variable for default redirect URL
    // Frontend should provide this, but fallback to env var if not provided
    const defaultRedirectUrl = process.env.DEFAULT_REDIRECT_URL || 'http://localhost:3000';
    const { appName, userId, redirectUrl = defaultRedirectUrl } = req.body;
    if (!appName) return res.status(400).json({ error: 'appName is required' });
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    try {
        const result = await integrationService.initiateAppConnection(appName, userId, redirectUrl);
        
        if (!result.redirectUrl) {
            return res.status(500).json({ error: 'Failed to get redirect URL from Composio' });
        }
        
        // Return in the format the frontend expects
        res.json({ 
            connection: {
                redirectUrl: result.redirectUrl,
                connectionId: result.connectionId
            }
        });
    } catch (error) {
        console.error(`[CONTROLLER] Connection error:`, error.message);
        res.status(500).json({ error: error.message });
    }
}

async function disconnect(req, res) {
    const { connectionId } = req.body;
    if (!connectionId) return res.status(400).json({ error: 'connectionId is required' });

    try {
        const result = await integrationService.disconnectApp(connectionId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function getAppTools(req, res) {
    const { appName } = req.query;
    if (!appName) return res.status(400).json({ error: 'appName is required' });

    try {
        const tools = await integrationService.getAppTools(appName);
        res.json({ tools });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export { getApps, getConnections, connect, disconnect, getAppTools };
