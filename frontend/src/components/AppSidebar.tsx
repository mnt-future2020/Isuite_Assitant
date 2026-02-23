"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {

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
  AlertTriangle,
  Monitor,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  useLicenseAuth,
} from "@/app/ConvexClientProvider";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// License Key & OTP Input Component
function LicenseKeyInput() {
  const [licenseKey, setLicenseKey] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"KEY" | "OTP">("KEY");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { activate, generateOtp } = useLicenseAuth();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "OTP" && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isActivating) return;
    
    setIsActivating(true);
    setError("");
    const result = await generateOtp(licenseKey.trim());
    
    if (result.success && result.email) {
      try {
        await fetch("/api/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: result.email, otp: result.otp }),
        });
        setResendCooldown(30);
        setError(""); // Clear errors
      } catch (err) {
        console.error("Failed to resend OTP email", err);
        setError("Failed to resend code");
      }
    } else {
      setError(result.error || "Failed to generate new code");
    }
    setIsActivating(false);
  };

  const handleGenerateOtp = async () => {
    if (!licenseKey.trim()) {
      setError("Please enter a license key");
      return;
    }
    setIsActivating(true);
    setError("");
    const result = await generateOtp(licenseKey.trim());
    
    if (result.success && result.email) {
      try {
        // We trigger the Next.js API route to actually send the email via nodemailer
        await fetch("/api/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: result.email, otp: result.otp }), // OTP is not accessible here since it's not returned by the backend for security! Wait, our Next.js API expects it.
        });
      } catch (err) {
        console.error("Failed to trigger OTP email", err);
      }
      setEmail(result.email);
      setStep("OTP");
      setResendCooldown(30);
    } else {
      setError(result.error || "Invalid license key");
    }
    setIsActivating(false);
  };

  const handleActivate = async () => {
    if (!otp.trim()) {
      setError("Please enter the verification code");
      return;
    }
    setIsActivating(true);
    setError("");
    const result = await activate(licenseKey.trim(), otp.trim());
    if (!result.success) {
      setError(result.error || "Invalid verification code");
    }
    setIsActivating(false);
  };

  if (step === "OTP") {
    return (
      <div className="p-4 space-y-3 border-t border-border transition-all duration-300 animate-in fade-in slide-in-from-right-4">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Verification Required
        </div>
        <div className="text-xs text-muted-foreground mb-2">
          We sent a code to <span className="text-foreground font-semibold">{email}</span>.
        </div>
        <input
          type="text"
          placeholder="Enter 6-digit code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
          className="w-full bg-transparent border-b border-border py-2 text-center text-lg tracking-[0.5em] font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-foreground transition-colors"
        />
        {error && (
          <div className="text-destructive text-xs animate-in fade-in slide-in-from-top-1 duration-200">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setStep("KEY")}
            disabled={isActivating}
            className="flex-1 py-2 border border-border text-foreground rounded-md text-sm font-medium hover:bg-secondary transition-all duration-200 disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={handleActivate}
            disabled={isActivating || otp.length < 6}
            className="flex-[2] flex items-center justify-center gap-2 py-2 bg-foreground text-background rounded-md text-sm font-medium hover:opacity-90 transition-all duration-200 disabled:opacity-50"
          >
            <span>{isActivating ? "Verifying..." : "Verify & Activate"}</span>
          </button>
        </div>
        <div className="text-center mt-3">
          <button
            onClick={handleResendOtp}
            disabled={resendCooldown > 0 || isActivating}
            className="text-xs text-blue-500 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:text-muted-foreground disabled:hover:text-muted-foreground"
          >
            {resendCooldown > 0 
              ? `Resend code in ${resendCooldown}s` 
              : "Didn't receive a code? Resend"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 border-t border-border transition-all duration-300">
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
        <div className="text-destructive text-xs animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </div>
      )}
      <button
        onClick={handleGenerateOtp}
        disabled={isActivating}
        className="w-full flex items-center justify-center gap-2 py-2 bg-foreground text-background rounded-md text-sm font-medium hover:opacity-90 transition-all duration-200 disabled:opacity-50"
      >
        <Key size={14} />
        <span>{isActivating ? "Verifying..." : "Continue"}</span>
      </button>
    </div>
  );
}

// User License Card Component - smooth transitions for collapsed/expanded states
function UserLicenseCard({ isCollapsed }: { isCollapsed: boolean }) {
  const { user, logout, daysRemaining } = useLicenseAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLoggingOut(false);
    setShowLogoutModal(false);
  };

  // Days remaining color
  const getDaysColor = () => {
    if (!daysRemaining || daysRemaining <= 3) return "text-red-400";
    if (daysRemaining <= 7) return "text-yellow-400";
    return "text-emerald-400";
  };

  // Plan display name
  const getPlanLabel = () => {
    if (user.durationDays === 365) return "Annual";
    if (user.durationDays === 90) return "Quarterly";
    if (user.durationDays === 30) return "Monthly";
    if (user.durationDays === 20) return "Starter";
    return user.plan;
  };

  return (
    <div className={cn(
      "border-t border-border transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]",
      isCollapsed ? "p-3" : "p-4"
    )}>
      <div className={cn(
        "flex items-center rounded-lg transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]",
        isCollapsed 
          ? "flex-col gap-3 p-2" 
          : "gap-3 p-3 bg-secondary/30 hover:bg-secondary/50"
      )}>
        {/* Avatar */}
        <div
          className={cn(
            "rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold shrink-0 transition-all duration-300",
            isCollapsed ? "w-9 h-9" : "w-8 h-8"
          )}
          title={user.email}
        >
          {user.email?.charAt(0).toUpperCase() || "U"}
        </div>

        {/* User Info - slides out when collapsed */}
        <div className={cn(
          "flex flex-col min-w-0 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden",
          isCollapsed ? "w-0 h-0 opacity-0" : "flex-1 opacity-100"
        )}>
          <span className="text-sm font-medium text-foreground truncate">
            {user.name || user.email}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground capitalize">
              {getPlanLabel()}
            </span>
            {daysRemaining !== null && (
              <span className={cn("text-xs font-medium", getDaysColor())}>
                · {daysRemaining}d left
              </span>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => setShowLogoutModal(true)}
          disabled={isLoggingOut}
          className={cn(
            "text-muted-foreground hover:text-destructive transition-all duration-200",
            isCollapsed ? "p-0" : "p-1",
            isLoggingOut && "opacity-50 cursor-not-allowed"
          )}
          title="Sign out"
        >
          <LogOut size={16} className={isLoggingOut ? "animate-spin" : ""} />
        </button>

        {/* Logout Confirmation Modal */}
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-background border border-border rounded-lg shadow-lg p-6 animate-in zoom-in-95 duration-200 mx-4">
              <div className="flex flex-col space-y-2 text-center sm:text-left">
                <h3 className="text-lg font-semibold text-foreground">
                  Sign Out?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to sign out? You will need your license key to sign back in.
                </p>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  disabled={isLoggingOut}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                >
                  {isLoggingOut ? "Signing Out..." : "Sign Out"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


export default function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { licenseKey, isExpired, isSessionConflict, logout } = useLicenseAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Force logout handler for expired/conflicted states
  const handleForceLogout = async () => {
    await logout();
  };
  
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
               <div className="w-9 h-9 bg-foreground text-background rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-border/10">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="4" width="6" height="16" rx="1.5" fill="currentColor" />
                    <rect x="14" y="11" width="6" height="9" rx="1.5" fill="currentColor" fillOpacity="0.85" />
                    <circle cx="17" cy="6" r="2.5" fill="currentColor" />
                  </svg>
               </div>
               <span className="font-serif text-xl font-medium tracking-tight text-foreground whitespace-nowrap">
                  iSuite
               </span>
            </div>
          ) : (
            <div className="w-9 h-9 bg-foreground text-background rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-border/10">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="4" width="6" height="16" rx="1.5" fill="currentColor" />
                    <rect x="14" y="11" width="6" height="9" rx="1.5" fill="currentColor" fillOpacity="0.85" />
                    <circle cx="17" cy="6" r="2.5" fill="currentColor" />
                </svg>
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
          {(() => {
            if (isExpired) {
              return (
                <div className="p-4 border-t border-border space-y-3">
                  <div className="flex items-center gap-2 text-yellow-500">
                    <AlertTriangle size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Subscription Expired</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your subscription has expired. Please renew to continue using iSuite.
                  </p>
                  <button
                    onClick={handleForceLogout}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-foreground text-background rounded-md text-sm font-medium hover:opacity-90 transition-all duration-200"
                  >
                    <Key size={14} />
                    <span>Enter New Key</span>
                  </button>
                </div>
              );
            }
            if (isSessionConflict) {
              return (
                <div className="p-4 border-t border-border space-y-3">
                  <div className="flex items-center gap-2 text-red-400">
                    <Monitor size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Active Elsewhere</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This license key is currently active on another device. Please logout from that device first.
                  </p>
                  <button
                    onClick={handleForceLogout}
                    className="w-full flex items-center justify-center gap-2 py-2 border border-border text-foreground rounded-md text-sm font-medium hover:bg-secondary transition-all duration-200"
                  >
                    <Key size={14} />
                    <span>Use Different Key</span>
                  </button>
                </div>
              );
            }
            if (!licenseKey) {
              return <LicenseKeyInput />;
            }
            return <UserLicenseCard isCollapsed={isSidebarCollapsed} />;
          })()}
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
