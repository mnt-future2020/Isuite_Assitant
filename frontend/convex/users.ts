import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const storeUser = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.string(),
    image: v.optional(v.string()),
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();

    if (user !== null) {
      if (user.name !== args.name || user.image !== args.image) {
        await ctx.db.patch(user._id, { name: args.name, image: args.image });
      }
      return user._id;
    }

    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      image: args.image,
      tokenIdentifier: args.tokenIdentifier,
    });
  },
});

// Get user by license key (for desktop app)
export const getMe = query({
  args: { licenseKey: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const key = args.licenseKey;
    if (!key) {
      return null;
    }
    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", key))
      .unique();
  },
});

export const getSettings = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("settings")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

export const updateSettings = mutation({
  args: {
    userId: v.id("users"),
    theme: v.string(),
    preferredModel: v.string(),
    notificationsEnabled: v.boolean(),
    anthropicApiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        theme: args.theme,
        preferredModel: args.preferredModel,
        notificationsEnabled: args.notificationsEnabled,
        anthropicApiKey: args.anthropicApiKey,
      });
    } else {
      await ctx.db.insert("settings", {
        userId: args.userId,
        theme: args.theme,
        preferredModel: args.preferredModel,
        notificationsEnabled: args.notificationsEnabled,
        anthropicApiKey: args.anthropicApiKey,
      });
    }
  },
});
