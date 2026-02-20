import { mutation } from "./_generated/server";

// Seed function to create initial license keys for testing
// Run this from Convex dashboard: npx convex run seed:createTestLicense

export const createTestLicense = mutation({
  args: {},
  handler: async (ctx) => {
    const generateKey = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const segment = () =>
        Array.from(
          { length: 4 },
          () => chars[Math.floor(Math.random() * chars.length)]
        ).join("");
      return `${segment()}-${segment()}-${segment()}-${segment()}`;
    };

    const licenseKey = generateKey();
    const durationDays = 30;
    const now = Date.now();

    await ctx.db.insert("licenses", {
      licenseKey,
      email: "test@isuiteassistant.com",
      plan: "30days",
      isActive: true,
      createdAt: now,
      expiresAt: now + durationDays * 24 * 60 * 60 * 1000,
      durationDays,
    });

    console.log("✅ Test license created!");
    console.log("📋 License Key:", licenseKey);
    console.log("📧 Email: test@isuiteassistant.com");
    console.log("📦 Plan: 30days");
    console.log("⏰ Expires:", new Date(now + durationDays * 24 * 60 * 60 * 1000).toISOString());

    return {
      licenseKey,
      email: "test@isuiteassistant.com",
      plan: "30days",
      durationDays,
    };
  },
});

// Create multiple licenses for testing all plan types
export const seedMultipleLicenses = mutation({
  args: {},
  handler: async (ctx) => {
    const generateKey = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const segment = () =>
        Array.from(
          { length: 4 },
          () => chars[Math.floor(Math.random() * chars.length)]
        ).join("");
      return `${segment()}-${segment()}-${segment()}-${segment()}`;
    };

    const testUsers = [
      { email: "admin@isuiteassistant.com", plan: "365days", durationDays: 365 },
      { email: "pro@isuiteassistant.com", plan: "90days", durationDays: 90 },
      { email: "monthly@isuiteassistant.com", plan: "30days", durationDays: 30 },
      { email: "starter@isuiteassistant.com", plan: "20days", durationDays: 20 },
    ];

    const results = [];
    const now = Date.now();

    for (const user of testUsers) {
      const licenseKey = generateKey();
      await ctx.db.insert("licenses", {
        licenseKey,
        email: user.email,
        plan: user.plan,
        isActive: true,
        createdAt: now,
        expiresAt: now + user.durationDays * 24 * 60 * 60 * 1000,
        durationDays: user.durationDays,
      });

      results.push({
        licenseKey,
        email: user.email,
        plan: user.plan,
        durationDays: user.durationDays,
      });

      console.log(`✅ Created: ${user.email} (${user.plan}) - ${licenseKey}`);
    }

    return results;
  },
});
