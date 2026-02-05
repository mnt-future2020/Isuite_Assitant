import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Validate a license key
export const validate = query({
  args: { licenseKey: v.string() },
  handler: async (ctx, args) => {
    const license = await ctx.db
      .query("licenses")
      .withIndex("by_key", (q) => q.eq("licenseKey", args.licenseKey))
      .unique();

    if (!license) {
      return { valid: false, error: "Invalid license key" };
    }

    if (!license.isActive) {
      return { valid: false, error: "License has been deactivated" };
    }

    if (license.expiresAt && license.expiresAt < Date.now()) {
      return { valid: false, error: "License has expired" };
    }

    return {
      valid: true,
      email: license.email,
      plan: license.plan,
      expiresAt: license.expiresAt,
    };
  },
});

// Activate license and create/update user
export const activate = mutation({
  args: {
    licenseKey: v.string(),
    machineId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const license = await ctx.db
      .query("licenses")
      .withIndex("by_key", (q) => q.eq("licenseKey", args.licenseKey))
      .unique();

    if (!license) {
      return { success: false, error: "Invalid license key" };
    }

    if (!license.isActive) {
      return { success: false, error: "License has been deactivated" };
    }

    if (license.expiresAt && license.expiresAt < Date.now()) {
      return { success: false, error: "License has expired" };
    }

    // Optional: Check machine ID for single-device licensing
    if (license.machineId && args.machineId && license.machineId !== args.machineId) {
      return { success: false, error: "License is already activated on another device" };
    }

    // Update machine ID if provided
    if (args.machineId && !license.machineId) {
      await ctx.db.patch(license._id, { machineId: args.machineId });
    }

    // Check if user exists with this license key
    let user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.licenseKey))
      .unique();

    if (!user) {
      // Create new user
      const userId = await ctx.db.insert("users", {
        email: license.email,
        tokenIdentifier: args.licenseKey,
      });
      user = await ctx.db.get(userId);
    }

    return {
      success: true,
      user: {
        id: user!._id,
        email: user!.email,
        name: user!.name,
      },
      plan: license.plan,
      expiresAt: license.expiresAt,
    };
  },
});

// Get user by license key (for desktop app)
export const getUserByLicense = query({
  args: { licenseKey: v.string() },
  handler: async (ctx, args) => {
    // First validate the license
    const license = await ctx.db
      .query("licenses")
      .withIndex("by_key", (q) => q.eq("licenseKey", args.licenseKey))
      .unique();

    if (!license || !license.isActive) {
      return null;
    }

    if (license.expiresAt && license.expiresAt < Date.now()) {
      return null;
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.licenseKey))
      .unique();

    if (!user) {
      return null;
    }

    return {
      ...user,
      plan: license.plan,
      expiresAt: license.expiresAt,
    };
  },
});

// Admin: Create a new license key
export const createLicense = mutation({
  args: {
    email: v.string(),
    plan: v.string(),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Generate unique license key (XXXX-XXXX-XXXX-XXXX format)
    const generateKey = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      return `${segment()}-${segment()}-${segment()}-${segment()}`;
    };

    const licenseKey = generateKey();

    await ctx.db.insert("licenses", {
      licenseKey,
      email: args.email,
      plan: args.plan,
      isActive: true,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
    });

    return { licenseKey };
  },
});

// Admin: Deactivate a license
export const deactivateLicense = mutation({
  args: { licenseKey: v.string() },
  handler: async (ctx, args) => {
    const license = await ctx.db
      .query("licenses")
      .withIndex("by_key", (q) => q.eq("licenseKey", args.licenseKey))
      .unique();

    if (!license) {
      return { success: false, error: "License not found" };
    }

    await ctx.db.patch(license._id, { isActive: false });
    return { success: true };
  },
});
