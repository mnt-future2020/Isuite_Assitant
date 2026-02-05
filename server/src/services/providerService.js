import { getProvider, getAvailableProviders, initializeProviders } from '../../providers/index.js';

/**
 * Initialize all AI providers (Claude, Opencode)
 */
async function initProviders() {
    await initializeProviders();
}

/**
 * Get available provider names
 */
function listAvailableProviders() {
    return {
        providers: getAvailableProviders(),
        default: 'claude'
    };
}

/**
 * Get a specific provider instance by name
 */
function getProviderInstance(name) {
    return getProvider(name);
}

export { 
    initProviders, 
    listAvailableProviders, 
    getProviderInstance 
};
