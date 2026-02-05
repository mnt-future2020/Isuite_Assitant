import { mutation } from "./_generated/server";

// Seed function to create initial license keys
// Run this from Convex dashboard: npx convex run seed:createTestLicense

export const createTestLicense = mutation({
  args: {},
  handler: async (ctx) => {
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

    const licenseKey = generateKey();

    // Create test license
    await ctx.db.insert("licenses", {
      licenseKey,
      email: "test@isuiteassistant.com",
      plan: "pro",
      isActive: true,
      createdAt: Date.now(),
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year from now
    });

    console.log("✅ Test license created!");
    console.log("📋 License Key:", licenseKey);
    console.log("📧 Email: test@isuiteassistant.com");
    console.log("📦 Plan: pro");

    return {
      licenseKey,
      email: "test@isuiteassistant.com",
      plan: "pro",
    };
  },
});

// Create multiple licenses for testing
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
      { email: "admin@isuiteassistant.com", plan: "enterprise" },
      { email: "pro@isuiteassistant.com", plan: "pro" },
      { email: "free@isuiteassistant.com", plan: "free" },
    ];

    const results = [];

    for (const user of testUsers) {
      const licenseKey = generateKey();
      await ctx.db.insert("licenses", {
        licenseKey,
        email: user.email,
        plan: user.plan,
        isActive: true,
        createdAt: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      });

      results.push({
        licenseKey,
        email: user.email,
        plan: user.plan,
      });

      console.log(`✅ Created: ${user.email} (${user.plan}) - ${licenseKey}`);
    }

    return results;
  },
});
