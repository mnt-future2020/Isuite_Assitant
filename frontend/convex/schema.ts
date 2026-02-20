import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // License keys for desktop app authentication
  licenses: defineTable({
    licenseKey: v.string(),           // Unique license key (XXXX-XXXX-XXXX-XXXX)
    email: v.string(),                // User email (tied to this key)
    plan: v.string(),                 // "20days", "30days", "90days", "365days"
    isActive: v.boolean(),            // Can be deactivated by admin
    createdAt: v.number(),
    expiresAt: v.number(),            // Timestamp when subscription expires
    durationDays: v.optional(v.number()),         // 20, 30, 90, or 365 (optional for legacy records)
    activeSessionId: v.optional(v.string()), // Current active session UUID (null = logged out)
    paymentId: v.optional(v.string()),       // Razorpay payment ID for reference
    lastActiveAt: v.optional(v.number()),    // Last activity timestamp
  })
    .index("by_key", ["licenseKey"])
    .index("by_email", ["email"])
    .index("by_paymentId", ["paymentId"]),

  users: defineTable({
    name: v.optional(v.string()),
    email: v.string(),
    image: v.optional(v.string()),
    tokenIdentifier: v.string(), // License key for desktop
  }).index("by_token", ["tokenIdentifier"]),

  conversations: defineTable({
    userId: v.id("users"),
    title: v.string(),
    lastMessageAt: v.number(),
  }).index("by_userId", ["userId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    images: v.optional(v.array(v.string())), // Array of image URLs/paths
    attachments: v.optional(v.array(v.object({
      url: v.string(),
      name: v.string(),
      type: v.string(),
      isImage: v.boolean(),
    }))), // Array of file attachments with metadata
    status: v.optional(v.union(v.literal("streaming"), v.literal("complete"), v.literal("error"))),
    embedding: v.optional(v.array(v.float64())),
    createdAt: v.number(),
  })
    .index("by_conversationId", ["conversationId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["conversationId"],
    }),

  settings: defineTable({
    userId: v.id("users"),
    theme: v.string(),
    preferredModel: v.string(),
    notificationsEnabled: v.boolean(),
    anthropicApiKey: v.optional(v.string()),
  }).index("by_userId", ["userId"]),
});
