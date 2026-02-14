"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { marked } from "marked";
import {
  ImageIcon,
  FileUp,
  MonitorIcon,
  CircleUserRound,
  ArrowUpIcon,
  Paperclip,
  PlusIcon,
  Code2,
  Palette,
  Layers,
  Rocket,
  Grid2X2,
  Menu,
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
}: RuixenMoonChatProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 150,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render messages view when there are messages
  if (messages.length > 0) {
    return (
      <div
        className="relative w-full h-full bg-cover bg-center flex flex-col z-0"
        style={{
          backgroundImage:
            "url('https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/ruixen_moon_2.png')",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Dark Overlay for readability */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none z-0" />

        {/* Header */}
        <header
          className="relative z-10 flex items-center justify-between px-6 py-4"
          style={{
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="flex items-center gap-3">
            {!isSidebarOpen && onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                <Menu size={20} />
              </button>
            )}
            <h2 className="text-base font-semibold text-white">
              {conversationTitle || "Current Chat"}
            </h2>
          </div>
          {onNewChat && (
            <button
              onClick={onNewChat}
              className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              title="New Chat"
            >
              <PlusIcon size={20} />
            </button>
          )}
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto relative z-10 px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-800/80 backdrop-blur-sm text-white border border-white/10"
                  )}
                  dangerouslySetInnerHTML={{
                    __html:
                      msg.role === "assistant"
                        ? parseMarkdownWithExternalLinks(msg.content)
                        : msg.content,
                  }}
                />
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-neutral-800/80 backdrop-blur-sm border border-white/10 p-3 rounded-2xl">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Box at Bottom */}
        <div className="relative z-10 px-4 pb-6 flex justify-center">
          <div className="w-full max-w-3xl">
            <div className="relative bg-black/60 backdrop-blur-md rounded-xl border border-neutral-700">
              {attachments.length > 0 && (
                <div className="flex gap-2 p-3 flex-wrap border-b border-neutral-700/50">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={`data:${att.type};base64,${att.data}`}
                        alt={att.name}
                        className="w-16 h-16 rounded object-cover border border-neutral-600"
                      />
                      {removeAttachment && (
                        <button
                          onClick={() => removeAttachment(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
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
                placeholder="Reply to iSuite Assistant..."
                className={cn(
                  "w-full px-4 py-3 resize-none border-none",
                  "bg-transparent text-white text-sm",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                  "placeholder:text-neutral-400 min-h-[48px]"
                )}
                style={{ overflow: "hidden" }}
              />

              {/* Footer Buttons */}
              <div className="flex items-center justify-between p-3 relative">
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

                {/* Attachment Dropdown Menu */}
                {isAttachOpen && (
                  <div
                    ref={menuRef}
                    className="absolute bottom-14 left-3 w-48 bg-[#1E1E1E] border border-neutral-800 rounded-xl shadow-lg overflow-hidden p-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
                  >
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        setIsAttachOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors text-left"
                    >
                      <Paperclip className="w-4 h-4 text-neutral-400" />
                      <span>Upload files</span>
                    </button>
                    <button
                      onClick={() => {
                        imageInputRef.current?.click();
                        setIsAttachOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors text-left"
                    >
                      <ImageIcon className="w-4 h-4 text-neutral-400" />
                      <span>Photos</span>
                    </button>
                    <div className="h-px bg-neutral-800 my-1" />
                    <button
                      onClick={() => {
                        router.push("/integrations");
                        setIsAttachOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors text-left"
                    >
                      <Grid2X2 className="w-4 h-4 text-neutral-400" />
                      <span>Explore Apps</span>
                    </button>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "text-white rounded-full hover:bg-neutral-700/60 hover:text-white transition-colors",
                    isAttachOpen && "bg-neutral-700/60"
                  )}
                  onClick={() => setIsAttachOpen(!isAttachOpen)}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSend}
                    disabled={
                      isLoading || (!input.trim() && attachments.length === 0)
                    }
                    className={cn(
                      "flex items-center justify-center w-9 h-9 rounded-full transition-colors",
                      isLoading || (!input.trim() && attachments.length === 0)
                        ? "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                        : "bg-white text-black hover:bg-neutral-200"
                    )}
                  >
                    {isLoading ? (
                      <span className="w-4 h-4 border-2 border-neutral-400 border-t-neutral-800 rounded-full animate-spin" />
                    ) : (
                      <ArrowUpIcon className="w-4 h-4" />
                    )}
                    <span className="sr-only">Send</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render empty state (welcome screen)
  return (
    <div
      className="relative w-full h-full bg-cover bg-center flex flex-col items-center"
      style={{
        backgroundImage:
          "url('https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/ruixen_moon_2.png')",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Centered AI Title */}
      <div className="flex-1 w-full flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-semibold text-white drop-shadow-sm">
            Isuite Assistant
          </h1>
          <p className="mt-2 text-neutral-200">
            Build something amazing — just start typing below.
          </p>
        </div>
      </div>

      {/* Input Box Section */}
      <div className="w-full max-w-3xl mb-[20vh] px-4">
        <div className="relative bg-black/60 backdrop-blur-md rounded-xl border border-neutral-700">
          {attachments.length > 0 && (
            <div className="flex gap-2 p-3 flex-wrap border-b border-neutral-700/50">
              {attachments.map((att, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={`data:${att.type};base64,${att.data}`}
                    alt={att.name}
                    className="w-16 h-16 rounded object-cover border border-neutral-600"
                  />
                  {removeAttachment && (
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
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
            placeholder="Type your request..."
            className={cn(
              "w-full px-4 py-3 resize-none border-none",
              "bg-transparent text-white text-sm",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "placeholder:text-neutral-400 min-h-[48px]"
            )}
            style={{ overflow: "hidden" }}
          />

          {/* Footer Buttons */}
          <div className="flex items-center justify-between p-3 relative">
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

            {/* Attachment Dropdown Menu */}
            {isAttachOpen && (
              <div
                ref={menuRef}
                className="absolute bottom-14 left-3 w-48 bg-[#1E1E1E] border border-neutral-800 rounded-xl shadow-lg overflow-hidden p-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
              >
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setIsAttachOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors text-left"
                >
                  <Paperclip className="w-4 h-4 text-neutral-400" />
                  <span>Upload files</span>
                </button>
                <button
                  onClick={() => {
                    imageInputRef.current?.click();
                    setIsAttachOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors text-left"
                >
                  <ImageIcon className="w-4 h-4 text-neutral-400" />
                  <span>Photos</span>
                </button>
                <div className="h-px bg-neutral-800 my-1" />
                <button
                  onClick={() => {
                    router.push("/integrations");
                    setIsAttachOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors text-left"
                >
                  <Grid2X2 className="w-4 h-4 text-neutral-400" />
                  <span>Explore Apps</span>
                </button>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "text-white rounded-full hover:bg-neutral-700/60 hover:text-white transition-colors",
                isAttachOpen && "bg-neutral-700/60"
              )}
              onClick={() => setIsAttachOpen(!isAttachOpen)}
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleSend}
                disabled={
                  isLoading || (!input.trim() && attachments.length === 0)
                }
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-full transition-colors",
                  isLoading || (!input.trim() && attachments.length === 0)
                    ? "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                    : "bg-white text-black hover:bg-neutral-200"
                )}
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-neutral-400 border-t-neutral-800 rounded-full animate-spin" />
                ) : (
                  <ArrowUpIcon className="w-4 h-4" />
                )}
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-center flex-wrap gap-3 mt-6">
          <QuickAction icon={<Code2 className="w-4 h-4" />} label="Generate Code" />
          <QuickAction icon={<Rocket className="w-4 h-4" />} label="Launch App" />
          <QuickAction icon={<Layers className="w-4 h-4" />} label="UI Components" />
          <QuickAction icon={<Palette className="w-4 h-4" />} label="Theme Ideas" />
          <QuickAction icon={<CircleUserRound className="w-4 h-4" />} label="User Dashboard" />
          <QuickAction icon={<MonitorIcon className="w-4 h-4" />} label="Landing Page" />
          <QuickAction icon={<FileUp className="w-4 h-4" />} label="Upload Docs" />
          <QuickAction icon={<ImageIcon className="w-4 h-4" />} label="Image Assets" />
        </div>
      </div>
    </div>
  );
}

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
}

function QuickAction({ icon, label }: QuickActionProps) {
  return (
    <Button
      variant="outline"
      className="flex items-center gap-2 rounded-full border-neutral-700 bg-black/50 text-neutral-300 hover:text-white hover:bg-neutral-700"
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Button>
  );
}
