import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});

// List conversations for a user (by license key)
export const list = query({
  args: { licenseKey: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const key = args.licenseKey;
    if (!key) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", key))
      .unique();

    if (!user) return [];

    return await ctx.db
      .query("conversations")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// Create a new conversation
export const create = mutation({
  args: {
    title: v.string(),
    licenseKey: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.licenseKey))
      .unique();

    if (!user) throw new Error("User not found. Please activate your license.");

    return await ctx.db.insert("conversations", {
      userId: user._id,
      title: args.title,
      lastMessageAt: Date.now(),
    });
  },
});

export const updateTitle = mutation({
  args: { conversationId: v.id("conversations"), title: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, { title: args.title });
  },
});

export const remove = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    // First, delete all messages in this conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Then delete the conversation itself
    await ctx.db.delete(args.conversationId);
  },
});
