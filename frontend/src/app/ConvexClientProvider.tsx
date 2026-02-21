"use client";

import { ConvexReactClient, ConvexProvider, useMutation, useQuery } from "convex/react";
import { ReactNode, createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { api } from "../../convex/_generated/api";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// ============================================================
// Session ID Management
// ============================================================

// Safe localStorage helpers — prevent crashes in restricted envs (storage full, iframe sandbox, privacy mode)
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    console.warn(`[Auth] Failed to read localStorage key: ${key}`);
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    console.warn(`[Auth] Failed to write localStorage key: ${key}`);
  }
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    console.warn(`[Auth] Failed to remove localStorage key: ${key}`);
  }
}

function getOrCreateSessionId(): string {
  const STORAGE_KEY = "isuite_session_id";
  let sessionId = safeGetItem(STORAGE_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    safeSetItem(STORAGE_KEY, sessionId);
  }
  return sessionId;
}

function clearSessionId(): void {
  safeRemoveItem("isuite_session_id");
}

// ============================================================
// License Auth Context
// ============================================================

type LicenseUser = {
  id: string;
  email: string;
  name?: string;
  plan: string;
  durationDays?: number;
  expiresAt?: number;
  daysRemaining?: number;
} | null;

type LicenseAuthContextType = {
  user: LicenseUser;
  licenseKey: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  daysRemaining: number | null;
  isExpired: boolean;
  isSessionConflict: boolean;
  activate: (key: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
};

const LicenseAuthContext = createContext<LicenseAuthContextType | null>(null);

export function useLicenseAuth() {
  const context = useContext(LicenseAuthContext);
  if (!context) {
    throw new Error("useLicenseAuth must be used within LicenseAuthProvider");
  }
  return context;
}

// ============================================================
// Inner Provider with Convex hooks
// ============================================================

function LicenseAuthProviderInner({ children }: { children: ReactNode }) {
  // Initialize from localStorage synchronously (avoids setState-in-effect)
  const [licenseKey, setLicenseKey] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return safeGetItem("isuite_license_key");
    }
    return null;
  });
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window !== "undefined" && safeGetItem("isuite_license_key")) {
      return getOrCreateSessionId();
    }
    return null;
  });
  const [user, setUser] = useState<LicenseUser>(null);
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== "undefined") {
      return !!safeGetItem("isuite_license_key");
    }
    return true;
  });
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isSessionConflict, setIsSessionConflict] = useState(false);

  const activateMutation = useMutation(api.licenses.activate);
  const logoutMutation = useMutation(api.licenses.logout);
  const heartbeatMutation = useMutation(api.licenses.heartbeat);

  const userQuery = useQuery(
    api.licenses.getUserByLicense,
    licenseKey ? { licenseKey, sessionId: sessionId || undefined } : "skip"
  );

  // Update user when query returns
  useEffect(() => {
    if (licenseKey && userQuery !== undefined) {
      if (userQuery === null) {
        // Invalid license — clear it
        safeRemoveItem("isuite_license_key");
        clearSessionId();
        setLicenseKey(null);
        setSessionId(null);
        setUser(null);
        setIsExpired(false);
        setIsSessionConflict(false);
      } else if ("expired" in userQuery && userQuery.expired) {
        // Subscription expired
        setIsExpired(true);
        setUser(null);
        setDaysRemaining(0);
      } else if ("sessionConflict" in userQuery && userQuery.sessionConflict) {
        // Key is active on another device
        setIsSessionConflict(true);
        setUser(null);
      } else if ("_id" in userQuery) {
        // Valid user
        setUser({
          id: userQuery._id,
          email: userQuery.email,
          name: userQuery.name,
          plan: userQuery.plan,
          durationDays: userQuery.durationDays,
          expiresAt: userQuery.expiresAt,
          daysRemaining: userQuery.daysRemaining,
        });
        setDaysRemaining(userQuery.daysRemaining ?? null);
        setIsExpired(false);
        setIsSessionConflict(false);
      }
      setIsLoading(false);
    }
  }, [userQuery, licenseKey]);

  // Heartbeat — update last active every 5 minutes
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (licenseKey && sessionId && user) {
      // Send immediate heartbeat
      heartbeatMutation({ licenseKey, sessionId }).catch(() => {});

      // Set up interval
      heartbeatRef.current = setInterval(() => {
        heartbeatMutation({ licenseKey, sessionId }).catch(() => {});
      }, 5 * 60 * 1000); // Every 5 minutes

      return () => {
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      };
    }
  }, [licenseKey, sessionId, user, heartbeatMutation]);

  // Activate — generates sessionId, locks the session server-side
  const activate = useCallback(async (key: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const sid = getOrCreateSessionId();
      const result = await activateMutation({ licenseKey: key, sessionId: sid });

      if (result.success && result.user) {
        safeSetItem("isuite_license_key", key);
        setLicenseKey(key);
        setSessionId(sid);
        setUser({
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          plan: result.plan,
          durationDays: result.durationDays,
          expiresAt: result.expiresAt,
          daysRemaining: result.daysRemaining,
        });
        setDaysRemaining(result.daysRemaining ?? null);
        setIsExpired(false);
        setIsSessionConflict(false);
        return { success: true };
      }
      return { success: false, error: result.error || "Activation failed" };
    } catch (err) {
      console.error("License activation error:", err);
      const message = err instanceof Error ? err.message : "Failed to validate license. Please try again.";
      return { success: false, error: message };
    }
  }, [activateMutation]);

  // Logout — clears session server-side first, then local state
  const logout = useCallback(async () => {
    if (licenseKey && sessionId) {
      try {
        await logoutMutation({ licenseKey, sessionId });
      } catch (e) {
        // Still proceed with local logout even if server call fails
        console.error("Server logout failed:", e);
      }
    }
    safeRemoveItem("isuite_license_key");
    clearSessionId();
    setLicenseKey(null);
    setSessionId(null);
    setUser(null);
    setDaysRemaining(null);
    setIsExpired(false);
    setIsSessionConflict(false);
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
  }, [licenseKey, sessionId, logoutMutation]);

  return (
    <LicenseAuthContext.Provider
      value={{
        user,
        licenseKey,
        isLoading,
        isAuthenticated: !!user,
        daysRemaining,
        isExpired,
        isSessionConflict,
        activate,
        logout,
      }}
    >
      {children}
    </LicenseAuthContext.Provider>
  );
}

// ============================================================
// Provider & Utility Components
// ============================================================

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <LicenseAuthProviderInner>{children}</LicenseAuthProviderInner>
    </ConvexProvider>
  );
}

export function LicenseAuthenticated({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useLicenseAuth();
  if (isLoading || !isAuthenticated) return null;
  return <>{children}</>;
}

export function LicenseUnauthenticated({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useLicenseAuth();
  if (isLoading || isAuthenticated) return null;
  return <>{children}</>;
}

export function LicenseLoading({ children }: { children: ReactNode }) {
  const { isLoading } = useLicenseAuth();
  if (!isLoading) return null;
  return <>{children}</>;
}
