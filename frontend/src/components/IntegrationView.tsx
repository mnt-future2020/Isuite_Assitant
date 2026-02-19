"use client";

import { useComposio, AppTool } from "@/hooks/useComposio";
import { useLicenseAuth } from "@/app/ConvexClientProvider";
import { Check, Plus, RefreshCw, Unlink, Search, ChevronDown, ChevronRight, Layers, Bot, ShoppingCart, Code, Briefcase, BarChart3, Mail, Users, FileText, Zap, Globe, DollarSign, Megaphone, Palette, Shield, Database, Headphones } from "lucide-react";
import Image from "next/image";
import { useState, useMemo, useRef, useEffect } from "react";

// ── Category Group Definitions ──────────────────────────────────────────
// Maps raw Composio categories into clean parent groups with icons.
// Any category not matched falls into "Other".

type CategoryGroup = {
  label: string;
  icon: React.ReactNode;
  keywords: string[];   // lowercase substrings to match raw category names
};

const CATEGORY_GROUPS: CategoryGroup[] = [
  { label: "AI & Machine Learning",  icon: <Bot size={15} />,           keywords: ["ai ", "ai_", "machine learning", "llm", "nlp", "deep learning", "neural", "ml "] },
  { label: "Communication",          icon: <Mail size={15} />,          keywords: ["communication", "email", "messaging", "chat", "sms", "calling", "voip", "phone"] },
  { label: "CRM & Sales",            icon: <Users size={15} />,         keywords: ["crm", "sales", "lead", "pipeline", "customer relationship"] },
  { label: "Project Management",     icon: <Briefcase size={15} />,     keywords: ["project management", "task management", "agile", "scrum", "kanban"] },
  { label: "Developer Tools",        icon: <Code size={15} />,          keywords: ["developer", "devops", "code", "programming", "api", "version control", "git", "ci/cd", "ide"] },
  { label: "Productivity",           icon: <Zap size={15} />,           keywords: ["productivity", "automation", "workflow", "scheduling", "calendar", "time tracking", "note"] },
  { label: "Analytics & Data",       icon: <BarChart3 size={15} />,     keywords: ["analytics", "data", "reporting", "bi ", "business intelligence", "dashboard", "monitoring"] },
  { label: "Marketing & Social",     icon: <Megaphone size={15} />,     keywords: ["marketing", "social media", "seo", "ads", "advertising", "conversion", "content"] },
  { label: "E-commerce & Payments",  icon: <ShoppingCart size={15} />,  keywords: ["commerce", "ecommerce", "payment", "shopping", "store", "retail", "pos"] },
  { label: "Finance & Accounting",   icon: <DollarSign size={15} />,    keywords: ["finance", "accounting", "invoice", "tax", "banking", "billing", "expense"] },
  { label: "Documents & Storage",    icon: <FileText size={15} />,      keywords: ["document", "file", "storage", "cloud storage", "drive", "spreadsheet"] },
  { label: "Design & Creative",      icon: <Palette size={15} />,       keywords: ["design", "creative", "graphic", "image", "video", "media", "photo"] },
  { label: "Security & IT",          icon: <Shield size={15} />,        keywords: ["security", "identity", "auth", "compliance", "it management", "network"] },
  { label: "Customer Support",       icon: <Headphones size={15} />,    keywords: ["support", "helpdesk", "ticketing", "customer service", "feedback"] },
  { label: "HR & Recruiting",        icon: <Users size={15} />,         keywords: ["hr", "human resource", "recruiting", "hiring", "talent", "payroll", "employee"] },
  { label: "Database & Infrastructure", icon: <Database size={15} />,   keywords: ["database", "infrastructure", "hosting", "server", "cloud"] },
  { label: "Web & Internet",         icon: <Globe size={15} />,         keywords: ["web", "browser", "scraping", "crawl", "internet", "url"] },
];

/**
 * Assign a raw category name to a parent group.
 * Returns the group label, or "Other" if no match.
 */
function getGroupForCategory(rawCategory: string): string {
  const lower = rawCategory.toLowerCase();
  for (const group of CATEGORY_GROUPS) {
    if (group.keywords.some(kw => lower.includes(kw))) {
      return group.label;
    }
  }
  return "Other";
}

function getGroupIcon(groupLabel: string): React.ReactNode {
  const group = CATEGORY_GROUPS.find(g => g.label === groupLabel);
  return group?.icon || <Layers size={15} />;
}

export default function IntegrationView() {
  const { licenseKey } = useLicenseAuth();
  const { toolkits, connections, isLoading, initiateConnection, disconnectApp, refresh, fetchAppTools, appToolsCache, loadingTools } = useComposio(licenseKey || undefined);
  const [searchQuery, setSearchQuery] = useState("");
  // State for the tools modal
  const [viewingApp, setViewingApp] = useState<{name: string, logo?: string, description: string, categories?: string[], slug: string} | null>(null);
  
  // When a parent group is selected, filter by all its subcategories
  // When a specific subcategory is selected, filter by just that one
  const [selectedGroup, setSelectedGroup] = useState<string>("All Categories");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'CONNECTED'>('CONNECTED');
  const [loadMoreCount, setLoadMoreCount] = useState(0);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
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

  // Build grouped categories from raw data
  const groupedCategories = useMemo(() => {
    const rawCategories = new Set<string>();
    toolkits.forEach(t => {
      if (t.categories && t.categories.length > 0) {
        t.categories.forEach(c => rawCategories.add(c));
      }
    });

    // Group raw categories under parent groups
    const groups: Record<string, string[]> = {};
    rawCategories.forEach(rawCat => {
      const groupLabel = getGroupForCategory(rawCat);
      if (!groups[groupLabel]) groups[groupLabel] = [];
      groups[groupLabel].push(rawCat);
    });

    // Sort subcategories within each group
    Object.keys(groups).forEach(g => groups[g].sort());

    // Sort groups: defined ones first (in order), then "Other" last
    const orderedGroups: Array<{ label: string; subcategories: string[]; count: number }> = [];
    
    for (const group of CATEGORY_GROUPS) {
      if (groups[group.label]) {
        // Count how many toolkits belong to this group
        const groupSubcats = groups[group.label];
        const count = toolkits.filter(t => 
          t.categories?.some(c => groupSubcats.includes(c))
        ).length;
        orderedGroups.push({ label: group.label, subcategories: groupSubcats, count });
      }
    }

    if (groups["Other"]) {
      const otherSubcats = groups["Other"];
      const count = toolkits.filter(t => 
        t.categories?.some(c => otherSubcats.includes(c))
      ).length;
      orderedGroups.push({ label: "Other", subcategories: otherSubcats, count });
    }

    return orderedGroups;
  }, [toolkits]);

  // Get all subcategories for a parent group


  const filteredToolkits = useMemo(() => {
    const isConnectedCheck = (appName: string) => {
      return connections.some(c => 
        c.appName.toLowerCase() === appName.toLowerCase() && 
        (c.status.toUpperCase() === 'ACTIVE' || c.status.toUpperCase() === 'CONNECTED')
      );
    };

    // Pre-compute subcategories for the selected group (inlined to satisfy React Compiler)
    const activeGroupSubcats = selectedGroup !== "All Categories" && !selectedSubcategory
      ? (groupedCategories.find(g => g.label === selectedGroup)?.subcategories || [])
      : [];

    return toolkits.filter(toolkit => {
      const matchesSearch = 
        toolkit.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        toolkit.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const connected = isConnectedCheck(toolkit.appName);
      const matchesFilter = filter === 'ALL' || (filter === 'CONNECTED' && connected);
      
      let matchesCategory = true;
      if (selectedGroup !== "All Categories") {
        if (selectedSubcategory) {
          matchesCategory = toolkit.categories?.includes(selectedSubcategory) || false;
        } else {
          matchesCategory = toolkit.categories?.some(c => activeGroupSubcats.includes(c)) || false;
        }
      }

      return matchesSearch && matchesFilter && matchesCategory;
    });
  }, [toolkits, connections, searchQuery, filter, selectedGroup, selectedSubcategory, groupedCategories]);

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
  
  const handleGroupSelect = (groupLabel: string) => {
    setSelectedGroup(groupLabel);
    setSelectedSubcategory(null);
    setLoadMoreCount(0);
    if (groupLabel === "All Categories") {
      setIsCategoryDropdownOpen(false);
      setExpandedGroup(null);
    }
  };

  const handleSubcategorySelect = (subcategory: string, parentGroup: string) => {
    setSelectedGroup(parentGroup);
    setSelectedSubcategory(subcategory);
    setLoadMoreCount(0);
    setIsCategoryDropdownOpen(false);
  };

  const toggleGroupExpansion = (groupLabel: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGroup(prev => prev === groupLabel ? null : groupLabel);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setLoadMoreCount(0);
  };

  // Get display label for the dropdown button
  const getDisplayLabel = () => {
    if (selectedSubcategory) return capitalize(selectedSubcategory);
    return capitalize(selectedGroup);
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
      <style>{`
        @keyframes contentShow {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
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

          {/* Grouped Category Dropdown */}
          <div ref={categoryDropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: 'var(--bg-white)',
                border: selectedGroup !== 'All Categories' 
                  ? '1px solid var(--accent-primary)' 
                  : '1px solid var(--border-light)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: selectedGroup === 'All Categories' ? 'var(--text-secondary)' : 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                height: '44px',
                width: 'auto',
                minWidth: '220px',
                maxWidth: '400px'
              }}
            >
              {selectedGroup !== 'All Categories' ? getGroupIcon(selectedGroup) : <Layers size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>{getDisplayLabel()}</span>
              {selectedGroup !== 'All Categories' && (
                <span 
                  onClick={(e) => { e.stopPropagation(); handleGroupSelect('All Categories'); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'var(--text-tertiary)',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                  title="Clear filter"
                >
                  ×
                </span>
              )}
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

            {/* Grouped Dropdown Menu */}
            {isCategoryDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: 'auto',
                minWidth: '280px',
                maxWidth: '420px',
                maxHeight: '480px',
                overflowY: 'auto',
                background: 'var(--bg-white)',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                zIndex: 50,
                padding: '6px',
                animation: 'fadeIn 0.15s ease-out'
              }}>
                {/* All Categories */}
                <button
                  onClick={() => handleGroupSelect('All Categories')}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    background: selectedGroup === 'All Categories' ? 'var(--bg-secondary)' : 'transparent',
                    color: selectedGroup === 'All Categories' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    border: 'none',
                    transition: 'all 0.15s',
                    fontWeight: selectedGroup === 'All Categories' ? 600 : 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onMouseOver={(e) => {
                    if (selectedGroup !== 'All Categories') e.currentTarget.style.background = 'var(--bg-main)';
                  }}
                  onMouseOut={(e) => {
                    if (selectedGroup !== 'All Categories') e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Layers size={15} style={{ color: 'var(--text-tertiary)' }} />
                    All Categories
                  </span>
                  {selectedGroup === 'All Categories' && <Check size={16} style={{ color: 'var(--accent-primary)' }} />}
                </button>

                {/* Divider */}
                <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 8px' }} />

                {/* Grouped categories */}
                {groupedCategories.map((group) => {
                  const isExpanded = expandedGroup === group.label;
                  const isGroupSelected = selectedGroup === group.label && !selectedSubcategory;
                  const isInGroup = selectedGroup === group.label;

                  return (
                    <div key={group.label}>
                      {/* Parent group row */}
                      <button
                        onClick={() => handleGroupSelect(group.label)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          background: isGroupSelected ? 'var(--bg-secondary)' : 'transparent',
                          color: isInGroup ? 'var(--text-primary)' : 'var(--text-secondary)',
                          border: 'none',
                          transition: 'all 0.15s',
                          fontWeight: isInGroup ? 600 : 400,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px'
                        }}
                        onMouseOver={(e) => {
                          if (!isGroupSelected) e.currentTarget.style.background = 'var(--bg-main)';
                        }}
                        onMouseOut={(e) => {
                          if (!isGroupSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                          <span style={{ flexShrink: 0, color: isInGroup ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>
                            {getGroupIcon(group.label)}
                          </span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {group.label}
                          </span>
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <span style={{
                            fontSize: '11px',
                            color: 'var(--text-tertiary)',
                            background: 'var(--bg-main)',
                            padding: '2px 7px',
                            borderRadius: '10px',
                            fontWeight: 500,
                          }}>
                            {group.count}
                          </span>
                          {group.subcategories.length > 1 && (
                            <span
                              onClick={(e) => toggleGroupExpansion(group.label, e)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '22px',
                                height: '22px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                color: 'var(--text-tertiary)',
                                transition: 'all 0.15s',
                              }}
                              title={isExpanded ? 'Collapse subcategories' : 'Show subcategories'}
                            >
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </span>
                          )}
                          {isGroupSelected && <Check size={16} style={{ color: 'var(--accent-primary)' }} />}
                        </span>
                      </button>

                      {/* Subcategories (expanded) */}
                      {isExpanded && group.subcategories.length > 1 && (
                        <div style={{ 
                          marginLeft: '20px', 
                          borderLeft: '2px solid var(--border-light)',
                          paddingLeft: '8px',
                          marginBottom: '4px',
                        }}>
                          {group.subcategories.map(subcat => {
                            const isSubSelected = selectedSubcategory === subcat && selectedGroup === group.label;
                            return (
                              <button
                                key={subcat}
                                onClick={() => handleSubcategorySelect(subcat, group.label)}
                                style={{
                                  width: '100%',
                                  textAlign: 'left',
                                  padding: '7px 12px',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                  background: isSubSelected ? 'var(--bg-secondary)' : 'transparent',
                                  color: isSubSelected ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                  border: 'none',
                                  transition: 'all 0.15s',
                                  fontWeight: isSubSelected ? 500 : 400,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                }}
                                onMouseOver={(e) => {
                                  if (!isSubSelected) e.currentTarget.style.background = 'var(--bg-main)';
                                  e.currentTarget.style.color = 'var(--text-primary)';
                                }}
                                onMouseOut={(e) => {
                                  if (!isSubSelected) e.currentTarget.style.background = 'transparent';
                                  if (!isSubSelected) e.currentTarget.style.color = 'var(--text-tertiary)';
                                }}
                              >
                                <span>{capitalize(subcat)}</span>
                                {isSubSelected && <Check size={14} style={{ color: 'var(--accent-primary)' }} />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
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

        {/* Active filter chip — shown below the controls when a category is selected */}
        {selectedGroup !== 'All Categories' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Filtered by:</span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px 4px 8px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-light)',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-primary)',
            }}>
              {getGroupIcon(selectedGroup)}
              {selectedSubcategory ? `${selectedGroup} → ${capitalize(selectedSubcategory)}` : selectedGroup}
              <span 
                onClick={() => handleGroupSelect('All Categories')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'var(--text-tertiary)',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginLeft: '2px',
                  lineHeight: 1,
                }}
              >
                ×
              </span>
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              {filteredToolkits.length} app{filteredToolkits.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
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
                    <button
                      onClick={() => setViewingApp({
                        name: toolkit.name,
                        logo: toolkit.logo,
                        description: toolkit.description,
                        categories: toolkit.categories,
                        slug: toolkit.appName
                      })}
                      style={{
                          padding: '8px 12px',
                          border: '1px solid var(--border-light)',
                          borderRadius: '8px',
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          background: 'white',
                          cursor: 'pointer',
                          fontWeight: 500,
                          fontSize: '13px',
                          transition: 'all 0.2s',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = 'var(--text-tertiary)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-light)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      <Zap size={16} /> Tools
                    </button>
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
      {/* Tools Modal */}
      {viewingApp && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
          }} 
          onClick={() => setViewingApp(null)}
        >
          <div 
            style={{
              background: 'white',
              width: '90%',
              maxWidth: '800px',
              maxHeight: '85vh',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'contentShow 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }} 
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '20px', alignItems: 'start' }}>
              <div style={{ 
                width: '64px', height: '64px', borderRadius: '12px', background: 'var(--bg-secondary)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                border: '1px solid var(--border-light)'
              }}>
                {viewingApp.logo ? (
                  <Image src={viewingApp.logo} alt={viewingApp.name} width={40} height={40} unoptimized style={{ objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{viewingApp.name[0]}</span>
                )}
              </div>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>{viewingApp.name}</h2>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {viewingApp.categories?.map(cat => (
                    <span key={cat} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                      {cat}
                    </span>
                  ))}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>{viewingApp.description}</p>
              </div>
              <button 
                onClick={() => setViewingApp(null)} 
                style={{ 
                  marginLeft: 'auto', 
                  background: 'var(--bg-secondary)', 
                  border: 'none', 
                  cursor: 'pointer', 
                  padding: '8px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px'
                }}
              >
                <Plus size={20} style={{ transform: 'rotate(45deg)', color: 'var(--text-secondary)' }} />
              </button>
            </div>

            {/* Tools List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--bg-main)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} style={{ color: 'var(--accent-primary)' }} /> Available Actions
              </h3>
              <ToolsList 
                appName={viewingApp.slug} 
                fetchAppTools={fetchAppTools} 
                cache={appToolsCache} 
                loading={loadingTools} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tools List Helper Component ─────────────────────────────────────────
function ToolsList({ appName, fetchAppTools, cache, loading }: { 
  appName: string, 
  fetchAppTools: (app: string) => void, 
  cache: Record<string, AppTool[]>, 
  loading: Record<string, boolean> 
}) {
  useEffect(() => {
    if (!cache[appName] && !loading[appName] && appName) {
      fetchAppTools(appName);
    }
  }, [appName, cache, loading, fetchAppTools]);

  const tools = cache[appName];

  if (tools === undefined) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ 
            background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)',
            height: '100px', animation: 'pulse 1.5s infinite' 
          }} />
        ))}
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>No explicit tools listed for this integration.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
      {tools.map((tool: AppTool) => (
        <div key={tool.slug} style={{ 
          background: 'white', 
          padding: '16px', 
          borderRadius: '12px', 
          border: '1px solid var(--border-light)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: 'default'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ padding: '6px', borderRadius: '6px', background: 'var(--bg-secondary)', color: 'var(--accent-primary)' }}>
              <Code size={14} />
            </div>
            <h4 style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{tool.name}</h4>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {tool.description || "No description available."}
          </p>
          <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'monospace', background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
            {tool.slug}
          </div>
        </div>
      ))}
    </div>
  );
}
