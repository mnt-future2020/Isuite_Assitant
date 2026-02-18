import { getOrCreateSession } from '../config/composio.js';
import { getProviderInstance } from '../services/providerService.js';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Save base64 image to temp file and return the path
function saveImageToTemp(imageData, imageName, imageType) {
    const tempDir = path.join(os.tmpdir(), 'isuite-uploads');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Generate unique filename
    const ext = imageType.split('/')[1] || 'png';
    const filename = `${Date.now()}-${imageName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filepath = path.join(tempDir, filename);
    
    // Write base64 data to file
    const buffer = Buffer.from(imageData, 'base64');
    fs.writeFileSync(filepath, buffer);
    
    console.log(`[CHAT] Saved image to: ${filepath}`);
    return filepath;
}

/**
 * Handle streaming chat responses
 */
async function chat(req, res) {
    const {
        message,
        images = [], // Array of objects: { path, url, originalName }
        chatId,
        userId = 'default-user',
        provider: providerName = 'claude',
        model = null,
        anthropicApiKey = null // User's own API key
    } = req.body;

    console.log(`[CHAT] Request from ${userId} (${providerName}): ${message} - ChatId: ${chatId} - Images: ${images.length}`);

    if (!message && images.length === 0) {
        return res.status(400).json({ error: 'Message or images required' });
    }

    // Check if API key is provided for Claude provider
    if (providerName === 'claude' && !anthropicApiKey) {
        return res.status(400).json({ 
            error: 'Anthropic API key required. Please add your API key in Settings.' 
        });
    }

    // Build enhanced prompt with image references
    let enhancedPrompt = message || '';
    
    if (images.length > 0) {
        // Prepend image context to the prompt
        // We assume 'path' is the absolute path on the server file system
        const imageContext = images.map(img => 
            `[User attached an image file at: ${img.path}. Please use the Read tool to view and analyze this image.]`
        ).join('\n');
        enhancedPrompt = imageContext + '\n\n' + enhancedPrompt;
        console.log(`[CHAT] Enhanced prompt with ${images.length} image path(s)`);
    }

    // SSE Setup
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Processing request...' })}\n\n`);

    const heartbeatInterval = setInterval(() => {
        if (!res.writableEnded) res.write(': heartbeat\n\n');
    }, 15000);

    res.on('close', () => clearInterval(heartbeatInterval));

    try {
        const session = await getOrCreateSession(userId);
        
        // Temporarily set the API key in environment for this request
        const originalApiKey = process.env.ANTHROPIC_API_KEY;
        if (anthropicApiKey) {
            process.env.ANTHROPIC_API_KEY = anthropicApiKey;
        }
        
        try {
            const provider = getProviderInstance(providerName, { apiKey: anthropicApiKey });

            const mcpServers = {
                composio: {
                    type: 'http',
                    url: session.mcp.url,
                    headers: session.mcp.headers
                }
            };

            for await (const chunk of provider.query({
                prompt: enhancedPrompt, // Use enhanced prompt with image paths
                chatId,
                userId,
                mcpServers,
                model,
                allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep', 'WebSearch', 'WebFetch', 'TodoWrite', 'Skill'],
                maxTurns: 100
            })) {
                res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            }
        } finally {
            // Restore original API key
            if (originalApiKey !== undefined) {
                process.env.ANTHROPIC_API_KEY = originalApiKey;
            } else {
                delete process.env.ANTHROPIC_API_KEY;
            }
        }

        clearInterval(heartbeatInterval);
        if (!res.writableEnded) res.end();
    } catch (error) {
        clearInterval(heartbeatInterval);
        console.error('[CHAT] Controller Error:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
    }
}

/**
 * Handle request abortion
 */
async function abort(req, res) {
    const { chatId, provider: providerName = 'claude' } = req.body;

    if (!chatId) {
        return res.status(400).json({ error: 'chatId is required' });
    }

    try {
        const provider = getProviderInstance(providerName);
        const aborted = provider.abort(chatId);
        res.json({ success: aborted, message: aborted ? 'aborted' : 'none found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * Generate a concise title for a conversation based on user message
 */
async function generateTitle(req, res) {
    const { message, anthropicApiKey } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    if (!anthropicApiKey) {
        return res.status(400).json({ error: 'Anthropic API key required' });
    }

    try {
        const anthropic = new Anthropic({ apiKey: anthropicApiKey });
        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307', // Fast & cheap model for titles
            max_tokens: 20,
            messages: [
                {
                    role: 'user',
                    content: `Generate a concise 3-5 word title for a conversation that starts with this message. Return ONLY the title, nothing else.\n\nMessage: "${message.slice(0, 200)}"`
                }
            ]
        });

        const title = response.content[0]?.text?.trim() || message.slice(0, 40);
        res.json({ title });
    } catch (error) {
        // Fallback to simple truncation
        res.json({ title: message.slice(0, 40) + (message.length > 40 ? '...' : '') });
    }
}

export { chat, abort, generateTitle };
