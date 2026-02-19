import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();
  },
});

export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    images: v.optional(v.array(v.string())),
    status: v.optional(v.union(v.literal("streaming"), v.literal("complete"), v.literal("error"))),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      images: args.images,
      status: args.status ?? "complete",
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.conversationId, {
      lastMessageAt: Date.now(),
    });

    return messageId;
  },
});

// Update the content of a message (used during streaming to persist partial content)
export const updateContent = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      content: args.content,
    });
  },
});

// Update the status of a message (streaming -> complete/error)
export const updateStatus = mutation({
  args: {
    messageId: v.id("messages"),
    status: v.union(v.literal("streaming"), v.literal("complete"), v.literal("error")),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = { status: args.status };
    if (args.content !== undefined) {
      patch.content = args.content;
    }
    await ctx.db.patch(args.messageId, patch);
  },
});
