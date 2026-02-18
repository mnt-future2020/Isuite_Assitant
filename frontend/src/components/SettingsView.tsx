"use client";

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useLicenseAuth } from "@/app/ConvexClientProvider";
import { Key, Save, Eye, EyeOff, Edit2 } from "lucide-react";

export default function SettingsView() {
  const { user, licenseKey } = useLicenseAuth();
  const convexUser = useQuery(api.users.getMe, licenseKey ? { licenseKey } : "skip");
  const settings = useQuery(api.users.getSettings, convexUser ? { userId: convexUser._id } : "skip");
  const updateSettings = useMutation(api.users.updateSettings);

  const [localSettings, setLocalSettings] = useState({
    theme: 'light',
    preferredModel: 'claude-3-5-sonnet-latest',
    notificationsEnabled: true,
    anthropicApiKey: '',
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingApiKey, setIsEditingApiKey] = useState(false);
  const [savedApiKey, setSavedApiKey] = useState('');

  const initializedRef = React.useRef(false);
  
  useEffect(() => {
    if (settings && !initializedRef.current) {
      initializedRef.current = true;
      Promise.resolve().then(() => {
        setLocalSettings({
          theme: settings.theme,
          preferredModel: settings.preferredModel,
          notificationsEnabled: settings.notificationsEnabled,
          anthropicApiKey: settings.anthropicApiKey || '',
        });
        setSavedApiKey(settings.anthropicApiKey || '');
      });
    }
  }, [settings]);

  const maskApiKey = (key: string) => {
    if (!key || key.length < 20) return key;
    const start = key.substring(0, 15);
    const end = key.substring(key.length - 4);
    const masked = '•'.repeat(Math.min(key.length - 19, 30));
    return `${start}${masked}${end}`;
  };

  const handleSave = async () => {
    if (!convexUser) return;
    setIsSaving(true);
    try {
      await updateSettings({
        userId: convexUser._id,
        ...localSettings,
      });
      setSavedApiKey(localSettings.anthropicApiKey);
      setIsEditingApiKey(false);
      setShowApiKey(false);
      setTimeout(() => setIsSaving(false), 500);
    } catch (error) {
      setIsSaving(false);
    }
  };

  const handleEditApiKey = () => {
    setIsEditingApiKey(true);
    setShowApiKey(false);
  };

  const displayApiKey = () => {
    if (isEditingApiKey) {
      return localSettings.anthropicApiKey;
    }
    return savedApiKey ? maskApiKey(savedApiKey) : '';
  };

  return (
    <div className="settings-container" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="settings-header" style={{ marginBottom: '32px' }}>
        <h1 className="greeting-text" style={{ fontSize: '32px' }}>Settings</h1>
        <p className="tagline">Manage your workspace preferences</p>
      </div>

      <div className="settings-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Profile Section */}
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

        {/* API Configuration Section */}
        <div className="assistant .message-content" style={{ width: '100%', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)', background: 'var(--bg-white)', boxShadow: 'var(--shadow-premium)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>API Configuration</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Key size={20} style={{ color: '#9ca3af' }} />
              <span style={{ fontWeight: 500 }}>Anthropic API Key</span>
            </div>
            
            <div style={{ position: 'relative' }}>
              <input 
                type={showApiKey && isEditingApiKey ? "text" : "password"}
                placeholder="sk-ant-api03-..."
                value={displayApiKey()}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, anthropicApiKey: e.target.value }))}
                onFocus={() => setIsEditingApiKey(true)}
                disabled={!isEditingApiKey && savedApiKey !== ''}
                style={{ 
                  width: '100%', 
                  padding: '12px 48px 12px 16px', 
                  border: '1px solid var(--border-light)', 
                  borderRadius: '8px',
                  background: (!isEditingApiKey && savedApiKey) ? '#f9fafb' : 'white',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  cursor: (!isEditingApiKey && savedApiKey) ? 'not-allowed' : 'text'
                }}
                onFocusCapture={(e) => {
                  if (isEditingApiKey) {
                    e.target.style.borderColor = 'var(--accent-primary)';
                  }
                }}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
              />
              
              {/* Show eye icon only when editing */}
              {isEditingApiKey && (
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#9ca3af'
                  }}
                >
                  {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              )}
              
              {/* Show edit icon when not editing and key exists */}
              {!isEditingApiKey && savedApiKey && (
                <button
                  onClick={handleEditApiKey}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#9ca3af'
                  }}
                  title="Edit API Key"
                >
                  <Edit2 size={18} />
                </button>
              )}
            </div>
            
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: '1.5' }}>
              Enter your own Anthropic API key to use Claude models. Get one at <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>console.anthropic.com</a>
            </p>
          </div>
        </div>

        {/* Save Button - Only show when editing */}
        {isEditingApiKey && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="send-btn" 
              style={{ 
                width: 'auto', 
                padding: '12px 32px', 
                display: 'flex', 
                alignItems: 'center',
                gap: '8px',
                opacity: isSaving ? 0.7 : 1,
                cursor: isSaving ? 'not-allowed' : 'pointer'
              }}
            >
              <Save size={18} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
