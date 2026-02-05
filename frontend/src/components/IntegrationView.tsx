"use client";

import { useComposio } from "@/hooks/useComposio";
import { useLicenseAuth } from "@/app/ConvexClientProvider";
import { ExternalLink, Check, Plus, RefreshCw, Unlink, Search } from "lucide-react";
import Image from "next/image";
import { useState, useMemo } from "react";

export default function IntegrationView() {
  const { licenseKey } = useLicenseAuth();
  const { toolkits, connections, isLoading, initiateConnection, disconnectApp, refresh } = useComposio(licenseKey || undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<'ALL' | 'CONNECTED'>('ALL');

  const filteredToolkits = useMemo(() => {
    const isConnected = (appName: string) => {
      return connections.some(c => 
        c.appName.toLowerCase() === appName.toLowerCase() && 
        (c.status.toUpperCase() === 'ACTIVE' || c.status.toUpperCase() === 'CONNECTED')
      );
    };

    return toolkits.filter(toolkit => {
      const matchesSearch = 
        toolkit.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        toolkit.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const connected = isConnected(toolkit.appName);
      const matchesFilter = filter === 'ALL' || (filter === 'CONNECTED' && connected);

      return matchesSearch && matchesFilter;
    });
  }, [toolkits, connections, searchQuery, filter]);

  const isConnected = (appName: string) => {
    return connections.some(c => 
      c.appName.toLowerCase() === appName.toLowerCase() && 
      (c.status.toUpperCase() === 'ACTIVE' || c.status.toUpperCase() === 'CONNECTED')
    );
  };

  const getConnectionId = (appName: string) => {
    return connections.find(c => 
      c.appName.toLowerCase() === appName.toLowerCase() && 
      (c.status.toUpperCase() === 'ACTIVE' || c.status.toUpperCase() === 'CONNECTED')
    )?.id || connections.find(c => c.appName.toLowerCase() === appName.toLowerCase())?.id;
  };

  return (
    <div style={{ padding: '40px', background: 'var(--bg-main)', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Integrations</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Connect your favorite tools to supercharge your Workspace Agents.</p>
          </div>
          <button 
            onClick={refresh}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', width: '380px', maxWidth: '100%' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} size={18} />
            <input 
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="message-input"
              style={{
                background: 'var(--bg-white)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                padding: '10px 12px 10px 40px',
                fontSize: '14px',
                width: '100%',
                maxHeight: '44px',
                minHeight: '44px'
              }}
            />
          </div>
          
          <div style={{ background: 'var(--bg-white)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-light)', display: 'flex' }}>
            <button
              onClick={() => setFilter('ALL')}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                background: filter === 'ALL' ? 'var(--bg-main)' : 'transparent',
                color: filter === 'ALL' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                transition: 'all 0.2s'
              }}
            >
              All Apps
            </button>
            <button
              onClick={() => setFilter('CONNECTED')}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                background: filter === 'CONNECTED' ? 'var(--bg-main)' : 'transparent',
                color: filter === 'CONNECTED' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                transition: 'all 0.2s'
              }}
            >
              Connected
            </button>
          </div>
        </div>
      </div>

      {isLoading && toolkits.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--accent-primary)', marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading integrations...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {filteredToolkits.map((toolkit) => {
            const connected = isConnected(toolkit.appName);
            const connId = getConnectionId(toolkit.appName);

            return (
              <div 
                key={toolkit.id} 
                style={{
                    background: 'var(--bg-white)',
                    border: connected ? '1px solid #bbf7d0' : '1px solid var(--border-light)',
                    borderRadius: '12px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s',
                    boxShadow: connected ? '0 1px 2px rgba(0,255,0,0.05)' : 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '10px', 
                      background: 'var(--bg-white)',
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                  }}>
                    {toolkit.logo ? (
                      <Image 
                        src={toolkit.logo} 
                        alt={toolkit.name} 
                        style={{ objectFit: 'contain' }}
                        width={32}
                        height={32}
                        unoptimized
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {toolkit.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  {connected && (
                    <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px', 
                        fontSize: '11px', 
                        fontWeight: 600, 
                        color: '#166534', 
                        background: '#dcfce7', 
                        padding: '4px 8px', 
                        borderRadius: '12px' 
                    }}>
                      <Check size={12} /> Active
                    </span>
                  )}
                </div>
                
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{toolkit.name}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5', minHeight: '40px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{toolkit.description}</p>
                
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  {!connected ? (
                    <button 
                      onClick={() => initiateConnection(toolkit.appName)}
                      style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '8px',
                          background: 'var(--accent-primary)',
                          color: 'white',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'var(--accent-primary-hover)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'var(--accent-primary)'}
                    >
                      <Plus size={16} /> Connect
                    </button>
                  ) : (
                    <button 
                      onClick={() => connId && disconnectApp(connId)}
                      style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '8px',
                          background: '#fff1f2',
                          color: '#e11d48',
                          border: '1px solid #fecdd3',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer'
                      }}
                    >
                      <Unlink size={16} /> Disconnect
                    </button>
                  )}
                  <a 
                    href={`https://app.composio.dev/app/${toolkit.appName}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                        padding: '8px',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px',
                        color: 'var(--text-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                    }}
                  >
                    <ExternalLink size={18} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && filteredToolkits.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', background: 'var(--bg-white)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '1px solid var(--border-light)' }}>
            <Search size={24} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No apps found</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '300px' }}>
            {searchQuery ? `No results for "${searchQuery}"` : "Try adjusting your filters or search query."}
          </p>
        </div>
      )}
    </div>
  );
}
