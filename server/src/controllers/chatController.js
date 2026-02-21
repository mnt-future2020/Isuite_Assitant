import { getOrCreateSession } from '../config/composio.js';
import { getProviderInstance } from '../services/providerService.js';
import { convex } from '../config/convex.js';
import { anyApi } from 'convex/server';
const api = anyApi;
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

// Throttle interval for flushing content to Convex (ms)
const FLUSH_INTERVAL_MS = 500;

/**
 * Handle streaming chat responses
 * The server persists AI responses directly to Convex and continues 
 * generating even if the client disconnects (like ChatGPT/Grok/Gemini).
 */
async function chat(req, res) {
    const {
        message,
        images = [], // Array of objects: { path, url, originalName }
        chatId,
        userId = 'default-user',
        provider: providerName = 'claude',
        model = null,
        anthropicApiKey = null, // User's own API key
        assistantMessageId = null // Convex message ID for the assistant placeholder
    } = req.body;

    console.log(`[CHAT] Request from ${userId} (${providerName}): ${(message || '').slice(0, 80)}... - ChatId: ${chatId} - Images: ${images.length} - AssistantMsgId: ${assistantMessageId}`);

    if (!message && images.length === 0) {
        return res.status(400).json({ error: 'Message or images required' });
    }

    // Input length validation — prevent excessive token usage
    if (message && message.length > 100000) {
        return res.status(400).json({ error: 'Message too long. Maximum 100,000 characters allowed.' });
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

    // Track client connection status
    let clientConnected = true;
    res.on('close', () => {
        clientConnected = false;
        clearInterval(heartbeatInterval);
        console.log(`[CHAT] Client disconnected for chatId: ${chatId} - continuing generation in background`);
    });

    try {
        const session = await getOrCreateSession(userId);
        // Note: API key is passed directly to the provider instance below.
        // We do NOT set process.env.ANTHROPIC_API_KEY (thread-unsafe for concurrent requests).
        
        // Run the streaming in a detached manner — won't stop on client disconnect
        const streamingPromise = (async () => {
            let fullAssistantContent = '';
            let lastFlushedContent = '';
            let flushTimer = null;

            // Throttled flush to Convex
            const flushToConvex = async (content, force = false) => {
                if (!assistantMessageId || content === lastFlushedContent) return;
                
                if (force) {
                    if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
                    lastFlushedContent = content;
                    try {
                        await convex.mutation(api.messages.updateContent, {
                            messageId: assistantMessageId,
                            content,
                        });
                    } catch (err) {
                        console.error('[CHAT] Failed to flush content to Convex:', err.message);
                    }
                } else if (!flushTimer) {
                    flushTimer = setTimeout(async () => {
                        flushTimer = null;
                        lastFlushedContent = fullAssistantContent;
                        try {
                            await convex.mutation(api.messages.updateContent, {
                                messageId: assistantMessageId,
                                content: fullAssistantContent,
                            });
                        } catch (err) {
                            console.error('[CHAT] Failed to flush content to Convex:', err.message);
                        }
                    }, FLUSH_INTERVAL_MS);
                }
            };

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
                    prompt: enhancedPrompt,
                    chatId,
                    userId,
                    mcpServers,
                    model,
                    allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep', 'WebSearch', 'WebFetch', 'TodoWrite', 'Skill'],
                    maxTurns: 100
                })) {
                    // Accumulate content if it's text
                    if (chunk.type === 'text') {
                        fullAssistantContent += chunk.content;
                        // Throttled flush to Convex (runs regardless of client connection)
                        flushToConvex(fullAssistantContent);
                    }

                    // Stream to client only if still connected
                    if (clientConnected && !res.writableEnded) {
                        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
                    }
                }

                // Generation complete — final flush + mark as complete
                if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }

                if (assistantMessageId) {
                    try {
                        await convex.mutation(api.messages.updateStatus, {
                            messageId: assistantMessageId,
                            status: 'complete',
                            content: fullAssistantContent,
                        });
                        console.log(`[CHAT] Marked message ${assistantMessageId} as complete (${fullAssistantContent.length} chars)`);
                    } catch (err) {
                        console.error('[CHAT] Failed to mark message complete:', err.message);
                    }
                }
            } catch (error) {
                console.error('[CHAT] Streaming error:', error);

                // Save partial content on error
                if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
                
                if (assistantMessageId) {
                    try {
                        await convex.mutation(api.messages.updateStatus, {
                            messageId: assistantMessageId,
                            status: 'error',
                            content: fullAssistantContent || undefined,
                        });
                    } catch (err) {
                        console.error('[CHAT] Failed to mark message as error:', err.message);
                    }
                }

                // Send error to client if still connected
                if (clientConnected && !res.writableEnded) {
                    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
                }
            } finally {

                // Close SSE if client still connected
                clearInterval(heartbeatInterval);
                if (clientConnected && !res.writableEnded) {
                    res.end();
                }
            }
        })();

        // Don't await the promise — let it run in the background
        // This way even if the client disconnects, the generation continues
        streamingPromise.catch(err => {
            console.error('[CHAT] Background streaming error:', err);
        });

    } catch (error) {
        clearInterval(heartbeatInterval);
        console.error('[CHAT] Controller Error:', error);
        if (clientConnected && !res.writableEnded) {
            res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
            res.end();
        }
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
