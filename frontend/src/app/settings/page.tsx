"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import SettingsView from "@/components/SettingsView";
import { api } from "../../../convex/_generated/api";
import { Menu, Bot, MessageCircle, Puzzle, Cog, Key, LogOut } from "lucide-react";
import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  useLicenseAuth,
  LicenseAuthenticated,
  LicenseUnauthenticated,
  LicenseLoading,
} from "../ConvexClientProvider";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// License Key Input Component
function LicenseKeyInput() {
  const [licenseKey, setLicenseKey] = useState("");
  const [error, setError] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const { activate } = useLicenseAuth();

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setError("Please enter a license key");
      return;
    }
    setIsActivating(true);
    setError("");
    const result = await activate(licenseKey.trim());
    if (!result.success) {
      setError(result.error || "Invalid license key");
    }
    setIsActivating(false);
  };

  return (
    <div style={{ padding: "12px" }}>
      <div
        style={{ marginBottom: 8, fontSize: 12, color: "var(--text-secondary)" }}
      >
        Enter your license key to activate
      </div>
      <input
        type="text"
        placeholder="XXXX-XXXX-XXXX-XXXX"
        value={licenseKey}
        onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
        style={{
          width: "100%",
          padding: "8px 12px",
          borderRadius: 6,
          border: "1px solid var(--border-light)",
          marginBottom: 8,
          fontSize: 13,
          fontFamily: "monospace",
        }}
      />
      {error && (
        <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 8 }}>
          {error}
        </div>
      )}
      <button
        onClick={handleActivate}
        disabled={isActivating}
        className="nav-item w-full justify-center"
        style={{
          background: "var(--accent-primary)",
          color: "white",
          border: "none",
          opacity: isActivating ? 0.7 : 1,
        }}
      >
        <Key size={16} />
        <span>{isActivating ? "Activating..." : "Activate License"}</span>
      </button>
    </div>
  );
}

// User License Card Component
function UserLicenseCard() {
  const { user, logout } = useLicenseAuth();

  if (!user) return null;

  return (
    <div
      className="user-card"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--accent-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {user.email?.charAt(0).toUpperCase() || "U"}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>
            {user.name || user.email}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              textTransform: "capitalize",
            }}
          >
            {user.plan} Plan
          </div>
        </div>
      </div>
      <button
        onClick={logout}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 6,
          borderRadius: 4,
          color: "var(--text-secondary)",
        }}
        title="Sign out"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const router = useRouter();

  return (
    <div className="app-container">
      {/* Left Sidebar - Navigation */}
      <aside
        className={cn("left-sidebar", !isSidebarOpen && "hidden")}
        style={{ display: "flex", flexDirection: "column", height: "100vh" }}
      >
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <Bot size={18} />
          </div>
          <span className="brand-name">iSuite Assistant</span>
        </div>

        <nav className="nav-section">
          <button className="nav-item" onClick={() => router.push("/")}>
            <MessageCircle size={18} />
            <span>AI Chat</span>
          </button>
          <button
            className="nav-item"
            onClick={() => router.push("/integrations")}
          >
            <Puzzle size={18} />
            <span>Integrations</span>
          </button>
          <button
            className="nav-item active"
            onClick={() => router.push("/settings")}
          >
            <Cog size={18} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="user-profile-section" style={{ marginTop: "auto" }}>
          <LicenseAuthenticated>
            <UserLicenseCard />
          </LicenseAuthenticated>
          <LicenseUnauthenticated>
            <LicenseKeyInput />
          </LicenseUnauthenticated>
          <LicenseLoading>
            <div className="user-card animate-pulse">
              <div className="user-avatar-sm bg-gray-200"></div>
              <div className="user-info-sm h-4 w-24 bg-gray-200 rounded"></div>
            </div>
          </LicenseLoading>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content" style={{ background: "var(--bg-main)" }}>
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            style={{
              position: "absolute",
              left: 16,
              top: 16,
              zIndex: 50,
              padding: 8,
              background: "white",
              borderRadius: 8,
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            }}
          >
            <Menu size={20} />
          </button>
        )}

        <LicenseAuthenticated>
          <SettingsView />
        </LicenseAuthenticated>

        <LicenseUnauthenticated>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100vh",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>
                Please Activate License
              </h1>
              <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
                Enter your license key in the sidebar to access settings
              </p>
            </div>
          </div>
        </LicenseUnauthenticated>
      </main>
    </div>
  );
}
