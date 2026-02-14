"use client";

import { useQuery } from "convex/react";
import SettingsView from "@/components/SettingsView";
import AppSidebar from "@/components/AppSidebar";
import { api } from "../../../convex/_generated/api";
import {
  LicenseAuthenticated,
  LicenseUnauthenticated,
} from "../ConvexClientProvider";

export default function SettingsPage() {
  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AppSidebar />

      {/* Main Content */}
      <main className="main-content" style={{ 
        background: 'var(--bg-main)',
        flex: 1,
        transition: 'margin-left 0.3s ease-in-out',
        width: '100%'
      }}>
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
