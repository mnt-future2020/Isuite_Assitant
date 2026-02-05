"use client";

import { ConvexReactClient, ConvexProvider, useMutation, useQuery } from "convex/react";
import { ReactNode, createContext, useContext, useState, useEffect } from "react";
import { api } from "../../convex/_generated/api";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// License Auth Context
type LicenseUser = {
  id: string;
  email: string;
  name?: string;
  plan: string;
  expiresAt?: number;
} | null;

type LicenseAuthContextType = {
  user: LicenseUser;
  licenseKey: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  activate: (key: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
};

const LicenseAuthContext = createContext<LicenseAuthContextType | null>(null);

export function useLicenseAuth() {
  const context = useContext(LicenseAuthContext);
  if (!context) {
    throw new Error("useLicenseAuth must be used within LicenseAuthProvider");
  }
  return context;
}

// Inner provider that uses Convex hooks
function LicenseAuthProviderInner({ children }: { children: ReactNode }) {
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [user, setUser] = useState<LicenseUser>(null);
  const [isLoading, setIsLoading] = useState(true);

  const activateMutation = useMutation(api.licenses.activate);
  const userQuery = useQuery(
    api.licenses.getUserByLicense,
    licenseKey ? { licenseKey } : "skip"
  );

  // Load license key from localStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem("isuite_license_key");
    if (storedKey) {
      setLicenseKey(storedKey);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Update user when query returns
  useEffect(() => {
    if (licenseKey && userQuery !== undefined) {
      if (userQuery) {
        setUser({
          id: userQuery._id,
          email: userQuery.email,
          name: userQuery.name,
          plan: userQuery.plan,
          expiresAt: userQuery.expiresAt,
        });
      } else {
        // Invalid license - clear it
        localStorage.removeItem("isuite_license_key");
        setLicenseKey(null);
        setUser(null);
      }
      setIsLoading(false);
    }
  }, [userQuery, licenseKey]);

  const activate = async (key: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await activateMutation({ licenseKey: key });
      if (result.success && result.user) {
        localStorage.setItem("isuite_license_key", key);
        setLicenseKey(key);
        setUser({
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          plan: result.plan,
          expiresAt: result.expiresAt,
        });
        return { success: true };
      }
      return { success: false, error: result.error || "Activation failed" };
    } catch (error) {
      return { success: false, error: "Failed to validate license" };
    }
  };

  const logout = () => {
    localStorage.removeItem("isuite_license_key");
    setLicenseKey(null);
    setUser(null);
  };

  return (
    <LicenseAuthContext.Provider
      value={{
        user,
        licenseKey,
        isLoading,
        isAuthenticated: !!user,
        activate,
        logout,
      }}
    >
      {children}
    </LicenseAuthContext.Provider>
  );
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <LicenseAuthProviderInner>{children}</LicenseAuthProviderInner>
    </ConvexProvider>
  );
}

// Utility components to replace Clerk's Authenticated/Unauthenticated
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
