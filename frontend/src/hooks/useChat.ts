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
  status?: "streaming" | "complete" | "error";
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
  const convexUser = useQuery(api.users.getMe, licenseKey ? { licenseKey } : "skip");
  const settings = useQuery(api.users.getSettings, convexUser ? { userId: convexUser._id } : "skip");
  const sendMessageMutation = useMutation(api.messages.send);
  const createConversation = useMutation(api.conversations.create);
  const updateTitle = useMutation(api.conversations.updateTitle);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] =
    useState<Id<"conversations"> | null>(conversationId);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isGeneratingTitleRef = useRef(false);
  // Track the streaming assistant message ID for live UI updates
  const streamingAssistantIdRef = useRef<string | null>(null);

  // Sync with Convex messages — this is the PRIMARY data source
  // Convex's useQuery is reactive, so when the server updates messages in Convex,
  // this effect fires and the UI updates automatically (like ChatGPT)
  useEffect(() => {
    if (isGeneratingTitleRef.current) return;

    if (convexMessages) {
      if (isLoading && streamingAssistantIdRef.current) {
        // While actively streaming via SSE, merge Convex data BUT keep the 
        // live SSE content for the streaming message (SSE is faster than Convex polling)
        setMessages((prev) => {
          const streamingMsg = prev.find(
            (m) => m.id === streamingAssistantIdRef.current
          );
          const convexMapped = convexMessages.map((m) => ({
            role: m.role,
            content: m.content,
            id: m._id,
            images: m.images,
            status: m.status as Message["status"],
          }));
          if (streamingMsg && streamingMsg.content.length > 0) {
            // Use our live SSE content if it's ahead of Convex
            return convexMapped.map((m) =>
              m.id === streamingAssistantIdRef.current &&
              streamingMsg.content.length > (m.content?.length || 0)
                ? { ...streamingMsg }
                : m
            );
          }
          return convexMapped;
        });
      } else {
        // Not streaming — fully sync from Convex (this handles refresh/load)
        setMessages(
          convexMessages.map((m) => ({
            role: m.role,
            content: m.content,
            id: m._id,
            images: m.images,
            status: m.status as Message["status"],
          })),
        );
      }
    } else if (!conversationId) {
      setMessages([]);
    }
    setActiveConversationId(conversationId);
  }, [convexMessages, conversationId, isLoading]);

  // Generate AI title in background (fire and forget)
  const generateAITitle = useCallback(
    async (message: string, conversationId: Id<"conversations">, apiKey?: string) => {
      isGeneratingTitleRef.current = true;
      try {
        const response = await fetch(`${API_URL}/api/generate-title`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, anthropicApiKey: apiKey }),
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
      let uploadedImages: Array<{ path: string; url: string; originalName: string }> = [];

      // 1. Upload images first if any
      if (attachments.length > 0) {
        try {
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
              uploadedImages = data.uploadedImages;
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

      // 3. Check if API key is available
      if (!settings?.anthropicApiKey) {
        const errorMsg: Message = {
          role: "assistant",
          content: "⚠️ Anthropic API key not found. Please add your API key in Settings to use the chat.",
          id: `error_${Date.now()}`,
          status: "error",
        };
        setMessages((prev) => [...prev, errorMsg]);
        setIsLoading(false);
        return chatId;
      }

      // 4. SAVE USER MESSAGE TO CONVEX IMMEDIATELY
      const imageUrls = uploadedImages.map((img) => img.url);
      const imageDataUrls = attachments.map(att => `data:${att.type};base64,${att.data}`);

      let userMsgId: Id<"messages"> | undefined;
      if (chatId) {
        userMsgId = await sendMessageMutation({
          conversationId: chatId,
          role: "user",
          content,
          images: imageUrls.length > 0 ? imageUrls : undefined,
          status: "complete",
        });
      }

      // Add user message to UI
      const userMessage: Message = {
        role: "user",
        content,
        id: userMsgId || `temp_user_${Date.now()}`,
        images: imageDataUrls.length > 0 ? imageDataUrls : undefined,
        status: "complete",
      };
      setMessages((prev) => [...prev, userMessage]);

      // 5. CREATE EMPTY ASSISTANT MESSAGE IN CONVEX (status: streaming)
      let assistantConvexId: Id<"messages"> | undefined;
      if (chatId) {
        assistantConvexId = await sendMessageMutation({
          conversationId: chatId,
          role: "assistant",
          content: "",
          status: "streaming",
        });
        streamingAssistantIdRef.current = assistantConvexId || null;
      }

      // Add assistant placeholder to UI
      const assistantMsgId = assistantConvexId || `temp_assistant_${Date.now()}`;
      const assistantMessage: Message = {
        role: "assistant",
        content: "",
        id: assistantMsgId,
        status: "streaming",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        abortControllerRef.current = new AbortController();
        
        // 6. START SSE STREAM — pass assistantMessageId so server can update Convex directly
        const response = await fetch(`${API_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            images: uploadedImages,
            chatId,
            userId: licenseKey,
            provider,
            model,
            anthropicApiKey: settings?.anthropicApiKey,
            assistantMessageId: assistantConvexId, // Server uses this to update Convex
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || "Failed to connect to backend");
        }

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
                  // Update UI immediately via SSE (faster than Convex polling)
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

        // Stream finished — update UI status
        // (Convex is already updated by the server, useQuery will sync)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: fullAssistantContent, status: "complete" }
              : msg,
          ),
        );

        // 7. Generate AI title for new conversations
        if (isNewConversation && chatId) {
          generateAITitle(content, chatId, settings?.anthropicApiKey);
        }
      } catch (error) {
        console.error("Chat error:", error);

        const isAborted = error instanceof DOMException && error.name === "AbortError";

        if (!isAborted) {
          // Show error message for real errors
          // Note: if user refreshed, the server continues generating and saves to Convex
          const errorMsg: Message = {
            role: "assistant",
            content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
            id: `error_${Date.now()}`,
            status: "error",
          };
          setMessages((prev) => [...prev, errorMsg]);
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
        streamingAssistantIdRef.current = null;
      }
      return chatId;
    },
    [activeConversationId, user, licenseKey, createConversation, sendMessageMutation, generateAITitle, settings],
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
