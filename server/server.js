import 'dotenv/config';
import createApp from './src/app.js';
import { initializeComposioSession } from './src/config/composio.js';
import { initProviders, listAvailableProviders } from './src/services/providerService.js';

const PORT = process.env.PORT || 3001;

async function bootstrap() {
    try {
        console.log('[BOOTSTRAP] Starting iSuite Assistant Backend...');
        
        // 1. Initialize AI Providers
        await initProviders();
        console.log(`[BOOTSTRAP] Providers initialized: ${listAvailableProviders().providers.join(', ')}`);

        // 2. Initialize Composio Session
        await initializeComposioSession();
        
        // 3. Create and Start App
        const app = createApp();
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n✓ AgentSuite Backend running on http://localhost:${PORT}`);
            console.log(`✓ Health check: http://localhost:${PORT}/api/health\n`);
        });

        // 4. Handle Lifecycle
        process.on('SIGINT', () => {
            console.log('\nShutting down...');
            server.close(() => process.exit(0));
        });

    } catch (error) {
        console.error('[BOOTSTRAP FATAL ERROR]', error);
        process.exit(1);
    }
}

bootstrap();

