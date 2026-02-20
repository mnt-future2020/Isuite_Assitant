"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { useQuery } from "convex/react";
import {
  useLicenseAuth,
} from "./ConvexClientProvider";
import RuixenMoonChat from "@/components/ruixen-moon-chat";
import AppSidebar from "@/components/AppSidebar";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useToast } from "@/hooks/use-toast";

// Attachment type for image uploads
type Attachment = {
  name: string;
  type: string;
  data: string; // base64 encoded
};

// File size limits (in bytes) - Conservative limits to protect user's API tokens
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file (reduced from 25MB)
const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20MB total per message (reduced from 50MB)
const MAX_FILES = 3; // Maximum 3 files per message (reduced from 10)

// Format bytes to human-readable size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { licenseKey } = useLicenseAuth();
  const { toast } = useToast();
  
  const chatIdParam = searchParams.get("chatId");
  const selectedConversationId = chatIdParam ? (chatIdParam as Id<"conversations">) : null;

  const { messages, sendMessage, isLoading, isHistoryLoading, stopQuery } = useChat(selectedConversationId);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Show toast when upload error changes
  useEffect(() => {
    if (uploadError) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: uploadError,
        duration: 5000,
      });
    }
  }, [uploadError, toast]);

  const convexUser = useQuery(api.users.getMe, licenseKey ? { licenseKey } : "skip");
  const settings = useQuery(api.users.getSettings, convexUser ? { userId: convexUser._id } : "skip");
  const conversations = useQuery(api.conversations.list, licenseKey ? { licenseKey } : "skip") || [];

  const handleSend = async () => {
    if (isLoading) {
      stopQuery();
      return;
    }
    if (!input.trim() && attachments.length === 0) return;
    
    // Capture current values before clearing
    const currentInput = input;
    const currentAttachments = [...attachments];

    // Clear input and attachments IMMEDIATELY (like ChatGPT)
    setInput("");
    setAttachments([]);

    // Pass preferred model from settings
    const preferredModel = settings?.preferredModel || "claude-3-5-sonnet-latest";
    const newChatId = await sendMessage(currentInput, "claude", preferredModel, currentAttachments);
    
    if (newChatId && !selectedConversationId) {
      router.push(`/?chatId=${newChatId}`);
    }
  };

  const startNewChat = () => {
    router.push("/");
  };

  // Handle file attachment - read as base64 for all files with size validation
  const handleFileAttach = (file: File) => {
    // Clear previous errors
    setUploadError(null);

    // Check file count limit
    if (attachments.length >= MAX_FILES) {
      setUploadError(`Maximum ${MAX_FILES} files allowed per message`);
      return;
    }

    // Check individual file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File "${file.name}" is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`);
      return;
    }

    // Calculate current total size
    const currentTotalSize = attachments.reduce((total, att) => {
      // Base64 is ~33% larger than original, so decode size
      const decodedSize = (att.data.length * 3) / 4;
      return total + decodedSize;
    }, 0);

    // Check total size limit
    if (currentTotalSize + file.size > MAX_TOTAL_SIZE) {
      setUploadError(
        `Total attachments size would exceed ${formatFileSize(MAX_TOTAL_SIZE)}. ` +
        `Current: ${formatFileSize(currentTotalSize)}, Adding: ${formatFileSize(file.size)}`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      
      // Use functional update to check current state
      setAttachments(prev => {
        // Double-check limit with current state
        if (prev.length >= MAX_FILES) {
          setUploadError(`Maximum ${MAX_FILES} files allowed per message`);
          return prev; // Don't add the file
        }
        
        return [...prev, {
          name: file.name,
          type: file.type || 'application/octet-stream',
          data: base64
        }];
      });
    };
    reader.onerror = () => {
      setUploadError(`Failed to read file "${file.name}"`);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />

      {/* Main Content */}
      <main className="relative flex flex-col flex-1 w-full h-full overflow-hidden transition-all duration-300 ease-in-out bg-background">
        <RuixenMoonChat 
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          isLoading={isLoading}
          isHistoryLoading={isHistoryLoading}
          handleFileAttach={handleFileAttach}
          attachments={attachments}
          removeAttachment={(index) => setAttachments(prev => prev.filter((_, i) => i !== index))}
          messages={messages || []}
          conversationTitle={conversations.find(c => c._id === selectedConversationId)?.title}
          onNewChat={startNewChat}
          uploadError={uploadError}
          onClearUploadError={() => setUploadError(null)}
        />
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex h-screen bg-background" />}>
      <HomeContent />
    </Suspense>
  );
}

