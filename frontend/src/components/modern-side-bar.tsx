"use client";
import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Zap,
  MessageSquare,
  Layout,
  Search,
  Trash2
} from 'lucide-react';

interface NavigationItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
}

interface SidebarProps {
  className?: string;
}

// Updated navigation items to match iSuite Assistant
const navigationItems: NavigationItem[] = [
  { id: "ai-chat", name: "AI Chat", icon: Sparkles, href: "/" },
  { id: "integrations", name: "Integrations", icon: Zap, href: "/integrations" },
  { id: "settings", name: "Settings", icon: Settings, href: "/settings" },
];

export function Sidebar({ className = "" }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("ai-chat");

  // Auto-open sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-6 left-6 z-50 p-3 rounded-lg bg-neutral-900/80 backdrop-blur-md shadow-lg border border-neutral-700 md:hidden hover:bg-neutral-800 transition-all duration-200"
        aria-label="Toggle sidebar"
      >
        {isOpen ? 
          <X className="h-5 w-5 text-neutral-200" /> : 
          <Menu className="h-5 w-5 text-neutral-200" />
        }
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300" 
          onClick={toggleSidebar} 
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 border-r border-neutral-800 z-40 transition-all duration-300 ease-in-out flex flex-col shadow-2xl
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "w-20" : "w-72"}
          md:translate-x-0 md:static md:z-auto
          ${className}
        `}
      >
        {/* Header with logo and collapse button */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Layout className="text-white h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-white text-base">iSuite Assistant</span>
                <span className="text-xs text-neutral-400">AI-Powered Chat</span>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
              <Layout className="text-white h-5 w-5" />
            </div>
          )}

          {/* Desktop collapse button */}
          <button
            onClick={toggleCollapse}
            className="hidden md:flex p-1.5 rounded-md hover:bg-neutral-800 transition-all duration-200"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-neutral-400" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-neutral-400" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleItemClick(item.id)}
                    className={`
                      relative w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group
                      ${isActive
                        ? "bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-blue-400 shadow-lg shadow-blue-500/10"
                        : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
                      }
                      ${isCollapsed ? "justify-center px-2" : ""}
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    {isActive && !isCollapsed && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full" />
                    )}
                    
                    <div className="flex items-center justify-center min-w-[20px]">
                      <Icon
                        className={`
                          h-5 w-5 flex-shrink-0
                          ${isActive 
                            ? "text-blue-400" 
                            : "text-neutral-500 group-hover:text-neutral-300"
                          }
                        `}
                      />
                    </div>
                    
                    {!isCollapsed && (
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}>{item.name}</span>
                        {item.badge && (
                          <span className={`
                            px-2 py-0.5 text-xs font-semibold rounded-full
                            ${isActive
                              ? "bg-blue-500/20 text-blue-300"
                              : "bg-neutral-800 text-neutral-400"
                            }
                          `}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Badge for collapsed state */}
                    {isCollapsed && item.badge && (
                      <div className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-blue-500 border-2 border-neutral-900">
                        <span className="text-[9px] font-bold text-white">
                          {parseInt(item.badge) > 9 ? '9+' : item.badge}
                        </span>
                      </div>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 px-3 py-1.5 bg-neutral-800 text-neutral-200 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-neutral-700">
                        {item.name}
                        {item.badge && (
                          <span className="ml-2 px-1.5 py-0.5 bg-neutral-700 rounded-full text-[10px]">
                            {item.badge}
                          </span>
                        )}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-neutral-800 rotate-45 border-l border-b border-neutral-700" />
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Recent Chats Section */}
        {!isCollapsed && (
          <div className="flex-1 px-3 overflow-hidden flex flex-col">
            <div className="px-3 py-2 mb-2">
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Recent Chats</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 px-1 custom-scrollbar">
              {["Greeting Initiation", "New Chat", "Greeting Initiation", "Ratan Tata Google Do...", "Greeting Initiation", "Greetings Initiated", "Greeting Initiated"].map((chat, idx) => (
                <button
                  key={idx}
                  className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group hover:bg-neutral-800/50 text-neutral-400 hover:text-neutral-200"
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0 text-neutral-600 group-hover:text-neutral-400" />
                  <span className="text-sm truncate flex-1">{chat}</span>
                  <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all">
                    <Trash2 className="h-3.5 w-3.5 text-neutral-500 hover:text-red-400" />
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom section with profile and logout */}
        <div className="mt-auto border-t border-neutral-800">
          {/* Profile Section */}
          <div className={`border-b border-neutral-800 bg-neutral-900/50 ${isCollapsed ? 'py-3 px-2' : 'p-3'}`}>
            {!isCollapsed ? (
              <div className="flex items-center px-3 py-2.5 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 transition-all duration-200 border border-neutral-700/50">
                <div className="w-9 h-9 bg-gradient-to-br from-neutral-700 to-neutral-800 rounded-full flex items-center justify-center border-2 border-neutral-600">
                  <span className="text-neutral-200 font-semibold text-sm">N</span>
                </div>
                <div className="flex-1 min-w-0 ml-3">
                  <p className="text-sm font-semibold text-neutral-200 truncate">test@isuiteassistant.com</p>
                  <p className="text-xs text-neutral-400 truncate">Pro Plan</p>
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full ml-2 shadow-lg shadow-green-400/50" title="Online" />
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-neutral-700 to-neutral-800 rounded-full flex items-center justify-center border-2 border-neutral-600">
                    <span className="text-neutral-200 font-semibold text-sm">N</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-neutral-900 shadow-lg shadow-green-400/50" />
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <div className="p-3">
            <button
              onClick={() => handleItemClick("logout")}
              className={`
                w-full flex items-center rounded-xl text-left transition-all duration-200 group
                text-red-400 hover:bg-red-500/10 hover:text-red-300
                ${isCollapsed ? "justify-center p-2.5" : "space-x-3 px-4 py-3"}
              `}
              title={isCollapsed ? "Logout" : undefined}
            >
              <div className="flex items-center justify-center min-w-[20px]">
                <LogOut className="h-5 w-5 flex-shrink-0 text-red-400 group-hover:text-red-300" />
              </div>
              
              {!isCollapsed && (
                <span className="text-sm font-medium">Logout</span>
              )}
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-neutral-800 text-neutral-200 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-neutral-700">
                  Logout
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-neutral-800 rotate-45 border-l border-b border-neutral-700" />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className={`
          transition-all duration-300 ease-in-out w-full
          ${isCollapsed ? "md:ml-20" : "md:ml-72"}
        `}
      >
        {/* Your content remains the same */}
        
      </div>
    </>
  );
}