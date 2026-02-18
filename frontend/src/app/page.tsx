"use client";

import { Suspense, useState } from "react";
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

// Attachment type for image uploads
type Attachment = {
  name: string;
  type: string;
  data: string; // base64 encoded
};

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { licenseKey } = useLicenseAuth();
  
  const chatIdParam = searchParams.get("chatId");
  const selectedConversationId = chatIdParam ? (chatIdParam as Id<"conversations">) : null;

  const { messages, sendMessage, isLoading, isHistoryLoading, stopQuery } = useChat(selectedConversationId);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const convexUser = useQuery(api.users.getMe, licenseKey ? { licenseKey } : "skip");
  const settings = useQuery(api.users.getSettings, convexUser ? { userId: convexUser._id } : "skip");
  const conversations = useQuery(api.conversations.list, licenseKey ? { licenseKey } : "skip") || [];

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
      router.push(`/?chatId=${newChatId}`);
    }
    
    setInput("");
    setAttachments([]);
  };

  const startNewChat = () => {
    router.push("/");
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

