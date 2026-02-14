"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import {
  Send,
  Plus,
  MessageSquare,
  Paperclip,
  Menu,
  X,
  Layout,
  Sparkles,
  Zap,
  Trash2,
  Settings,
  Key,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Layers,
  SlidersHorizontal,
  SquarePen,
} from "lucide-react";
import { marked } from "marked";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useQuery, useMutation } from "convex/react";
import {
  useLicenseAuth,
  LicenseAuthenticated,
  LicenseUnauthenticated,
  LicenseLoading
} from "./ConvexClientProvider";
import RuixenMoonChat from "@/components/ruixen-moon-chat";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper function to add target="_blank" to all links
function parseMarkdownWithExternalLinks(content: string): string {
  const html = marked.parse(content) as string;
  return html.replace(/<a href=/g, '<a target="_blank" rel="noopener noreferrer" href=');
}

// Attachment type for image uploads
type Attachment = {
  name: string;
  type: string;
  data: string; // base64 encoded
};

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
    <div style={{ padding: '12px' }}>
      <div style={{ marginBottom: 8, fontSize: 12, color: '#9ca3af' }}>
        Enter your license key to activate
      </div>
      <input
        type="text"
        placeholder="XXXX-XXXX-XXXX-XXXX"
        value={licenseKey}
        onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid #374151',
          background: '#1f2937',
          color: '#e5e7eb',
          marginBottom: 8,
          fontSize: 13,
          fontFamily: 'monospace',
          outline: 'none'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#3b82f6';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#374151';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
      {error && (
        <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 8 }}>
          {error}
        </div>
      )}
      <button
        onClick={handleActivate}
        disabled={isActivating}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '10px 16px',
          borderRadius: 8,
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: 'white',
          border: 'none',
          fontSize: 14,
          fontWeight: 600,
          cursor: isActivating ? 'not-allowed' : 'pointer',
          opacity: isActivating ? 0.7 : 1,
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (!isActivating) {
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <Key size={16} />
        <span>{isActivating ? 'Activating...' : 'Activate License'}</span>
      </button>
      <div style={{ marginTop: 12, fontSize: 11, color: '#6b7280', textAlign: 'center' }}>
        Don't have a license? <a href="https://isuiteassistant.com" target="_blank" style={{ color: '#60a5fa', textDecoration: 'none' }}>Get one here</a>
      </div>
    </div>
  );
}

// User License Card Component
function UserLicenseCard() {
  const { user, logout } = useLicenseAuth();

  if (!user) return null;

  return (
    <div className="user-card" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '10px 12px',
      borderRadius: '12px',
      background: 'rgba(38, 38, 38, 0.5)',
      border: '1px solid #2a2a2a',
      transition: 'all 0.2s'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'rgba(38, 38, 38, 0.8)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'rgba(38, 38, 38, 0.5)';
    }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 14,
          fontWeight: 600,
          border: '2px solid #1e3a8a',
          flexShrink: 0
        }}>
          {user.email?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div style={{ 
            fontSize: 13, 
            fontWeight: 600, 
            color: '#e5e7eb',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {user.name || user.email}
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'capitalize' }}>
            {user.plan} Plan
          </div>
        </div>
      </div>
      <button
        onClick={logout}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 6,
          borderRadius: 6,
          color: '#9ca3af',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          flexShrink: 0,
          marginLeft: 8
        }}
        title="Sign out"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
          e.currentTarget.style.color = '#ef4444';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#9ca3af';
        }}
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}

// Collapsed User Card Component
function CollapsedUserCard() {
  const { user, logout } = useLicenseAuth();

  if (!user) return null;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px'
    }}>
      {/* User Avatar */}
      <div style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: 14,
        fontWeight: 600,
        border: '2px solid #1e3a8a',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      title={user.email}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      >
        {user.email?.charAt(0).toUpperCase() || 'U'}
      </div>
      
      {/* Logout Button */}
      <button
        onClick={logout}
        style={{
          background: 'transparent',
          border: '1px solid #2a2a2a',
          cursor: 'pointer',
          padding: 8,
          borderRadius: 8,
          color: '#9ca3af',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          width: '100%'
        }}
        title="Sign out"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
          e.currentTarget.style.color = '#ef4444';
          e.currentTarget.style.borderColor = '#ef4444';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#9ca3af';
          e.currentTarget.style.borderColor = '#2a2a2a';
        }}
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { licenseKey } = useLicenseAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  const { messages, sendMessage, isLoading, stopQuery } = useChat(selectedConversationId);
  const conversations = useQuery(api.conversations.list, licenseKey ? { licenseKey } : "skip") || [];
  const deleteConversation = useMutation(api.conversations.remove);
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const homeFileRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-open sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleSidebarCollapse = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const convexUser = useQuery(api.users.getMe, licenseKey ? { licenseKey } : "skip");
  const settings = useQuery(api.users.getSettings, convexUser ? { userId: convexUser._id } : "skip");

  const handleSend = async () => {
    if (isLoading) {
      stopQuery();
      return;
    }
    if (!input.trim() && attachments.length === 0) return;
    
    // Pass preferred model from settings
    const preferredModel = settings?.preferredModel || "claude-3-5-sonnet-latest";
    const newChatId = await sendMessage(input, "claude", preferredModel, attachments);
    
    if (newChatId && !selectedConversationId) {
      setSelectedConversationId(newChatId);
    }
    
    setInput("");
    setAttachments([]); // Clear attachments after sending
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const startNewChat = () => {
    setSelectedConversationId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  };

  // Handle file attachment - read as base64 for images
  const handleFileAttach = (file: File) => {
    if (!file.type.startsWith('image/')) {
      // For non-image files, just add the filename to input
      setInput(prev => prev + `\n[Attached: ${file.name}]`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setAttachments(prev => [...prev, {
        name: file.name,
        type: file.type,
        data: base64
      }]);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Mobile hamburger button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-6 left-6 z-50 p-3 rounded-lg bg-neutral-900/80 backdrop-blur-md shadow-lg border border-neutral-700 md:hidden hover:bg-neutral-800 transition-all duration-200"
        aria-label="Toggle sidebar"
      >
        {isSidebarOpen ? 
          <X className="h-5 w-5 text-neutral-200" /> : 
          <Menu className="h-5 w-5 text-neutral-200" />
        }
      </button>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300" 
          onClick={toggleSidebar} 
        />
      )}

      {/* Left Sidebar - Navigation */}
      <aside 
        className={cn("left-sidebar", !isSidebarOpen && "hidden")}
        style={{ 
          display: 'flex',
          flexDirection: 'column', 
          height: '100vh',
          background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
          borderRight: '1px solid #2a2a2a',
          width: isSidebarCollapsed ? '80px' : '260px',
          minWidth: isSidebarCollapsed ? '80px' : '260px',
          transition: 'width 0.3s ease-in-out, min-width 0.3s ease-in-out, transform 0.3s ease-in-out',
          position: 'relative',
          zIndex: 40,
          overflow: 'hidden'
        }}
      >
        <div className="sidebar-brand" style={{
          padding: '20px 16px',
          borderBottom: '1px solid #2a2a2a',
          background: 'rgba(26, 26, 26, 0.5)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '80px',
          flexShrink: 0,
          position: 'relative'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            flex: 1,
            overflow: 'hidden'
          }}>
            <div className="sidebar-logo" style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Layout size={20} style={{ color: 'white' }} />
            </div>
            
            <span className="brand-name" style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#ffffff',
              letterSpacing: '-0.3px',
              opacity: isSidebarCollapsed ? 0 : 1,
              transition: 'opacity 0.2s ease-in-out',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              width: isSidebarCollapsed ? '0' : 'auto'
            }}>iSuite Assistant</span>
          </div>

          {/* Desktop collapse button - shows chevron on hover when collapsed */}
          {!isSidebarCollapsed ? (
            <button
              onClick={toggleSidebarCollapse}
              className="sidebar-collapse-btn"
              style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#9ca3af',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginLeft: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#9ca3af';
              }}
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          ) : (
            <button
              onClick={toggleSidebarCollapse}
              className="sidebar-collapse-btn sidebar-expand-trigger"
              style={{
                position: 'absolute',
                top: '50%',
                right: '16px',
                transform: 'translateY(-50%)',
                padding: '8px',
                borderRadius: '8px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#9ca3af',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#9ca3af';
              }}
              aria-label="Expand sidebar"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        <nav className="nav-section" style={{ padding: '16px 12px', flexShrink: 0 }}>
            <button 
                className="nav-item active"
                onClick={() => {
                  startNewChat();
                  router.push("/");
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)',
                  color: '#60a5fa',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                  position: 'relative',
                  marginBottom: '4px',
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  overflow: 'hidden'
                }}
                title={isSidebarCollapsed ? "New Chat" : undefined}
            >
                {!isSidebarCollapsed && (
                  <div style={{
                    position: 'absolute',
                    left: '0',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '3px',
                    height: '24px',
                    background: 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)',
                    borderRadius: '0 2px 2px 0'
                  }} />
                )}
                <SquarePen size={20} style={{ flexShrink: 0, marginLeft: isSidebarCollapsed ? '0' : '8px', strokeWidth: 2 }} />
                <span style={{
                  opacity: isSidebarCollapsed ? 0 : 1,
                  transition: 'opacity 0.2s ease-in-out',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  width: isSidebarCollapsed ? '0' : 'auto'
                }}>New Chat</span>
            </button>
            <button 
                className="nav-item"
                onClick={() => router.push("/integrations")}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'transparent',
                  color: '#9ca3af',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  marginBottom: '4px',
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  overflow: 'hidden'
                }}
                title={isSidebarCollapsed ? "Integrations" : undefined}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                  e.currentTarget.style.color = '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#9ca3af';
                }}
            >
                <Layers size={20} style={{ flexShrink: 0, strokeWidth: 2 }} />
                <span style={{
                  opacity: isSidebarCollapsed ? 0 : 1,
                  transition: 'opacity 0.2s ease-in-out',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  width: isSidebarCollapsed ? '0' : 'auto'
                }}>Integrations</span>
            </button>
            <button 
                className="nav-item"
                onClick={() => router.push("/settings")}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'transparent',
                  color: '#9ca3af',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  overflow: 'hidden'
                }}
                title={isSidebarCollapsed ? "Settings" : undefined}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                  e.currentTarget.style.color = '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#9ca3af';
                }}
            >
                <SlidersHorizontal size={20} style={{ flexShrink: 0, strokeWidth: 2 }} />
                <span style={{
                  opacity: isSidebarCollapsed ? 0 : 1,
                  transition: 'opacity 0.2s ease-in-out',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  width: isSidebarCollapsed ? '0' : 'auto'
                }}>Settings</span>
            </button>
        </nav>

        {!isSidebarCollapsed && (
          <>
            <div className="section-label" style={{
              padding: '20px 16px 10px',
              fontSize: '11px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.8px'
            }}>RECENT CHATS</div>
            
            <div className="recent-chats-list" style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0 12px 12px'
            }}>
                {conversations.map((conv) => (
              <div
                key={conv._id}
                className={cn("recent-chat-item", selectedConversationId === conv._id && "active")}
                onClick={() => {
                  setSelectedConversationId(conv._id);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: selectedConversationId === conv._id ? '#60a5fa' : '#9ca3af',
                  background: selectedConversationId === conv._id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  marginBottom: '2px',
                  transition: 'all 0.2s',
                  fontWeight: selectedConversationId === conv._id ? '500' : '400'
                }}
                onMouseEnter={(e) => {
                  if (selectedConversationId !== conv._id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.color = '#d1d5db';
                    e.currentTarget.style.transform = 'translateX(2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedConversationId !== conv._id) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
              >
                <MessageSquare size={16} style={{ flexShrink: 0, opacity: 0.6 }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.title}</span>
                <button
                  className="delete-chat-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this chat?")) {
                      deleteConversation({ conversationId: conv._id });
                      if (selectedConversationId === conv._id) {
                        setSelectedConversationId(null);
                      }
                    }
                  }}
                  title="Delete chat"
                  style={{
                    opacity: 0,
                    padding: '5px',
                    border: 'none',
                    background: 'transparent',
                    color: '#6b7280',
                    cursor: 'pointer',
                    borderRadius: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#6b7280';
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="recent-chat-item" style={{ 
                opacity: 0.5, 
                fontStyle: 'italic',
                padding: '10px 12px',
                color: '#6b7280',
                fontSize: '13px'
              }}>
                No recent chats
              </div>
            )}
        </div>
        </>
        )}
        
        <div className="user-profile-section" style={{ 
          marginTop: 'auto',
          padding: '12px',
          borderTop: '1px solid #2a2a2a',
          background: 'rgba(10, 10, 10, 0.5)'
        }}>
            <LicenseAuthenticated>
                {isSidebarCollapsed ? (
                  <CollapsedUserCard />
                ) : (
                  <UserLicenseCard />
                )}
            </LicenseAuthenticated>
            <LicenseUnauthenticated>
                {!isSidebarCollapsed && <LicenseKeyInput />}
            </LicenseUnauthenticated>
            <LicenseLoading>
                <div className="user-card animate-pulse">
                    <div className="user-avatar-sm bg-gray-200"></div>
                    {!isSidebarCollapsed && <div className="user-info-sm h-4 w-24 bg-gray-200 rounded"></div>}
                </div>
            </LicenseLoading>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content" style={{ 
        background: 'var(--bg-main)',
        flex: 1,
        transition: 'margin-left 0.3s ease-in-out',
        width: '100%'
      }}>
        {!isSidebarOpen && (
             <button 
               onClick={() => setIsSidebarOpen(true)}
               className="md:hidden"
               style={{ position: 'absolute', left: 16, top: 16, zIndex: 50, padding: 8, background: 'rgba(26, 26, 26, 0.8)', borderRadius: 8, border: '1px solid #2a2a2a', color: '#9ca3af', cursor: 'pointer' }}
             >
               <Menu size={20} />
             </button>
        )}

        {messages.length === 0 ? (
            <RuixenMoonChat 
              input={input}
              setInput={setInput}
              handleSend={handleSend}
              isLoading={isLoading}
              handleFileAttach={handleFileAttach}
              attachments={attachments}
              removeAttachment={(index) => setAttachments(prev => prev.filter((_, i) => i !== index))}
            />
        ) : (
          <div 
            className="chat-main relative w-full h-full bg-cover bg-center z-0"
            style={{
              backgroundImage: "url('https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/ruixen_moon_2.png')",
              backgroundAttachment: "fixed",
            }}
          >
            {/* Dark Overlay for readability */}
            <div className="absolute inset-0 bg-black/30 pointer-events-none z-0" />

            <header className="chat-header relative z-10" style={{ background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {!isSidebarOpen && (
                    <button onClick={() => setIsSidebarOpen(true)} className="control-btn text-white hover:bg-white/10">
                        <Menu size={20} />
                    </button>
                  )}
                  <h2 style={{ fontSize: 16, fontWeight: 600 }}>
                    {conversations.find(c => c._id === selectedConversationId)?.title || "Current Chat"}
                  </h2>
              </div>
              <button 
                className="new-chat-btn text-white hover:bg-white/10" 
                onClick={startNewChat}
                title="New Chat"
              >
                <Plus size={20} />
              </button>
            </header>

            <div className="messages-container relative z-10">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("message", msg.role)}>
                  <div 
                    className={cn(
                      "message-content",
                      msg.role === 'user' 
                        ? "bg-blue-600 text-white" 
                        : "bg-neutral-800/80 backdrop-blur-sm text-white border border-white/10"
                    )}
                    style={{ 
                      background: msg.role === 'user' ? undefined : 'rgba(38, 38, 38, 0.8)',
                      color: msg.role === 'user' ? undefined : 'white',
                      borderColor: msg.role === 'user' ? undefined : 'rgba(255, 255, 255, 0.1)'
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: msg.role === 'assistant' 
                        ? parseMarkdownWithExternalLinks(msg.content) 
                        : msg.content 
                    }}
                  />
                </div>
              ))}
              {isLoading && (
                <div className="message assistant">
                  <div className="thinking-indicator bg-neutral-800/80 backdrop-blur-sm border border-white/10 p-3 rounded-2xl">
                    <div className="thinking-dot bg-white"></div>
                    <div className="thinking-dot bg-white"></div>
                    <div className="thinking-dot bg-white"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area relative z-10" style={{ padding: '24px', display: 'flex', justifyContent: 'center', background: 'transparent' }}>
              <div className="input-container w-full max-w-3xl">
                <div 
                  className="input-wrapper relative bg-black/60 backdrop-blur-md rounded-xl border border-neutral-700" 
                  style={{ 
                    background: 'rgba(0, 0, 0, 0.6)', 
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                >
                   {attachments.length > 0 && (
                    <div className="flex gap-2 p-3 flex-wrap border-b border-neutral-700/50">
                      {attachments.map((att, idx) => (
                        <div key={idx} className="relative group">
                          <img 
                            src={`data:${att.type};base64,${att.data}`} 
                            alt={att.name}
                            className="w-16 h-16 rounded object-cover border border-neutral-600"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAttachments(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <textarea
                    ref={textareaRef}
                    className="message-input w-full px-4 py-3 resize-none border-none bg-transparent text-white text-sm focus:outline-none placeholder:text-neutral-400 min-h-[48px]"
                    placeholder="Reply to iSuite Assistant..."
                    value={input}
                    onChange={(e) => { setInput(e.target.value); autoResize(); }}
                    onKeyDown={handleKeyDown}
                    style={{ maxHeight: '200px', overflowY: 'auto', color: 'white' }}
                  />
                  
                  <div className="flex items-center justify-between p-3">
                     <div className="left-controls">
                      <input 
                        type="file" 
                        ref={homeFileRef} 
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileAttach(file);
                          }
                          e.target.value = '';
                        }}
                      />
                      <button 
                        className="control-btn text-white hover:bg-neutral-700" 
                        onClick={() => homeFileRef.current?.click()}
                        title="Attach file"
                      >
                        <Paperclip size={18} />
                      </button>
                    </div>
                    
                    <div className="right-controls">
                      <button 
                        className={cn(
                          "flex items-center gap-1 px-3 py-2 rounded-lg transition-colors",
                          !input.trim() && !isLoading
                            ? "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                            : "bg-white text-black hover:bg-neutral-200"
                        )}
                        onClick={handleSend}
                        disabled={!input.trim() && !isLoading}
                      >
                        {isLoading ? <span className="w-4 h-4 border-2 border-neutral-400 border-t-neutral-800 rounded-full animate-spin" /> : <Send size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
