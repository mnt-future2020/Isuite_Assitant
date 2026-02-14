"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  Layout,
  SquarePen,
  Layers,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Key,
  Menu,
  X,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  useLicenseAuth,
  LicenseAuthenticated,
  LicenseUnauthenticated,
  LicenseLoading,
} from "@/app/ConvexClientProvider";

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
      <div style={{ marginBottom: 8, fontSize: 12, color: "#9ca3af" }}>
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
          borderRadius: 8,
          border: "1px solid #374151",
          background: "#1f2937",
          color: "#e5e7eb",
          marginBottom: 8,
          fontSize: 13,
          fontFamily: "monospace",
          outline: "none",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#3b82f6";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#374151";
          e.currentTarget.style.boxShadow = "none";
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
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "10px 16px",
          borderRadius: 8,
          background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
          color: "white",
          border: "none",
          fontSize: 14,
          fontWeight: 600,
          cursor: isActivating ? "not-allowed" : "pointer",
          opacity: isActivating ? 0.7 : 1,
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          if (!isActivating) {
            e.currentTarget.style.transform = "translateY(-1px)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <Key size={16} />
        <span>{isActivating ? "Activating..." : "Activate License"}</span>
      </button>
    </div>
  );
}

// User License Card Component
// User License Card Component - smooth transitions for collapsed/expanded states
function UserLicenseCard({ isCollapsed }: { isCollapsed: boolean }) {
  const { user, logout } = useLicenseAuth();

  if (!user) return null;

  if (isCollapsed) {
    // Collapsed state - stacked vertically
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 14,
            fontWeight: 600,
            border: "2px solid #1e3a8a",
            cursor: "pointer",
            transition: "all 0.2s",
            flexShrink: 0,
          }}
          title={user.email}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {user.email?.charAt(0).toUpperCase() || "U"}
        </div>

        <button
          onClick={logout}
          style={{
            background: "transparent",
            border: "1px solid #2a2a2a",
            cursor: "pointer",
            padding: 8,
            borderRadius: 8,
            color: "#9ca3af",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
            width: "100%",
            flexShrink: 0,
          }}
          title="Sign out"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
            e.currentTarget.style.color = "#ef4444";
            e.currentTarget.style.borderColor = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#9ca3af";
            e.currentTarget.style.borderColor = "#2a2a2a";
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    );
  }

  // Expanded state - horizontal layout
  return (
    <div
      className="user-card"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 12px",
        borderRadius: "12px",
        background: "rgba(38, 38, 38, 0.5)",
        border: "1px solid #2a2a2a",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(38, 38, 38, 0.8)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(38, 38, 38, 0.5)";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 14,
            fontWeight: 600,
            border: "2px solid #1e3a8a",
            flexShrink: 0,
          }}
        >
          {user.email?.charAt(0).toUpperCase() || "U"}
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#e5e7eb",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.name || user.email}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#9ca3af",
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
          borderRadius: 6,
          color: "#9ca3af",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
          flexShrink: 0,
          marginLeft: 8,
        }}
        title="Sign out"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
          e.currentTarget.style.color = "#ef4444";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#9ca3af";
        }}
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}


export default function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { licenseKey } = useLicenseAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const conversations = useQuery(api.conversations.list, licenseKey ? { licenseKey } : "skip") || [];
  const deleteConversation = useMutation(api.conversations.remove);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleSidebarCollapse = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-6 left-6 z-50 p-3 rounded-lg bg-neutral-900/80 backdrop-blur-md shadow-lg border border-neutral-700 md:hidden hover:bg-neutral-800 transition-all duration-200"
        aria-label="Toggle sidebar"
      >
        {isSidebarOpen ? (
          <X className="h-5 w-5 text-neutral-200" />
        ) : (
          <Menu className="h-5 w-5 text-neutral-200" />
        )}
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
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          background: "linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)",
          borderRight: "1px solid #2a2a2a",
          width: isSidebarCollapsed ? "80px" : "260px",
          minWidth: isSidebarCollapsed ? "80px" : "260px",
          transition:
            "width 0.3s ease-in-out, min-width 0.3s ease-in-out, transform 0.3s ease-in-out",
          position: "relative",
          zIndex: 40,
          overflow: "hidden",
        }}
      >
        <div
          className="sidebar-brand"
          style={{
            padding: "20px 16px",
            borderBottom: "1px solid #2a2a2a",
            background: "rgba(26, 26, 26, 0.5)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: "80px",
            flexShrink: 0,
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flex: 1,
              overflow: "hidden",
            }}
          >
            <div
              className="sidebar-logo"
              style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Layout size={20} style={{ color: "white" }} />
            </div>

            <span
              className="brand-name"
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#ffffff",
                letterSpacing: "-0.3px",
                opacity: isSidebarCollapsed ? 0 : 1,
                transition: "opacity 0.2s ease-in-out",
                whiteSpace: "nowrap",
                overflow: "hidden",
                width: isSidebarCollapsed ? "0" : "auto",
              }}
            >
              iSuite Assistant
            </span>
          </div>

          {/* Desktop collapse button */}
          {!isSidebarCollapsed ? (
            <button
              onClick={toggleSidebarCollapse}
              className="sidebar-collapse-btn"
              style={{
                padding: "8px",
                borderRadius: "8px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#9ca3af",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginLeft: "8px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#9ca3af";
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
                position: "absolute",
                top: "50%",
                right: "16px",
                transform: "translateY(-50%)",
                padding: "8px",
                borderRadius: "8px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#9ca3af",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#9ca3af";
              }}
              aria-label="Expand sidebar"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        <nav className="nav-section" style={{ padding: "16px 12px", flexShrink: 0 }}>
          <button
            className={cn("nav-item", pathname === "/" && "active")}
            onClick={() => router.push("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px",
              borderRadius: "12px",
              background:
                pathname === "/"
                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)"
                  : "transparent",
              color: pathname === "/" ? "#60a5fa" : "#9ca3af",
              fontSize: "14px",
              fontWeight: pathname === "/" ? "600" : "500",
              cursor: "pointer",
              border: "none",
              width: "100%",
              textAlign: "left",
              position: "relative",
              marginBottom: "4px",
              justifyContent: isSidebarCollapsed ? "center" : "flex-start",
              overflow: "hidden",
              transition: "all 0.2s",
            }}
            title={isSidebarCollapsed ? "New Chat" : undefined}
            onMouseEnter={(e) => {
              if (pathname !== "/") {
                e.currentTarget.style.background = "rgba(59, 130, 246, 0.08)";
                e.currentTarget.style.color = "#d1d5db";
              }
            }}
            onMouseLeave={(e) => {
              if (pathname !== "/") {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#9ca3af";
              }
            }}
          >
            {pathname === "/" && !isSidebarCollapsed && (
              <div
                style={{
                  position: "absolute",
                  left: "0",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "3px",
                  height: "24px",
                  background: "linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)",
                  borderRadius: "0 2px 2px 0",
                }}
              />
            )}
            <SquarePen
              size={20}
              style={{
                flexShrink: 0,
                marginLeft: isSidebarCollapsed ? "0" : "8px",
                strokeWidth: 2,
              }}
            />
            <span
              style={{
                opacity: isSidebarCollapsed ? 0 : 1,
                transition: "opacity 0.2s ease-in-out",
                whiteSpace: "nowrap",
                overflow: "hidden",
                width: isSidebarCollapsed ? "0" : "auto",
              }}
            >
              New Chat
            </span>
          </button>

          <button
            className={cn("nav-item", pathname === "/integrations" && "active")}
            onClick={() => router.push("/integrations")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px",
              borderRadius: "12px",
              background:
                pathname === "/integrations"
                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)"
                  : "transparent",
              color: pathname === "/integrations" ? "#60a5fa" : "#9ca3af",
              fontSize: "14px",
              fontWeight: pathname === "/integrations" ? "600" : "500",
              cursor: "pointer",
              border: "none",
              width: "100%",
              textAlign: "left",
              position: "relative",
              marginBottom: "4px",
              justifyContent: isSidebarCollapsed ? "center" : "flex-start",
              overflow: "hidden",
              transition: "all 0.2s",
            }}
            title={isSidebarCollapsed ? "Integrations" : undefined}
            onMouseEnter={(e) => {
              if (pathname !== "/integrations") {
                e.currentTarget.style.background = "rgba(59, 130, 246, 0.08)";
                e.currentTarget.style.color = "#d1d5db";
              }
            }}
            onMouseLeave={(e) => {
              if (pathname !== "/integrations") {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#9ca3af";
              }
            }}
          >
            {pathname === "/integrations" && !isSidebarCollapsed && (
              <div
                style={{
                  position: "absolute",
                  left: "0",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "3px",
                  height: "24px",
                  background: "linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)",
                  borderRadius: "0 2px 2px 0",
                }}
              />
            )}
            <Layers size={20} style={{ flexShrink: 0, strokeWidth: 2 }} />
            <span
              style={{
                opacity: isSidebarCollapsed ? 0 : 1,
                transition: "opacity 0.2s ease-in-out",
                whiteSpace: "nowrap",
                overflow: "hidden",
                width: isSidebarCollapsed ? "0" : "auto",
              }}
            >
              Integrations
            </span>
          </button>

          <button
            className={cn("nav-item", pathname === "/settings" && "active")}
            onClick={() => router.push("/settings")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px",
              borderRadius: "12px",
              background:
                pathname === "/settings"
                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)"
                  : "transparent",
              color: pathname === "/settings" ? "#60a5fa" : "#9ca3af",
              fontSize: "14px",
              fontWeight: pathname === "/settings" ? "600" : "500",
              cursor: "pointer",
              border: "none",
              width: "100%",
              textAlign: "left",
              position: "relative",
              justifyContent: isSidebarCollapsed ? "center" : "flex-start",
              overflow: "hidden",
              transition: "all 0.2s",
            }}
            title={isSidebarCollapsed ? "Settings" : undefined}
            onMouseEnter={(e) => {
              if (pathname !== "/settings") {
                e.currentTarget.style.background = "rgba(59, 130, 246, 0.08)";
                e.currentTarget.style.color = "#d1d5db";
              }
            }}
            onMouseLeave={(e) => {
              if (pathname !== "/settings") {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#9ca3af";
              }
            }}
          >
            {pathname === "/settings" && !isSidebarCollapsed && (
              <div
                style={{
                  position: "absolute",
                  left: "0",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "3px",
                  height: "24px",
                  background: "linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)",
                  borderRadius: "0 2px 2px 0",
                }}
              />
            )}
            <SlidersHorizontal size={20} style={{ flexShrink: 0, strokeWidth: 2 }} />
            <span
              style={{
                opacity: isSidebarCollapsed ? 0 : 1,
                transition: "opacity 0.2s ease-in-out",
                whiteSpace: "nowrap",
                overflow: "hidden",
                width: isSidebarCollapsed ? "0" : "auto",
              }}
            >
              Settings
            </span>
          </button>
        </nav>

        {/* Recent Chats Section - Only visible when NOT collapsed */}
        {!isSidebarCollapsed && (
          <>
            <div
              className="section-label"
              style={{
                padding: "20px 16px 10px",
                fontSize: "11px",
                fontWeight: "600",
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              RECENT CHATS
            </div>

            <div
              className="recent-chats-list"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "0 12px 12px",
              }}
            >
              {conversations.map((conv) => (
                <div
                  key={conv._id}
                  className="recent-chat-item"
                  onClick={() => {
                    router.push("/");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: "#9ca3af",
                    background: "transparent",
                    marginBottom: "2px",
                    transition: "all 0.2s",
                    fontWeight: "400",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                    e.currentTarget.style.color = "#d1d5db";
                    e.currentTarget.style.transform = "translateX(2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#9ca3af";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <MessageSquare
                    size={16}
                    style={{ flexShrink: 0, opacity: 0.6 }}
                  />
                  <span
                    style={{
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {conv.title}
                  </span>
                  <button
                    className="delete-chat-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete this chat?")) {
                        deleteConversation({ conversationId: conv._id });
                      }
                    }}
                    title="Delete chat"
                    style={{
                      opacity: 0,
                      padding: "5px",
                      border: "none",
                      background: "transparent",
                      color: "#6b7280",
                      cursor: "pointer",
                      borderRadius: "5px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
                      e.currentTarget.style.color = "#ef4444";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#6b7280";
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {conversations.length === 0 && (
                <div
                  className="recent-chat-item"
                  style={{
                    opacity: 0.5,
                    fontStyle: "italic",
                    padding: "10px 12px",
                    color: "#6b7280",
                    fontSize: "13px",
                  }}
                >
                  No recent chats
                </div>
              )}
            </div>
          </>
        )}

        <div
          className="user-profile-section"
          style={{
            marginTop: "auto",
            padding: "12px",
            borderTop: "1px solid #2a2a2a",
            background: "rgba(10, 10, 10, 0.5)",
          }}
        >
          <LicenseAuthenticated>
            <UserLicenseCard isCollapsed={isSidebarCollapsed} />
          </LicenseAuthenticated>
          <LicenseUnauthenticated>
            {!isSidebarCollapsed && <LicenseKeyInput />}
          </LicenseUnauthenticated>
          <LicenseLoading>
            <div className="user-card animate-pulse">
              <div className="user-avatar-sm bg-gray-200"></div>
              {!isSidebarCollapsed && (
                <div className="user-info-sm h-4 w-24 bg-gray-200 rounded"></div>
              )}
            </div>
          </LicenseLoading>
        </div>
      </aside>
    </>
  );
}
