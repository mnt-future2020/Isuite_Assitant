import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useLicenseAuth } from "@/app/ConvexClientProvider";

export type Message = {
  role: "user" | "assistant";
  content: string;
  id: string;
  images?: string[];
  toolCalls?: Array<{
    name: string;
    input: Record<string, unknown>;
    id: string;
  }>;
};

// Attachment type for image uploads
export type Attachment = {
  name: string;
  type: string;
  data: string; // base64 encoded
};

// Get API URL from environment
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function useChat(conversationId: Id<"conversations"> | null) {
  const { user, licenseKey } = useLicenseAuth();
  const convexMessages = useQuery(
    api.messages.list,
    conversationId ? { conversationId } : "skip",
  );
  const sendMessageMutation = useMutation(api.messages.send);
  const createConversation = useMutation(api.conversations.create);
  const updateTitle = useMutation(api.conversations.updateTitle);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] =
    useState<Id<"conversations"> | null>(conversationId);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isGeneratingTitleRef = useRef(false);

  // Sync with Convex messages when conversationId changes
  useEffect(() => {
    if (isLoading || isGeneratingTitleRef.current) return; // Don't sync while streaming or generating title
    
    if (convexMessages) {
      setMessages(
        convexMessages.map((m) => ({
          role: m.role,
          content: m.content,
          id: m._id,
          images: m.images,
        })),
      );
    } else if (!conversationId) {
      setMessages([]);
    }
    setActiveConversationId(conversationId);
  }, [convexMessages, conversationId, isLoading]);

  // Generate AI title in background (fire and forget)
  const generateAITitle = useCallback(
    async (message: string, conversationId: Id<"conversations">) => {
      isGeneratingTitleRef.current = true;
      try {
        const response = await fetch(`${API_URL}/api/generate-title`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });

        if (response.ok) {
          const { title } = await response.json();
          if (title) {
            await updateTitle({ conversationId, title });
          }
        }
      } catch {
        // Silently fail - title will remain "New Chat"
      } finally {
        // Small delay to ensure title update completes before allowing sync
        setTimeout(() => {
          isGeneratingTitleRef.current = false;
        }, 100);
      }
    },
    [updateTitle],
  );

  const sendMessage = useCallback(
    async (
      content: string,
      provider = "claude",
      model: string | null = null,
      attachments: Attachment[] = [],
    ) => {
      if ((!content.trim() && attachments.length === 0) || !user) return;

      setIsLoading(true);
      let chatId = activeConversationId;
      let uploadedImages = [];

      // 1. Upload images first if any
      if (attachments.length > 0) {
        try {
          // Prepare payload needs only name and data
          const uploadPayload = attachments.map(att => ({
            name: att.name,
            type: att.type,
            data: att.data
          }));

          const uploadRes = await fetch(`${API_URL}/api/upload`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ images: uploadPayload }),
          });

          if (uploadRes.ok) {
            const data = await uploadRes.json();
            if (data.success) {
              uploadedImages = data.uploadedImages; // Contains path, url, originalName
            }
          } else {
             console.error("Failed to upload images");
          }
        } catch (err) {
          console.error("Image upload error:", err);
        }
      }

      // 2. Create conversation if it doesn't exist
      const isNewConversation = !chatId;
      if (!chatId && licenseKey) {
        chatId = await createConversation({ title: "New Chat", licenseKey });
        setActiveConversationId(chatId);
      }

      // 3. Add user message to UI immediately for feedback
      const userMsgId = `temp_user_${Date.now()}`;
      // Show images in the UI using base64 data
      const imageDataUrls = attachments.map(att => `data:${att.type};base64,${att.data}`);
      const userMessage: Message = { 
        role: "user", 
        content, 
        id: userMsgId,
        images: imageDataUrls.length > 0 ? imageDataUrls : undefined
      };
      setMessages((prev) => [...prev, userMessage]);

      // 4. Prepare assistant placeholder
      const assistantMsgId = `temp_assistant_${Date.now()}`;
      const assistantMessage: Message = {
        role: "assistant",
        content: "",
        id: assistantMsgId,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        abortControllerRef.current = new AbortController();
        const response = await fetch(`${API_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            images: uploadedImages, // Send uploaded image objects (with paths) instead of base64
            chatId,
            userId: licenseKey,
            provider,
            model,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) throw new Error("Failed to connect to backend");

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullAssistantContent = "";

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === "text") {
                  fullAssistantContent += data.content;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId
                        ? { ...msg, content: fullAssistantContent }
                        : msg,
                    ),
                  );
                }
              } catch {}
            }
          }
        }

        // 5. Persistence: Save to Convex with image metadata
        if (chatId) {
          // Store just the URLs or paths in Convex
          const imageUrls = uploadedImages.map((img: { url: string }) => img.url);

          await sendMessageMutation({
            conversationId: chatId,
            role: "user",
            content,
            images: imageUrls.length > 0 ? imageUrls : undefined,
          });
          
          await sendMessageMutation({
            conversationId: chatId,
            role: "assistant",
            content: fullAssistantContent,
          });
        }

        // 6. Generate AI title for new conversations
        if (isNewConversation && chatId) {
          generateAITitle(content, chatId);
        }
      } catch (error) {
        console.error("Chat error:", error);
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
      return chatId;
    },
    [activeConversationId, user, licenseKey, createConversation, sendMessageMutation, generateAITitle],
  );

  const stopQuery = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  }, []);

  const isHistoryLoading = convexMessages === undefined && !!conversationId;

  return {
    messages,
    sendMessage,
    isLoading,
    isHistoryLoading,
    stopQuery,
    activeConversationId,
  };
}
