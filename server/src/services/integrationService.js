import { composio, getOrCreateSession } from '../config/composio.js';

/**
 * List all available toolkits/apps from Composio
 */
async function listApps() {
    const toolkits = await composio.toolkits.get();
    
    return (toolkits || []).map(t => ({
        id: t.slug,
        name: t.name,
        appName: t.slug,
        description: t.meta?.description || '',
        logo: t.meta?.logo || '',
        categories: (t.meta?.categories || []).map(c => c.name)
    }));
}

/**
 * List active connections for a specific user
 */
async function listConnections(userId = 'default-user') {
    try {
        // Get user's session to list their toolkits and connection status
        const session = await getOrCreateSession(userId);
        const toolkitsResponse = await session.toolkits();
        
        // Extract items array from response
        const toolkitsList = toolkitsResponse?.items || (Array.isArray(toolkitsResponse) ? toolkitsResponse : []);
        
        // Filter to only connected accounts - check isActive (camelCase)
        const connections = toolkitsList
            .filter(t => t.connection?.isActive === true)
            .map(t => ({
                id: t.connection?.connectedAccount?.id || `${userId}_${t.slug}`,
                appName: t.slug,
                status: 'ACTIVE',
                userId: userId
            }));
        
        return connections;
    } catch (error) {
        console.error(`[SERVICE] Error fetching connections:`, error.message);
        return [];
    }
}

/**
 * Initiate app connection using session.authorize()
 */
async function initiateAppConnection(appName, userId, redirectUrl) {
    try {
        // Get or create session for the user
        const session = await getOrCreateSession(userId);
        
        // Use session.authorize() to generate Connect Link
        // This is the documented way to manually authenticate
        const connectionRequest = await session.authorize(appName);
        
        // Try different property names that Composio might use
        const redirectUrl2 = connectionRequest?.redirect_url || 
                            connectionRequest?.redirectUrl || 
                            connectionRequest?.connection_url ||
                            connectionRequest?.authUrl;
        
        const connectionId = connectionRequest?.id || 
                            connectionRequest?.connection_id ||
                            connectionRequest?.connectionId;
        
        if (!redirectUrl2) {
            throw new Error(`No redirect URL in Composio response. Response keys: ${Object.keys(connectionRequest || {}).join(', ')}`);
        }
        
        // Return the redirect URL and other info
        return {
            redirectUrl: redirectUrl2,
            connectionId: connectionId,
            status: 'INITIATED'
        };

    } catch (error) {
        console.error(`[SERVICE] Connection initiation failed for ${appName}:`, error.message);
        throw error;
    }
}

/**
 * Disconnect an app by connection ID
 */
async function disconnectApp(connectionId) {
    try {
        await composio.connectedAccounts.delete(connectionId);
        return { success: true };
    } catch (error) {
        console.error(`[SERVICE] Failed to disconnect ${connectionId}:`, error.message);
        throw error;
    }
}

export {
    listApps,
    listConnections,
    initiateAppConnection,
    disconnectApp
};
