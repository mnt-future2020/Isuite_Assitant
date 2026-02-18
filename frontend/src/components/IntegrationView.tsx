"use client";

import { useComposio } from "@/hooks/useComposio";
import { useLicenseAuth } from "@/app/ConvexClientProvider";
import { ExternalLink, Check, Plus, RefreshCw, Unlink, Search, ChevronDown, Layers } from "lucide-react";
import Image from "next/image";
import { useState, useMemo, useRef, useEffect } from "react";

export default function IntegrationView() {
  const { licenseKey } = useLicenseAuth();
  const { toolkits, connections, isLoading, initiateConnection, disconnectApp, refresh } = useComposio(licenseKey || undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [targetCategory, setTargetCategory] = useState<string>("All Categories");
  const [filter, setFilter] = useState<'ALL' | 'CONNECTED'>('CONNECTED');
  const [loadMoreCount, setLoadMoreCount] = useState(0);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Extract unique categories
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    toolkits.forEach(t => {
      if (t.categories && t.categories.length > 0) {
        t.categories.forEach(c => uniqueCategories.add(c));
      }
    });
    return ["All Categories", ...Array.from(uniqueCategories).sort()];
  }, [toolkits]);

  const filteredToolkits = useMemo(() => {
    const isConnectedCheck = (appName: string) => {
      return connections.some(c => 
        c.appName.toLowerCase() === appName.toLowerCase() && 
        (c.status.toUpperCase() === 'ACTIVE' || c.status.toUpperCase() === 'CONNECTED')
      );
    };

    return toolkits.filter(toolkit => {
      const matchesSearch = 
        toolkit.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        toolkit.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const connected = isConnectedCheck(toolkit.appName);
      const matchesFilter = filter === 'ALL' || (filter === 'CONNECTED' && connected);
      
      const matchesCategory = targetCategory === "All Categories" || (toolkit.categories && toolkit.categories.includes(targetCategory));

      return matchesSearch && matchesFilter && matchesCategory;
    });
  }, [toolkits, connections, searchQuery, filter, targetCategory]);

  const visibleCount = 24 + (loadMoreCount * 24);
  const visibleToolkits = useMemo(() => {
    return filteredToolkits.slice(0, visibleCount);
  }, [filteredToolkits, visibleCount]);

  const handleLoadMore = () => {
    setLoadMoreCount(prev => prev + 1);
  };

  const handleFilterChange = (newFilter: 'ALL' | 'CONNECTED') => {
    setFilter(newFilter);
    setLoadMoreCount(0);
  };
  
  const handleCategoryChange = (category: string) => {
    setTargetCategory(category);
    setLoadMoreCount(0);
    setIsCategoryDropdownOpen(false);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setLoadMoreCount(0);
  };

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

  const capitalize = (s: string) => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div style={{ padding: '40px', background: 'var(--bg-main)', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 className="greeting-text" style={{ fontSize: '32px', marginBottom: '4px' }}>Integrations</h1>
            <p className="tagline">Connect your favorite tools to supercharge your Workspace Agents.</p>
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

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} size={18} />
            <input 
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
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

          {/* Category Dropdown */}
          <div ref={categoryDropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: 'var(--bg-white)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: targetCategory === 'All Categories' ? 'var(--text-secondary)' : 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                height: '44px',
                width: 'auto',
                minWidth: '220px',
                maxWidth: '400px'
              }}
            >
              <Layers size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>{capitalize(targetCategory)}</span>
              <ChevronDown 
                size={16} 
                style={{ 
                  color: 'var(--text-tertiary)', 
                  flexShrink: 0,
                  transition: 'transform 0.2s',
                  transform: isCategoryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }} 
              />
            </button>

            {/* Dropdown Menu */}
            {isCategoryDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: 'auto',
                minWidth: '220px',
                maxWidth: '400px',
                maxHeight: '400px',
                overflowY: 'auto',
                background: 'var(--bg-white)',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                zIndex: 50,
                padding: '6px',
                animation: 'fadeIn 0.15s ease-out'
              }}>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      background: targetCategory === category ? 'var(--bg-secondary)' : 'transparent',
                      color: targetCategory === category ? 'var(--text-primary)' : 'var(--text-secondary)',
                      border: 'none',
                      transition: 'all 0.15s',
                      fontWeight: targetCategory === category ? 500 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onMouseOver={(e) => {
                      if (targetCategory !== category) {
                        e.currentTarget.style.background = 'var(--bg-main)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (targetCategory !== category) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <span>{capitalize(category)}</span>
                    {targetCategory === category && (
                      <Check size={16} style={{ color: 'var(--text-primary)', flexShrink: 0 }} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Connected / All Apps Toggle */}
          <div style={{ background: 'var(--bg-white)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-light)', display: 'flex', marginLeft: 'auto', flexShrink: 0 }}>
            <button
              onClick={() => handleFilterChange('CONNECTED')}
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
            <button
              onClick={() => handleFilterChange('ALL')}
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
          </div>
        </div>
      </div>

      {isLoading && toolkits.length === 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {Array.from({ length: 12 }).map((_, index) => (
            <div 
              key={index}
              style={{
                background: 'var(--bg-white)',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-sm)',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '10px', 
                  background: 'var(--bg-main)',
                }} />
              </div>
              
              <div style={{ 
                height: '20px', 
                background: 'var(--bg-main)', 
                borderRadius: '4px', 
                marginBottom: '8px',
                width: '60%'
              }} />
              <div style={{ 
                height: '16px', 
                background: 'var(--bg-main)', 
                borderRadius: '4px', 
                marginBottom: '4px',
                width: '100%'
              }} />
              <div style={{ 
                height: '16px', 
                background: 'var(--bg-main)', 
                borderRadius: '4px', 
                marginBottom: '20px',
                width: '80%'
              }} />
              
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <div style={{
                  flex: 1,
                  height: '36px',
                  background: 'var(--bg-main)',
                  borderRadius: '8px'
                }} />
                <div style={{
                  width: '36px',
                  height: '36px',
                  background: 'var(--bg-main)',
                  borderRadius: '8px'
                }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {visibleToolkits.map((toolkit) => {
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
          
          {visibleCount < filteredToolkits.length && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px', marginBottom: '16px' }}>
              <button
                onClick={handleLoadMore}
                style={{
                  padding: '10px 24px',
                  background: 'var(--bg-white)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'var(--bg-secondary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'var(--bg-white)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                Load More Apps ({filteredToolkits.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}

      {!isLoading && filteredToolkits.length === 0 && toolkits.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', background: 'var(--bg-white)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '1px solid var(--border-light)' }}>
            <Search size={24} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No apps found</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '300px' }}>
            {searchQuery 
              ? `No results for "${searchQuery}". Try a different search term.` 
              : filter === 'CONNECTED' 
                ? "You haven't connected any apps yet. Switch to 'All Apps' to browse available integrations."
                : "Try adjusting your filters or search query."}
          </p>
          {filter === 'CONNECTED' && (
            <button
              onClick={() => handleFilterChange('ALL')}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                background: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Browse All Apps
            </button>
          )}
        </div>
      )}
    </div>
  );
}
