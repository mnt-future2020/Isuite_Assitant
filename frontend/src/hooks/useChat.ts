import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useLicenseAuth } from "@/app/ConvexClientProvider";

export type Message = {
  role: "user" | "assistant";
  content: string;
  id: string;
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

  // Sync with Convex messages when conversationId changes
  useEffect(() => {
    if (isLoading) return; // Don't sync while streaming (prevents double loader glitch)
    
    if (convexMessages) {
      setMessages(
        convexMessages.map((m) => ({
          role: m.role,
          content: m.content,
          id: m._id,
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

      // 1. Create conversation if it doesn't exist
      const isNewConversation = !chatId;
      if (!chatId && licenseKey) {
        chatId = await createConversation({ title: "New Chat", licenseKey });
        setActiveConversationId(chatId);
      }

      // 2. Add user message to UI immediately for feedback
      const userMsgId = `temp_user_${Date.now()}`;
      const userMessage: Message = { role: "user", content, id: userMsgId };
      setMessages((prev) => [...prev, userMessage]);

      // 3. Prepare assistant placeholder
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
            images: attachments, // Image attachments as base64
            chatId,
            userId: licenseKey, // License key as user identifier
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

        // 4. Persistence: Save both messages to Convex at the end
        if (chatId) {
          await sendMessageMutation({
            conversationId: chatId,
            role: "user",
            content,
          });
          await sendMessageMutation({
            conversationId: chatId,
            role: "assistant",
            content: fullAssistantContent,
          });
        }

        // 5. Generate AI title for new conversations (in background)
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

  return {
    messages,
    sendMessage,
    isLoading,
    stopQuery,
    activeConversationId,
  };
}
