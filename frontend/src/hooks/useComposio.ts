"use client";

import { useState, useCallback, useEffect } from "react";

export type Toolkit = {
  name: string;
  appName: string;
  description: string;
  id: string;
  logo?: string;
};

export type Connection = {
  id: string;
  appName: string;
  status: string;
  userId: string;
};

// Get API URL from environment
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useComposio(userId?: string) {
  const [toolkits, setToolkits] = useState<Toolkit[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);
  const [previousConnectionCount, setPreviousConnectionCount] = useState(0);

  const fetchApps = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/apps`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setToolkits(data.toolkits || []);
    } catch (error) {
      console.error("Failed to fetch toolkits:", error);
    }
  }, []);

  const fetchConnections = useCallback(async () => {
    if (!userId) {
        setConnections([]);
        return;
    }
    try {
      const response = await fetch(`${API_URL}/api/connections?userId=${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Only update if we have connections, don't clear existing connections with empty results
      if (data.connections && data.connections.length > 0) {
        // Check if a new connection was added (connection count increased)
        if (data.connections.length > previousConnectionCount && popupWindow) {
          // Close the popup window after a short delay to ensure the connection is fully established
          setTimeout(() => {
            if (!popupWindow.closed) {
              popupWindow.close();
            }
            setPopupWindow(null);
          }, 1000);
        }
        setPreviousConnectionCount(data.connections.length);
        setConnections(data.connections);
      }
    } catch (error) {
      console.error("Failed to fetch connections:", error);
    }
  }, [userId, popupWindow, previousConnectionCount]);

  const initiateConnection = useCallback(async (appName: string) => {
    if (!userId) {
        alert("Please log in to connect apps.");
        return;
    }
    try {
      const response = await fetch(`${API_URL}/api/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appName, userId }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        alert(`Connection failed: ${data.error}`);
        return;
      }

      if (data.connection && data.connection.redirectUrl) {
        // Add callback URL to close popup after success
        const callbackUrl = `${window.location.origin}/api/connection-callback`;
        const redirectUrlWithCallback = new URL(data.connection.redirectUrl);
        redirectUrlWithCallback.searchParams.append('callbackUrl', callbackUrl);
        
        // Open as a centered popup
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
          redirectUrlWithCallback.toString(), 
          "Connect App", 
          `width=${width},height=${height},top=${top},left=${left},status=yes,scrollbars=yes`
        );
        
        // Store popup reference for auto-close
        if (popup) {
          setPopupWindow(popup);
          
          // Monitor popup for close or redirect
          const checkPopup = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkPopup);
              setPopupWindow(null);
              // Refresh connections after popup closes
              fetchConnections();
            }
          }, 500);
        }
      } else {
        alert("Failed to get redirect URL from server.");
      }
    } catch (error) {
      console.error("Failed to initiate connection:", error);
      const message = error instanceof Error ? error.message : String(error);
      alert(`Connection error: ${message}`);
    }
  }, [userId, fetchConnections]);

  const disconnectApp = useCallback(async (connectionId: string) => {
    console.log(`[DISCONNECT] Attempting to disconnect connection: ${connectionId}`);
    try {
      const response = await fetch(`${API_URL}/api/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[DISCONNECT] Server returned error:`, errorData);
        alert(`Failed to disconnect: ${errorData.error || response.statusText}`);
        return;
      }

      console.log(`[DISCONNECT] Successfully disconnected: ${connectionId}`);
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    } catch (error) {
      console.error("[DISCONNECT] Failed to disconnect app:", error);
      alert(`Disconnect error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  useEffect(() => {
    fetchApps();
    fetchConnections();

    // Poll for status updates every 5 seconds
    const intervalId = setInterval(() => {
      fetchConnections();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchApps, fetchConnections]);

  return {
    toolkits,
    connections,
    isLoading,
    initiateConnection,
    disconnectApp,
    refresh: () => { fetchApps(); fetchConnections(); }
  };
}
