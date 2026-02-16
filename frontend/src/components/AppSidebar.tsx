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
    <div className="p-4 space-y-3 border-t border-border">
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
        Activate License
      </div>
      <input
        type="text"
        placeholder="XXXX-XXXX-XXXX-XXXX"
        value={licenseKey}
        onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
        className="w-full bg-transparent border-b border-border py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
      />
      {error && (
        <div className="text-destructive text-xs">
          {error}
        </div>
      )}
      <button
        onClick={handleActivate}
        disabled={isActivating}
        className="w-full flex items-center justify-center gap-2 py-2 bg-foreground text-background rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        <Key size={14} />
        <span>{isActivating ? "Activating..." : "Activate"}</span>
      </button>
    </div>
  );
}

// User License Card Component - smooth transitions for collapsed/expanded states
function UserLicenseCard({ isCollapsed }: { isCollapsed: boolean }) {
  const { user, logout } = useLicenseAuth();

  if (!user) return null;

  if (isCollapsed) {
    // Collapsed state - stacked vertically
    return (
      <div className="flex flex-col items-center gap-3 py-4 border-t border-border">
        <div
          className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold"
          title={user.email}
        >
          {user.email?.charAt(0).toUpperCase() || "U"}
        </div>

        <button
          onClick={logout}
          className="text-muted-foreground hover:text-destructive transition-colors"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    );
  }

  // Expanded state - horizontal layout
  return (
    <div className="p-4 border-t border-border">
      <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold shrink-0">
            {user.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-foreground truncate">
              {user.name || user.email}
            </span>
            <span className="text-xs text-muted-foreground capitalize truncate">
              {user.plan} Plan
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          className="text-muted-foreground hover:text-destructive transition-colors p-1"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
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

  // State for delete modal
  const [deleteConfig, setDeleteConfig] = useState<{ isOpen: boolean; chatId: string | null; title: string }>({
    isOpen: false,
    chatId: null,
    title: "",
  });

  const handleDeleteClick = (e: React.MouseEvent, chatId: string, title: string) => {
    e.stopPropagation();
    setDeleteConfig({ isOpen: true, chatId, title });
  };

  const confirmDelete = async () => {
    if (deleteConfig.chatId) {
      await deleteConversation({ conversationId: deleteConfig.chatId as Id<"conversations"> });
      if (window.location.search.includes(deleteConfig.chatId)) {
        router.push("/");
      }
      setDeleteConfig({ isOpen: false, chatId: null, title: "" });
    }
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 md:hidden text-foreground bg-background border border-border rounded-md shadow-sm"
        aria-label="Toggle sidebar"
      >
        {isSidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-background border border-border rounded-lg shadow-lg p-6 animate-in zoom-in-95 duration-200 mx-4">
            <div className="flex flex-col space-y-2 text-center sm:text-left">
              <h3 className="text-lg font-semibold text-foreground">
                Delete Chat?
              </h3>
              <p className="text-sm text-muted-foreground">
                This will permanently delete <span className="font-medium text-foreground">&quot;{deleteConfig.title}&quot;</span>. This action cannot be undone.
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6">
              <button
                onClick={() => setDeleteConfig({ isOpen: false, chatId: null, title: "" })}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar - Navigation */}
      <aside
        className={cn(
          "fixed md:relative z-40 h-full bg-background border-r border-border transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col",
          !isSidebarOpen && "hidden md:flex md:w-0 md:min-w-0 md:overflow-hidden md:border-none",
          isSidebarCollapsed ? "w-[72px]" : "w-[280px]"
        )}
      >
        {/* Header / Brand */}
        <div className={cn(
          "h-16 flex items-center justify-between px-4 border-b border-border",
          isSidebarCollapsed && "justify-center px-0"
        )}>
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-3 overflow-hidden">
               <div className="w-8 h-8 bg-foreground text-background rounded-md flex items-center justify-center shrink-0">
                  <Layout size={18} />
               </div>
               <span className="font-serif text-lg font-medium tracking-tight text-foreground whitespace-nowrap">
                  iSuite
               </span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-foreground text-background rounded-md flex items-center justify-center shrink-0">
               <Layout size={18} />
            </div>
          )}

          {/* Collapse Button */}
           {!isSidebarCollapsed && (
            <button
              onClick={toggleSidebarCollapse}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
           )}
        </div>

        {/* Expand Trigger (when collapsed) */}
        {isSidebarCollapsed && (
          <button
             onClick={toggleSidebarCollapse}
             className="absolute top-20 -right-3 z-50 w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm"
          >
            <ChevronRight size={12} />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-none p-3 space-y-1">
           <NavItem 
             icon={<SquarePen size={18} />} 
             label="New Chat" 
             active={pathname === "/"} 
             collapsed={isSidebarCollapsed}
             onClick={() => router.push("/")}
           />
           <NavItem 
             icon={<Layers size={18} />} 
             label="Integrations" 
             active={pathname === "/integrations"} 
             collapsed={isSidebarCollapsed}
             onClick={() => router.push("/integrations")}
           />
           <NavItem 
             icon={<SlidersHorizontal size={18} />} 
             label="Settings" 
             active={pathname === "/settings"} 
             collapsed={isSidebarCollapsed}
             onClick={() => router.push("/settings")}
           />
        </nav>

        {/* Recent Chats */}
        {!isSidebarCollapsed && (
          <div className="flex-1 overflow-y-auto px-3 min-h-0">
            <div className="px-3 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest opacity-70">
              Recent Chats
            </div>
            <div className="space-y-0.5">
              {conversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => router.push(`/?chatId=${conv._id}`)}
                  className="group flex items-center gap-3 px-3 py-2.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 cursor-pointer transition-all duration-200"
                >
                  <MessageSquare size={14} className="opacity-50 group-hover:opacity-100" />
                  <span className="truncate flex-1">{conv.title}</span>
                  <button
                    onClick={(e) => handleDeleteClick(e, conv._id, conv.title)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {conversations.length === 0 && (
                 <div className="px-3 py-4 text-sm text-muted-foreground italic text-center">
                    No recent chats
                 </div>
              )}
            </div>
          </div>
        )}

        {/* Footer / License */}
        <div className="mt-auto">
          {!licenseKey ? (
            <LicenseKeyInput />
          ) : (
            <UserLicenseCard isCollapsed={isSidebarCollapsed} />
          )}
        </div>
      </aside>
    </>
  );
}

// Helper NavItem Component
function NavItem({ 
  icon, 
  label, 
  active, 
  collapsed, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  collapsed: boolean; 
  onClick: () => void; 
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group relative",
        active 
          ? "bg-secondary text-foreground font-medium shadow-sm" 
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
        collapsed && "justify-center px-2"
      )}
      title={collapsed ? label : undefined}
    >
      <span className={cn("transition-colors", active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
        {icon}
      </span>
      {!collapsed && (
        <span className="text-sm">{label}</span>
      )}
      {active && collapsed && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-foreground rounded-r-full" />
      )}
    </button>
  );
}
