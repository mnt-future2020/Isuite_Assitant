"use client";

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useLicenseAuth } from "@/app/ConvexClientProvider";
import { Sun, Bell, Cpu, Save } from "lucide-react";

export default function SettingsView() {
  const { user, licenseKey } = useLicenseAuth();
  const convexUser = useQuery(api.users.getMe, licenseKey ? { licenseKey } : "skip");
  const settings = useQuery(api.users.getSettings, convexUser ? { userId: convexUser._id } : "skip");
  const updateSettings = useMutation(api.users.updateSettings);

  const [localSettings, setLocalSettings] = useState({
    theme: 'light',
    preferredModel: 'claude-3-5-sonnet-latest',
    notificationsEnabled: true,
  });

  const initializedRef = React.useRef(false);
  
  useEffect(() => {
    if (settings && !initializedRef.current) {
      initializedRef.current = true;
      // Use microtask to avoid synchronous state update in effect
      Promise.resolve().then(() => {
        setLocalSettings({
          theme: settings.theme,
          preferredModel: settings.preferredModel,
          notificationsEnabled: settings.notificationsEnabled,
        });
      });
    }
  }, [settings]);

  const handleSave = async () => {
    if (!convexUser) return;
    await updateSettings({
      userId: convexUser._id,
      ...localSettings,
    });
  };

  return (
    <div className="settings-container" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="settings-header" style={{ marginBottom: '32px' }}>
        <h1 className="greeting-text" style={{ fontSize: '32px' }}>Settings</h1>
        <p className="tagline">Manage your workspace preferences</p>
      </div>

      <div className="settings-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="assistant .message-content" style={{ width: '100%', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)', background: 'var(--bg-white)', boxShadow: 'var(--shadow-premium)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Profile</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', fontWeight: 600 }}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>{user?.name || user?.email || 'User'}</div>
              <div style={{ color: 'var(--text-secondary)' }}>{user?.email}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'capitalize' }}>{user?.plan} Plan</div>
            </div>
          </div>
        </div>

        <div className="assistant .message-content" style={{ width: '100%', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)', background: 'var(--bg-white)', boxShadow: 'var(--shadow-premium)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Preferences</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Sun size={20} className="text-gray-400" />
                <span>Appearance</span>
              </div>
              <select 
                value={localSettings.theme}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, theme: e.target.value }))}
                className="control-btn" style={{ width: 'auto', padding: '0 12px', height: '36px', border: '1px solid var(--border-light)', background: 'white' }}
              >
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
                <option value="system">System Default</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Cpu size={20} className="text-gray-400" />
                <span>Default AI Model</span>
              </div>
              <select 
                value={localSettings.preferredModel}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, preferredModel: e.target.value }))}
                className="control-btn" style={{ width: 'auto', padding: '0 12px', height: '36px', border: '1px solid var(--border-light)', background: 'white' }}
              >
                <option value="claude-3-5-sonnet-latest">Claude 3.5 Sonnet</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Bell size={20} className="text-gray-400" />
                <span>Desktop Notifications</span>
              </div>
              <input 
                type="checkbox" 
                checked={localSettings.notificationsEnabled}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, notificationsEnabled: e.target.checked }))}
                style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-light)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={handleSave}
              className="send-btn" 
              style={{ width: 'auto', padding: '0 24px', display: 'flex', gap: '8px' }}
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
