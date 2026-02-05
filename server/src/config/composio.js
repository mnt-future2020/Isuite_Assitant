import { Composio } from "@composio/core";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get API key from environment
const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;

if (!COMPOSIO_API_KEY) {
  throw new Error("COMPOSIO_API_KEY is not set in environment variables");
}

const composio = new Composio({ apiKey: COMPOSIO_API_KEY });
const composioSessions = new Map();
let defaultComposioSession = null;

// Removed updateOpencodeConfig function - opencode.json is not used by the application

/**
 * Initialize a persistent Composio session for the default user
 */
async function initializeComposioSession() {
  const defaultUserId = "default-user";
  console.log("[COMPOSIO] Pre-initializing session for:", defaultUserId);
  try {
    defaultComposioSession = await composio.create(defaultUserId);
    composioSessions.set(defaultUserId, defaultComposioSession);
    console.log(
      "[COMPOSIO] Session ready with MCP URL:",
      defaultComposioSession.mcp.url,
    );

    // Removed opencode.json update - file is not used by the application
    console.log("[COMPOSIO] Default session initialized successfully");
    return defaultComposioSession;
  } catch (error) {
    console.error(
      "[COMPOSIO] Failed to pre-initialize session:",
      error.message,
    );
    throw error;
  }
}

/**
 * Get or create a Composio session for a specific user
 */
async function getOrCreateSession(userId = "default-user") {
  let session = composioSessions.get(userId);
  if (!session) {
    console.log("[COMPOSIO] Creating new session for user:", userId);
    session = await composio.create(userId);
    composioSessions.set(userId, session);
    console.log("[COMPOSIO] Session created for", userId);

    // Removed opencode.json update - file is not used by the application
  }
  return session;
}

export { composio, initializeComposioSession, getOrCreateSession };
