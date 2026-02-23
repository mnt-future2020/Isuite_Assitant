"use client";

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useLicenseAuth } from "@/app/ConvexClientProvider";
import { Key, Save, Eye, EyeOff, Edit2, X, Crown, Calendar, CheckCircle2, AlertCircle } from "lucide-react";

export default function SettingsView() {
  const { user, licenseKey } = useLicenseAuth();
  const convexUser = useQuery(api.users.getMe, licenseKey ? { licenseKey } : "skip");
  const settings = useQuery(api.users.getSettings, convexUser ? { userId: convexUser._id } : "skip");
  const licenseValidation = useQuery(api.licenses.validate, licenseKey ? { licenseKey } : "skip");
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
  const [saveSuccess, setSaveSuccess] = useState(false);

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
      setSaveSuccess(true);
      setTimeout(() => {
        setIsSaving(false);
        setTimeout(() => setSaveSuccess(false), 2000);
      }, 500);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setLocalSettings(prev => ({ ...prev, anthropicApiKey: savedApiKey }));
    setIsEditingApiKey(false);
    setShowApiKey(false);
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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getDaysRemaining = (expiresAt: number) => {
    const now = new Date().getTime();
    const diff = expiresAt - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getPlanDisplayName = (plan: string) => {
    const planMap: Record<string, string> = {
      '20days': '20 Days',
      '30days': '30 Days',
      '90days': '90 Days',
      '365days': '1 Year'
    };
    return planMap[plan] || plan;
  };

  // Extract license data from validation response
  const license = licenseValidation && licenseValidation.valid ? {
    licenseKey: licenseKey || '',
    email: licenseValidation.email || '',
    plan: licenseValidation.plan || '',
    isActive: true,
    expiresAt: licenseValidation.expiresAt || 0,
    durationDays: licenseValidation.durationDays
  } : null;

  const isLoadingData = !settings || !licenseValidation;

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-serif font-medium text-foreground tracking-tight mb-2">Settings</h1>
          <p className="text-muted-foreground text-sm">Manage your account, subscription, and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Loading State */}
          {isLoadingData ? (
            <>
              {/* Plan Details Skeleton */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border bg-gradient-to-br from-background to-secondary/20">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-14 h-14 rounded-xl bg-secondary"
                        style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                      />
                      <div>
                        <div 
                          className="h-6 bg-secondary rounded mb-2"
                          style={{ width: '180px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                        />
                        <div 
                          className="h-4 bg-secondary rounded"
                          style={{ width: '140px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                        />
                      </div>
                    </div>
                    <div 
                      className="h-7 bg-secondary rounded-full"
                      style={{ width: '80px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                    />
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg bg-secondary"
                        style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                      />
                      <div className="flex-1">
                        <div 
                          className="h-3 bg-secondary rounded mb-2"
                          style={{ width: '80px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                        />
                        <div 
                          className="h-4 bg-secondary rounded"
                          style={{ width: '120px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Profile Skeleton */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div 
                  className="h-5 bg-secondary rounded mb-5"
                  style={{ width: '80px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                />
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-full bg-secondary"
                    style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                  />
                  <div className="flex-1">
                    <div 
                      className="h-5 bg-secondary rounded mb-2"
                      style={{ width: '160px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                    />
                    <div 
                      className="h-4 bg-secondary rounded"
                      style={{ width: '200px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                    />
                  </div>
                </div>
              </div>

              {/* API Configuration Skeleton */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div 
                  className="h-5 bg-secondary rounded mb-5"
                  style={{ width: '140px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                />
                <div className="space-y-4">
                  <div>
                    <div 
                      className="h-4 bg-secondary rounded mb-3"
                      style={{ width: '140px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                    />
                    <div 
                      className="h-12 bg-secondary rounded-xl"
                      style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                    />
                    <div 
                      className="h-3 bg-secondary rounded mt-2"
                      style={{ width: '280px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Plan Details Section */}
              {license && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-border bg-gradient-to-br from-background to-secondary/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center">
                      <Crown className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground mb-1">
                        {getPlanDisplayName(license.plan)} Plan
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {license.isActive ? 'Active subscription' : 'Inactive subscription'}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                    license.isActive 
                      ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                      : 'bg-red-500/10 text-red-600 border border-red-500/20'
                  }`}>
                    {license.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Expires On</p>
                    <p className="text-sm font-medium text-foreground">{formatDate(license.expiresAt)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Days Remaining</p>
                    <p className="text-sm font-medium text-foreground">
                      {getDaysRemaining(license.expiresAt)} days
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <Key className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">License Key</p>
                    <p className="text-sm font-mono font-medium text-foreground truncate max-w-[180px]">
                      {license.licenseKey}
                    </p>
                  </div>
                </div>
              </div>

              {getDaysRemaining(license.expiresAt) < 7 && license.isActive && (
                <div className="px-6 pb-6">
                  <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                        Subscription Expiring Soon
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-200">
                        Your subscription will expire in {getDaysRemaining(license.expiresAt)} days. 
                        Renew now to continue using iSuite without interruption.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile Section */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-5">Profile</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-2xl font-semibold shadow-md">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">
                  {user?.name || user?.email || 'User'}
                </p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* API Configuration Section */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-foreground">API Configuration</h2>
              {saveSuccess && (
                <div className="flex items-center gap-2 text-green-600 text-sm animate-in fade-in slide-in-from-right-2 duration-300">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Saved successfully</span>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                  <Key className="w-4 h-4 text-muted-foreground" />
                  Anthropic API Key
                </label>
                
                <div className="relative">
                  <input 
                    type={showApiKey && isEditingApiKey ? "text" : "password"}
                    placeholder="sk-ant-api03-..."
                    value={displayApiKey()}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, anthropicApiKey: e.target.value }))}
                    onFocus={() => setIsEditingApiKey(true)}
                    disabled={!isEditingApiKey && savedApiKey !== ''}
                    className={`w-full px-4 py-3 pr-12 border rounded-xl font-mono text-sm transition-all outline-none ${
                      isEditingApiKey 
                        ? 'border-primary bg-background focus:ring-2 focus:ring-primary/20' 
                        : 'border-border bg-secondary/50 cursor-not-allowed'
                    }`}
                  />
                  
                  {isEditingApiKey && (
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-secondary rounded-md transition-colors"
                      type="button"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  )}
                  
                  {!isEditingApiKey && savedApiKey && (
                    <button
                      onClick={handleEditApiKey}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-secondary rounded-md transition-colors"
                      title="Edit API Key"
                      type="button"
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Enter your own Anthropic API key to use Claude models. Get one at{' '}
                  <a 
                    href="https://console.anthropic.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary hover:underline"
                  >
                    console.anthropic.com
                  </a>
                </p>
              </div>

              {isEditingApiKey && (
                <div className="flex items-center gap-3 pt-2">
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-foreground rounded-xl font-medium text-sm hover:bg-secondary/80 transition-all"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
