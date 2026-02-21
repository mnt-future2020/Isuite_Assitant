import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================================
// VALIDATION
// ============================================================

// Validate a license key (public query — used by landing page & app)
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

    const now = Date.now();
    if (license.expiresAt < now) {
      return { valid: false, error: "Your subscription has expired" };
    }

    const daysRemaining = Math.ceil((license.expiresAt - now) / (1000 * 60 * 60 * 24));

    return {
      valid: true,
      email: license.email,
      plan: license.plan,
      durationDays: license.durationDays,
      expiresAt: license.expiresAt,
      daysRemaining,
      hasActiveSession: !!license.activeSessionId,
    };
  },
});

// ============================================================
// ACTIVATION — with single active session enforcement
// ============================================================

export const activate = mutation({
  args: {
    licenseKey: v.string(),
    sessionId: v.string(), // Unique UUID generated per device/browser
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

    const now = Date.now();
    if (license.expiresAt < now) {
      return { success: false, error: "Your subscription has expired. Please renew to continue." };
    }

    // ---- Single Active Session Enforcement ----
    // If there is an existing active session AND it's not this same session → block
    if (license.activeSessionId && license.activeSessionId !== args.sessionId) {
      return {
        success: false,
        error: "This license key is currently active on another device. Please logout from the other device first.",
      };
    }

    // Lock this session as the active one & update last active time
    await ctx.db.patch(license._id, {
      activeSessionId: args.sessionId,
      lastActiveAt: now,
    });

    // ---- Find or create user ----
    let user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.licenseKey))
      .unique();

    if (!user) {
      const userId = await ctx.db.insert("users", {
        email: license.email,
        tokenIdentifier: args.licenseKey,
      });
      user = await ctx.db.get(userId);
    }

    const daysRemaining = Math.ceil((license.expiresAt - now) / (1000 * 60 * 60 * 24));

    return {
      success: true,
      user: {
        id: user!._id,
        email: user!.email,
        name: user!.name,
      },
      plan: license.plan,
      durationDays: license.durationDays,
      expiresAt: license.expiresAt,
      daysRemaining,
    };
  },
});

// ============================================================
// LOGOUT — clears active session so key can be used on another device
// ============================================================

export const logout = mutation({
  args: {
    licenseKey: v.string(),
    sessionId: v.string(), // Must match the active session
  },
  handler: async (ctx, args) => {
    const license = await ctx.db
      .query("licenses")
      .withIndex("by_key", (q) => q.eq("licenseKey", args.licenseKey))
      .unique();

    if (!license) {
      return { success: false, error: "License not found" };
    }

    // Only clear session if the requesting session matches (security)
    if (license.activeSessionId && license.activeSessionId !== args.sessionId) {
      return { success: false, error: "Session mismatch — cannot logout from a different device" };
    }

    // Clear the active session
    await ctx.db.patch(license._id, {
      activeSessionId: undefined,
    });

    return { success: true };
  },
});

// ============================================================
// HEARTBEAT — update last active timestamp (optional, for analytics)
// ============================================================

export const heartbeat = mutation({
  args: {
    licenseKey: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const license = await ctx.db
      .query("licenses")
      .withIndex("by_key", (q) => q.eq("licenseKey", args.licenseKey))
      .unique();

    if (!license || !license.isActive) return { success: false };
    if (license.activeSessionId !== args.sessionId) return { success: false };

    await ctx.db.patch(license._id, { lastActiveAt: Date.now() });
    return { success: true };
  },
});

// ============================================================
// GET USER BY LICENSE — for app reload / session restore
// ============================================================

export const getUserByLicense = query({
  args: {
    licenseKey: v.string(),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const license = await ctx.db
      .query("licenses")
      .withIndex("by_key", (q) => q.eq("licenseKey", args.licenseKey))
      .unique();

    if (!license || !license.isActive) {
      return null;
    }

    const now = Date.now();
    if (license.expiresAt < now) {
      return { expired: true, plan: license.plan, expiresAt: license.expiresAt };
    }

    // If there's a session check and it doesn't match → session hijacked or used elsewhere
    if (args.sessionId && license.activeSessionId && license.activeSessionId !== args.sessionId) {
      return { sessionConflict: true };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.licenseKey))
      .unique();

    if (!user) {
      return null;
    }

    const daysRemaining = Math.ceil((license.expiresAt - now) / (1000 * 60 * 60 * 24));

    return {
      ...user,
      plan: license.plan,
      durationDays: license.durationDays,
      expiresAt: license.expiresAt,
      daysRemaining,
    };
  },
});

// ============================================================
// ADMIN: Create a new license key (called by payment webhook)
// ============================================================

export const createLicense = mutation({
  args: {
    email: v.string(),
    plan: v.string(),                     // "20days", "30days", "90days", "365days"
    durationDays: v.number(),             // 20, 30, 90, 365
    paymentId: v.optional(v.string()),    // Razorpay payment ID
  },
  handler: async (ctx, args) => {
    // Generate unique license key (XXXX-XXXX-XXXX-XXXX format)
    const generateKey = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const segment = () =>
        Array.from(
          { length: 4 },
          () => chars[Math.floor(Math.random() * chars.length)]
        ).join("");
      return `${segment()}-${segment()}-${segment()}-${segment()}`;
    };

    // Ensure uniqueness
    let licenseKey = generateKey();
    let exists = await ctx.db
      .query("licenses")
      .withIndex("by_key", (q) => q.eq("licenseKey", licenseKey))
      .unique();
    while (exists) {
      licenseKey = generateKey();
      exists = await ctx.db
        .query("licenses")
        .withIndex("by_key", (q) => q.eq("licenseKey", licenseKey))
        .unique();
    }

    const now = Date.now();
    const expiresAt = now + args.durationDays * 24 * 60 * 60 * 1000;

    await ctx.db.insert("licenses", {
      licenseKey,
      email: args.email,
      plan: args.plan,
      isActive: true,
      createdAt: now,
      expiresAt,
      durationDays: args.durationDays,
      paymentId: args.paymentId,
    });

    return { licenseKey, expiresAt };
  },
});

// ============================================================
// ADMIN: Deactivate a license
// ============================================================

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

    await ctx.db.patch(license._id, {
      isActive: false,
      activeSessionId: undefined, // Also clear session
    });
    return { success: true };
  },
});

// ============================================================
// ADMIN: Renew / extend a license (for repeat purchases)
// ============================================================

export const renewLicense = mutation({
  args: {
    licenseKey: v.string(),
    additionalDays: v.number(),
    paymentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const license = await ctx.db
      .query("licenses")
      .withIndex("by_key", (q) => q.eq("licenseKey", args.licenseKey))
      .unique();

    if (!license) {
      return { success: false, error: "License not found" };
    }

    const now = Date.now();
    // If expired, extend from now; if still active, extend from current expiresAt
    const baseTime = license.expiresAt > now ? license.expiresAt : now;
    const newExpiresAt = baseTime + args.additionalDays * 24 * 60 * 60 * 1000;

    await ctx.db.patch(license._id, {
      expiresAt: newExpiresAt,
      isActive: true, // Re-activate if it was deactivated
      paymentId: args.paymentId || license.paymentId,
    });

    return {
      success: true,
      expiresAt: newExpiresAt,
      daysRemaining: Math.ceil((newExpiresAt - now) / (1000 * 60 * 60 * 24)),
    };
  },
});

// ============================================================
// QUERY: Get license by Razorpay payment ID (for webhook idempotency)
// ============================================================

export const getLicenseByPaymentId = query({
  args: { paymentId: v.string() },
  handler: async (ctx, args) => {
    const license = await ctx.db
      .query("licenses")
      .withIndex("by_paymentId", (q) => q.eq("paymentId", args.paymentId))
      .first();

    if (!license) return null;

    return {
      licenseKey: license.licenseKey,
      email: license.email,
      plan: license.plan,
      createdAt: license.createdAt,
    };
  },
});

// ============================================================
// QUERY: Get license by Email (for seamless renewals)
// ============================================================

export const getLicenseByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    // Note: If a user has multiple licenses for some reason (from old buys),
    // we want to renew the most recently created one.
    const licenses = await ctx.db
      .query("licenses")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();

    if (licenses.length === 0) return null;

    // Sort descending by createdAt to get the latest key
    licenses.sort((a, b) => b.createdAt - a.createdAt);
    const latestLicense = licenses[0];

    return {
      licenseKey: latestLicense.licenseKey,
      email: latestLicense.email,
      plan: latestLicense.plan,
      expiresAt: latestLicense.expiresAt,
    };
  },
});
