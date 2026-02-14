"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
} from "lucide-react";

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

interface RuixenMoonChatProps {
  input: string;
  setInput: (value: string) => void;
  handleSend: () => void;
  isLoading: boolean;
  handleFileAttach: (file: File) => void;
  attachments?: { name: string; type: string; data: string }[];
  removeAttachment?: (index: number) => void;
}

export default function RuixenMoonChat({
  input,
  setInput,
  handleSend,
  isLoading,
  handleFileAttach,
  attachments = [],
  removeAttachment
}: RuixenMoonChatProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 150,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
                e.target.value = ''; // Reset input
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
                e.target.value = ''; // Reset input
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
                disabled={isLoading || (!input.trim() && attachments.length === 0)}
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
