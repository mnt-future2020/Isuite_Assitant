import { getOrCreateSession } from '../config/composio.js';
import { getProviderInstance } from '../services/providerService.js';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Initialize Anthropic client for quick title generation
const anthropic = new Anthropic();

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
        images = [], // Image attachments as base64
        chatId,
        userId = 'default-user',
        provider: providerName = 'claude',
        model = null
    } = req.body;

    console.log(`[CHAT] Request from ${userId} (${providerName}): ${message} - ChatId: ${chatId} - Images: ${images.length}`);

    if (!message && images.length === 0) {
        return res.status(400).json({ error: 'Message or images required' });
    }

    // Save images to temp files and build enhanced prompt
    let enhancedPrompt = message || '';
    const savedImagePaths = [];
    
    if (images.length > 0) {
        for (const img of images) {
            try {
                const imagePath = saveImageToTemp(img.data, img.name, img.type);
                savedImagePaths.push(imagePath);
            } catch (err) {
                console.error('[CHAT] Failed to save image:', err);
            }
        }
        
        if (savedImagePaths.length > 0) {
            // Prepend image context to the prompt
            const imageContext = savedImagePaths.map(p => 
                `[User attached an image file at: ${p}. Please use the Read tool to view and analyze this image.]`
            ).join('\n');
            enhancedPrompt = imageContext + '\n\n' + enhancedPrompt;
            console.log(`[CHAT] Enhanced prompt with ${savedImagePaths.length} image path(s)`);
        }
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
        const provider = getProviderInstance(providerName);

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
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
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
