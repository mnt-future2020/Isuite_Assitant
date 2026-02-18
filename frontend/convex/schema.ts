import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // License keys for desktop app authentication
  licenses: defineTable({
    licenseKey: v.string(), // Unique license key (XXXX-XXXX-XXXX-XXXX)
    email: v.string(), // User email
    plan: v.string(), // "free", "pro", "enterprise"
    isActive: v.boolean(),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()), // Optional expiry date
    machineId: v.optional(v.string()), // For single-device licensing
  })
    .index("by_key", ["licenseKey"])
    .index("by_email", ["email"]),

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
    embedding: v.optional(v.array(v.float64())), // For Vector Search
    createdAt: v.number(),
  })
    .index("by_conversationId", ["conversationId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536, // Standard for OpenAI embeddings
      filterFields: ["conversationId"],
    }),

  settings: defineTable({
    userId: v.id("users"),
    theme: v.string(),
    preferredModel: v.string(),
    notificationsEnabled: v.boolean(),
    anthropicApiKey: v.optional(v.string()), // User's own Anthropic API key
  }).index("by_userId", ["userId"]),
});
