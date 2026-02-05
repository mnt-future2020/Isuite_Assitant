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
      <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
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
          borderRadius: 6,
          border: '1px solid var(--border-light)',
          marginBottom: 8,
          fontSize: 13,
          fontFamily: 'monospace'
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
        className="nav-item w-full justify-center"
        style={{
          background: 'var(--accent-primary)',
          color: 'white',
          border: 'none',
          opacity: isActivating ? 0.7 : 1
        }}
      >
        <Key size={16} />
        <span>{isActivating ? 'Activating...' : 'Activate License'}</span>
      </button>
      <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
        Don't have a license? <a href="https://isuiteassistant.com" target="_blank" style={{ color: 'var(--accent-primary)' }}>Get one here</a>
      </div>
    </div>
  );
}

// User License Card Component
function UserLicenseCard() {
  const { user, logout } = useLicenseAuth();

  if (!user) return null;

  return (
    <div className="user-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'var(--accent-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 14,
          fontWeight: 600
        }}>
          {user.email?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{user.name || user.email}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
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
          borderRadius: 4,
          color: 'var(--text-secondary)'
        }}
        title="Sign out"
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const homeFileRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [previewImage, setPreviewImage] = useState<Attachment | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    await sendMessage(input, "claude", preferredModel, attachments);
    
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
    <div className="app-container">
      {/* Left Sidebar - Navigation */}
      <aside className={cn("left-sidebar", !isSidebarOpen && "hidden")} style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div className="sidebar-brand">
            <div className="sidebar-logo">
                <Layout size={18} />
            </div>
            <span className="brand-name">iSuite Assistant</span>
        </div>

        <nav className="nav-section">
            <button 
                className="nav-item active"
                onClick={() => router.push("/")}
            >
                <Sparkles size={18} />
                <span>AI Chat</span>
            </button>
            <button 
                className="nav-item"
                onClick={() => router.push("/integrations")}
            >
                <Zap size={18} />
                <span>Integrations</span>
            </button>
            <button 
                className="nav-item"
                onClick={() => router.push("/settings")}
            >
                <Settings size={18} />
                <span>Settings</span>
            </button>
        </nav>

        <div className="section-label">RECENT CHATS</div>
        
        <div className="recent-chats-list">
            {conversations.map((conv) => (
              <div
                key={conv._id}
                className={cn("recent-chat-item", selectedConversationId === conv._id && "active")}
                onClick={() => {
                  setSelectedConversationId(conv._id);
                }}
              >
                <MessageSquare size={14} />
                <span>{conv.title}</span>
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
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="recent-chat-item italic opacity-50">
                No recent chats
              </div>
            )}
        </div>
        
        <div className="user-profile-section" style={{ marginTop: 'auto' }}>
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
      <main className="main-content" style={{ background: 'var(--bg-main)' }}>
        {!isSidebarOpen && (
             <button 
               onClick={() => setIsSidebarOpen(true)}
               style={{ position: 'absolute', left: 16, top: 16, zIndex: 50, padding: 8, background: 'white', borderRadius: 8, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
             >
               <Menu size={20} />
             </button>
        )}

        {messages.length === 0 ? (
          <div className="home-view">
            <div className="greeting-section">
              <div className="greeting">
                <div className="sidebar-logo" style={{ width: 48, height: 48, marginBottom: 16 }}>
                    <Layout size={24} />
                </div>
                <h1 className="greeting-text" style={{ fontSize: 32, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>How can I help you today?</h1>
                <p className="tagline">Your AI coworker, powered by iSuite Assistant</p>
                
                {/* Middleware now handles the redirect, so we only render the authenticated view */}
              </div>
            </div>

            <LicenseAuthenticated>
              <div className="input-container">
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  {/* Image Attachments Inside Input */}
                  {attachments.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, padding: '12px 12px 0 12px', flexWrap: 'wrap' }}>
                      {attachments.map((att, idx) => (
                        <div 
                          key={idx} 
                          style={{ 
                            position: 'relative',
                            cursor: 'pointer',
                            borderRadius: 8,
                            overflow: 'visible'
                          }}
                          onClick={() => setPreviewImage(att)}
                        >
                          <img 
                            src={`data:${att.type};base64,${att.data}`} 
                            alt={att.name}
                            style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', border: '2px solid var(--border-light)' }}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAttachments(prev => prev.filter((_, i) => i !== idx));
                            }}
                            style={{
                              position: 'absolute',
                              top: -10,
                              right: -10,
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              background: 'rgba(0, 0, 0, 0.8)',
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 16,
                              fontWeight: 'bold',
                              transition: 'background 0.2s',
                              zIndex: 10
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.95)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)'}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <textarea
                    ref={textareaRef}
                    className="message-input"
                    placeholder="Message iSuite Assistant..."
                    value={input}
                    onChange={(e) => { setInput(e.target.value); autoResize(); }}
                    onKeyDown={handleKeyDown}
                  />
                  <div className="input-controls">
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
                        className="control-btn" 
                        onClick={() => homeFileRef.current?.click()}
                        title="Attach file"
                      >
                        <Paperclip size={20} />
                      </button>
                    </div>
                    <div className="right-controls">
                      <button 
                        className={cn("send-btn", isLoading && "streaming")}
                        onClick={handleSend}
                        disabled={!input.trim() && !isLoading}
                      >
                        {isLoading ? <X size={20} /> : <Send size={20} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Preview Modal */}
              {previewImage && (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.9)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    cursor: 'pointer'
                  }}
                  onClick={() => setPreviewImage(null)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImage(null);
                    }}
                    style={{
                      position: 'absolute',
                      top: 20,
                      right: 20,
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 28,
                      fontWeight: 'bold',
                      transition: 'background 0.2s',
                      zIndex: 1001
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                  >
                    ×
                  </button>
                  <img 
                    src={`data:${previewImage.type};base64,${previewImage.data}`} 
                    alt="Preview"
                    style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </LicenseAuthenticated>
          </div>
        ) : (
          <div className="chat-main">
            <header className="chat-header" style={{ background: 'var(--bg-white)', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {!isSidebarOpen && (
                    <button onClick={() => setIsSidebarOpen(true)} className="control-btn">
                        <Menu size={20} />
                    </button>
                  )}
                  <h2 style={{ fontSize: 16, fontWeight: 600 }}>
                    {conversations.find(c => c._id === selectedConversationId)?.title || "Current Chat"}
                  </h2>
              </div>
              <button 
                className="new-chat-btn" 
                onClick={startNewChat}
                title="New Chat"
              >
                <Plus size={20} />
              </button>
            </header>

            <div className="messages-container">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("message", msg.role)}>
                  <div 
                    className="message-content"
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
                  <div className="thinking-indicator">
                    <div className="thinking-dot"></div>
                    <div className="thinking-dot"></div>
                    <div className="thinking-dot"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area" style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
              <div className="input-container" style={{ maxWidth: '768px' }}>
                <div className="input-wrapper">
                  <textarea
                    ref={textareaRef}
                    className="message-input"
                    placeholder="Reply to iSuite Assistant..."
                    value={input}
                    onChange={(e) => { setInput(e.target.value); autoResize(); }}
                    onKeyDown={handleKeyDown}
                  />
                  <div className="input-controls">
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
                        className="control-btn" 
                        onClick={() => homeFileRef.current?.click()}
                        title="Attach file"
                      >
                        <Paperclip size={20} />
                      </button>
                    </div>
                    <div className="right-controls">
                      <button 
                        className={cn("send-btn", isLoading && "streaming")}
                        onClick={handleSend}
                        disabled={!input.trim() && !isLoading}
                      >
                        {isLoading ? <X size={20} /> : <Send size={20} />}
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
