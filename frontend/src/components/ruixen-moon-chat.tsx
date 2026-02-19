"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { marked } from "marked";
import {
  ImageIcon,
  ArrowUpIcon,
  Paperclip,
  PlusIcon,
  Code2,
  Palette,
  Menu,
  Layers,
  X,
  Pencil,
  BarChart2,
  Zap,
  BookOpen,
  AlertCircle,
} from "lucide-react";

// Helper function to add target="_blank" to all links
function parseMarkdownWithExternalLinks(content: string): string {
  const html = marked.parse(content) as string;
  return html.replace(/<a href=/g, '<a target="_blank" rel="noopener noreferrer" href=');
}

interface AutoResizeProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: AutoResizeProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`; // reset first
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Infinity)
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`;
  }, [minHeight]);

  return { textareaRef, adjustHeight };
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[];
  status?: "streaming" | "complete" | "error";
}

interface RuixenMoonChatProps {
  input: string;
  setInput: (value: string) => void;
  handleSend: () => void;
  isLoading: boolean;
  handleFileAttach: (file: File) => void;
  attachments?: { name: string; type: string; data: string }[];
  removeAttachment?: (index: number) => void;
  messages?: Message[];
  conversationTitle?: string;
  onNewChat?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  isHistoryLoading?: boolean;
}

export default function RuixenMoonChat({
  input,
  setInput,
  handleSend,
  isLoading,
  handleFileAttach,
  attachments = [],
  removeAttachment,
  messages = [],
  conversationTitle,
  onNewChat,
  isSidebarOpen,
  onToggleSidebar,
  isHistoryLoading = false,
}: RuixenMoonChatProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 200,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isHistoryLoading]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsAttachOpen(false);
      }
    }
    if (isAttachOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAttachOpen]);

  // Handle Escape key to close image preview
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedImage(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render messages view when there are messages
  if (messages.length > 0 || isHistoryLoading) {
    return (
      <div className="relative w-full h-full flex flex-col bg-background font-sans">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-md text-foreground hover:bg-accent transition-colors"
              >
                <Menu size={20} />
              </button>
            )}
            <h2 className="text-sm font-medium text-foreground tracking-wide">
              {conversationTitle || "Conversation"}
            </h2>
          </div>
          {onNewChat && (
            <button
              onClick={onNewChat}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="New Chat"
            >
              <PlusIcon size={20} />
            </button>
          )}
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-8">
            {isHistoryLoading ? null : (
              <>
            {messages.map((msg) => {
              const hasContent = msg.content && msg.content.trim().length > 0;
              // Only show "Thinking..." if we're ACTIVELY streaming right now
              const isAssistantLoading = msg.role === "assistant" && !hasContent && isLoading;
              // Detect interrupted messages (loaded from DB after refresh with status still "streaming")
              const isInterrupted = msg.role === "assistant" && msg.status === "streaming" && !isLoading;
              const hasImages = msg.images && msg.images.length > 0;

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col gap-1",
                    msg.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  <div className={cn(
                     "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1",
                     msg.role === "user" ? "text-right" : "text-left"
                  )}>
                    {msg.role === "user" ? "You" : "Assistant"}
                  </div>
                  
                  {/* Text Bubble - Render if content exists, actively loading, or interrupted */}
                  {(hasContent || isAssistantLoading || isInterrupted) && (
                    <div
                      className={cn(
                        "rounded-2xl text-sm leading-relaxed shadow-sm transition-all duration-200 break-words",
                        "max-w-[85%]", 
                        (isAssistantLoading || (isInterrupted && !hasContent)) ? "px-3 py-2" : "px-4 py-2.5",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      {isAssistantLoading ? (
                        <div className="flex items-center gap-2.5 px-1 py-0.5">
                          <div className="w-3.5 h-3.5 border-2 border-foreground/30 border-t-foreground/80 rounded-full animate-spin" />
                          <span className="text-sm font-medium text-muted-foreground animate-pulse">Thinking...</span>
                        </div>
                      ) : hasContent ? (
                        <div 
                          className={cn("w-full overflow-hidden", msg.role === "assistant" && "markdown-content")}
                          dangerouslySetInnerHTML={{
                            __html: msg.role === "assistant"
                              ? parseMarkdownWithExternalLinks(msg.content)
                              : msg.content
                          }} 
                        />
                      ) : null}
                    </div>
                  )}

                  {/* Interrupted response indicator — shows for ALL interrupted messages (empty or partial) */}
                  {isInterrupted && (
                    <div className="flex items-center gap-1.5 mt-1 px-1">
                      <AlertCircle className="w-3 h-3 text-amber-500" />
                      <span className="text-xs text-amber-500/80">
                        {hasContent 
                          ? "Response was interrupted — you can ask again to continue"
                          : "Response was interrupted before it started — please try again"
                        }
                      </span>
                    </div>
                  )}

                  {/* Images - Outside Bubble, displayed as small thumbnails */}
                  {hasImages && (
                    <div className={cn(
                      "flex flex-wrap gap-2 mt-1", 
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}>
                      {msg.images!.map((imgData, idx) => {
                        const imgSrc = imgData.startsWith('data:') 
                          ? imgData 
                          : imgData.startsWith('http') 
                            ? imgData 
                            : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${imgData}`;
                        
                        return (
                          <div 
                             key={idx} 
                             onClick={() => setSelectedImage(imgSrc)}
                             className="relative rounded-xl overflow-hidden border border-border/50 cursor-pointer hover:opacity-80 transition-all hover:scale-105 active:scale-95 shadow-sm"
                          >
                            <img
                              src={imgSrc}
                              alt="Attachment"
                              className="w-11 h-11 object-cover bg-muted/20" 
                              loading="lazy"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* 
              Only show separate loading indicator if we are loading BUT 
              we haven't added the assistant placeholder yet (edge case).
              Once placeholder is added, the loader is shown inside the bubble above.
            */}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex flex-col items-start gap-2">
                 <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Assistant
                </div>
                <div className="bg-secondary text-secondary-foreground px-3 py-2 rounded-2xl">
                  <div className="flex items-center gap-2.5 px-1 py-0.5">
                      <div className="w-3.5 h-3.5 border-2 border-foreground/30 border-t-foreground/80 rounded-full animate-spin" />
                      <span className="text-sm font-medium text-muted-foreground animate-pulse">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Box at Bottom */}
        <div className="p-6 bg-background">
          <div className="w-full max-w-3xl mx-auto">
            <div className="relative bg-background border border-input rounded-xl shadow-sm focus-within:ring-1 focus-within:ring-ring focus-within:border-ring transition-all">
              {attachments.length > 0 && (
                <div className="flex gap-3 p-3 flex-wrap border-b border-border">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={`data:${att.type};base64,${att.data}`}
                        alt={att.name}
                        className="w-14 h-14 rounded-md object-cover border border-border"
                      />
                      {removeAttachment && (
                          <button
                            onClick={() => removeAttachment(idx)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  adjustHeight();
                }}
                onKeyDown={onKeyDown}
                placeholder="Message iSuite Assistant..."
                className={cn(
                  "w-full px-4 py-4 resize-none border-none shadow-none",
                  "bg-transparent text-foreground text-base",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                  "placeholder:text-muted-foreground min-h-[56px]"
                )}
                style={{ overflow: "hidden" }}
              />

              {/* Footer Buttons */}
              <div className="flex items-center justify-between p-2 pl-4">
                <div className="flex items-center gap-2">
                   <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-full h-8 w-8"
                      onClick={() => setIsAttachOpen(!isAttachOpen)}
                   >
                      <Paperclip className="w-4 h-4" />
                   </Button>
                   <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileAttach(file);
                      e.target.value = "";
                    }}
                  />
                  <input
                    type="file"
                    ref={imageInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileAttach(file);
                      e.target.value = "";
                    }}
                  />
                </div>

                {/* Attachment Dropdown Menu */}
                {isAttachOpen && (
                  <div
                    ref={menuRef}
                    className="absolute bottom-14 left-4 w-48 bg-popover border border-border rounded-lg shadow-lg overflow-hidden p-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
                  >
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        setIsAttachOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors text-left"
                    >
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                      <span>Upload files</span>
                    </button>
                    <button
                      onClick={() => {
                        imageInputRef.current?.click();
                        setIsAttachOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors text-left"
                    >
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      <span>Photos</span>
                    </button>
                    <div className="h-px bg-border my-1" />
                    <button
                      onClick={() => {
                        router.push("/integrations");
                        setIsAttachOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors text-left"
                    >
                      <Layers className="w-4 h-4 text-muted-foreground" />
                      <span>Explore Apps</span>
                    </button>
                  </div>
                )}


                <Button
                  onClick={handleSend}
                  disabled={
                    isLoading || (!input.trim() && attachments.length === 0)
                  }
                  className={cn(
                    "h-8 w-8 rounded-full p-0 flex items-center justify-center transition-all",
                    isLoading || (!input.trim() && attachments.length === 0)
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary text-primary-foreground hover:opacity-90"
                  )}
                >
                  {isLoading ? (
                    <span className="w-3 h-3 border-2 border-background/50 border-t-background rounded-full animate-spin" />
                  ) : (
                    <ArrowUpIcon className="w-4 h-4" />
                  )}
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </div>
            
            <div className="text-center mt-3">
               <span className="text-xs text-muted-foreground">
                  AI can make mistakes. Please verify important information.
               </span>
            </div>
          </div>
        </div>
        
        {/* Image Preview Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-all active:scale-95"
              >
                <X size={28} />
              </button>
              <img 
                src={selectedImage} 
                alt="Full preview" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()} 
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render empty state (welcome screen) - centered vertically
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-background font-sans p-4">
      
      {/* Centered Content */}
      <div className="flex flex-col items-center justify-center w-full max-w-2xl space-y-8">
        {/* Brand Logo and Name */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-foreground text-background rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="6" height="16" rx="1.5" fill="currentColor" />
              <rect x="14" y="11" width="6" height="9" rx="1.5" fill="currentColor" fillOpacity="0.85" />
              <circle cx="17" cy="6" r="2.5" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-5xl font-serif font-medium text-foreground tracking-tight">
            iSuite
          </h1>
        </div>

        {/* Input Box */}
        <div className="w-full animate-in slide-in-from-bottom-5 fade-in duration-500">
          <div className="relative bg-background border border-input rounded-2xl shadow-lg shadow-black/5 focus-within:shadow-xl focus-within:border-ring transition-all duration-300">
            {attachments.length > 0 && (
              <div className="flex gap-3 p-3 flex-wrap border-b border-border">
                {attachments.map((att, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={`data:${att.type};base64,${att.data}`}
                      alt={att.name}
                      className="w-14 h-14 rounded-md object-cover border border-border"
                    />
                    {removeAttachment && (
                      <button
                        onClick={() => removeAttachment(idx)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                adjustHeight();
              }}
              onKeyDown={onKeyDown}
              placeholder="Ask anything..."
              className={cn(
                "w-full px-5 py-4 resize-none border-none shadow-none",
                "bg-transparent text-foreground text-lg",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "placeholder:text-muted-foreground/60 min-h-[60px]"
              )}
              style={{ overflow: "hidden" }}
            />

            <div className="flex items-center justify-between p-3 pl-5">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-full h-9 w-9"
                  onClick={() => setIsAttachOpen(!isAttachOpen)}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileAttach(file);
                    e.target.value = "";
                  }}
                />
                <input
                  type="file"
                  ref={imageInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileAttach(file);
                    e.target.value = "";
                  }}
                />
              </div>
             
              {/* Attachment Dropdown Menu */}
              {isAttachOpen && (
                <div
                  ref={menuRef}
                  className="absolute bottom-16 left-5 w-48 bg-popover border border-border rounded-lg shadow-xl overflow-hidden p-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
                >
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setIsAttachOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors text-left"
                  >
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                    <span>Upload files</span>
                  </button>
                  <button
                    onClick={() => {
                      imageInputRef.current?.click();
                      setIsAttachOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors text-left"
                  >
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    <span>Photos</span>
                  </button>
                  <div className="h-px bg-border my-1" />
                  <button
                    onClick={() => {
                      router.push("/integrations");
                      setIsAttachOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors text-left"
                  >
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    <span>Explore Apps</span>
                  </button>
                </div>
              )}

              <Button
                onClick={handleSend}
                disabled={
                  isLoading || (!input.trim() && attachments.length === 0)
                }
                className={cn(
                  "h-9 w-9 rounded-full p-0 flex items-center justify-center transition-all",
                  isLoading || (!input.trim() && attachments.length === 0)
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground hover:opacity-90 shadow-md"
                )}
              >
                {isLoading ? (
                  <span className="w-3 h-3 border-2 border-background/50 border-t-background rounded-full animate-spin" />
                ) : (
                  <ArrowUpIcon className="w-4 h-4" />
                )}
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-center flex-wrap gap-2 mt-6">
            <QuickAction
              icon={<Code2 className="w-3.5 h-3.5" />}
              label="Build an app"
              prompt="Create a full web app for a food-based restaurant with a menu, ordering system, and contact page. Include HTML, CSS, and JavaScript."
              onSelect={(p) => { setInput(p); textareaRef.current?.focus(); }}
            />
            <QuickAction
              icon={<Palette className="w-3.5 h-3.5" />}
              label="Design a UI"
              prompt="Design a modern, clean landing page UI for a SaaS productivity tool. Describe the layout, color scheme, typography, and key sections."
              onSelect={(p) => { setInput(p); textareaRef.current?.focus(); }}
            />
            <QuickAction
              icon={<BookOpen className="w-3.5 h-3.5" />}
              label="Plan a project"
              prompt="Create a detailed project plan for launching a mobile app in 3 months. Include milestones, tasks, team roles, and a timeline."
              onSelect={(p) => { setInput(p); textareaRef.current?.focus(); }}
            />
            <QuickAction
              icon={<BarChart2 className="w-3.5 h-3.5" />}
              label="Analyze data"
              prompt="Analyze the following sales data and give me key insights, trends, and recommendations: [paste your data here]"
              onSelect={(p) => { setInput(p); textareaRef.current?.focus(); }}
            />
            <QuickAction
              icon={<Pencil className="w-3.5 h-3.5" />}
              label="Write content"
              prompt="Write a professional blog post about the benefits of AI in modern businesses. Make it engaging, SEO-friendly, and around 800 words."
              onSelect={(p) => { setInput(p); textareaRef.current?.focus(); }}
            />
            <QuickAction
              icon={<Zap className="w-3.5 h-3.5" />}
              label="Connect an app"
              prompt="Help me connect my Gmail and Slack so that every important email I receive automatically sends a notification to my Slack channel."
              onSelect={(p) => { setInput(p); textareaRef.current?.focus(); }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  prompt: string;
  onSelect: (prompt: string) => void;
}

function QuickAction({ icon, label, prompt, onSelect }: QuickActionProps) {
  return (
    <Button
      variant="outline"
      onClick={() => onSelect(prompt)}
      className="flex items-center gap-2 rounded-full border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground hover:bg-secondary h-8 px-4 text-xs font-medium transition-all cursor-pointer"
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
}
