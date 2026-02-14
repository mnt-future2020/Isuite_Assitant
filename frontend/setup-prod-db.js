/**
 * Setup Script for Production Convex Database
 *
 * This script helps you set up the production Convex database manually.
 *
 * INSTRUCTIONS:
 *
 * 1. Go to: https://dashboard.convex.dev
 * 2. Select project: precious-impala-417
 * 3. Go to "Functions" tab
 * 4. Click "Deploy" button (top right)
 * 5. Select all files in convex/ folder and upload
 *
 * OR use the Convex CLI if you have access:
 *
 * From this directory, run:
 *   npx convex dev --configure existing
 *
 * Then select:
 *   - Team: udhayaseelan-renganathan
 *   - Project: precious-impala-417 (or the project you want)
 *   - Deployment: Production
 *
 * After setup, create a test license:
 *
 *   npx convex run licenses:createLicense '{email: "test@isuiteassistant.com", plan: "pro"}'
 *
 */

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  Production Convex Database Setup                            ║
╚══════════════════════════════════════════════════════════════╝

Target Deployment: precious-impala-417
URL: https://precious-impala-417.convex.cloud

STEP 1: Deploy Schema via Dashboard
────────────────────────────────────────────────────────────────
1. Visit: https://dashboard.convex.dev/t/udhayaseelan-renganathan/precious-impala-417
2. Go to "Schema" or "Functions" tab
3. Click "Deploy" or "Push" button
4. The schema will be deployed automatically

STEP 2: Create Test License
────────────────────────────────────────────────────────────────
Go to "Data" tab → Click "+ New Document" in licenses table

Add this data:
{
  "licenseKey": "PROD-TEST-2024-0001",
  "email": "test@isuiteassistant.com",
  "plan": "pro",
  "isActive": true,
  "createdAt": ${Date.now()}
}

STEP 3: Test the App
────────────────────────────────────────────────────────────────
1. Install: e:\\IS\\desktop\\dist\\iSuite Assistant Setup 1.0.0.exe
2. Enter license key: PROD-TEST-2024-0001
3. Start chatting!

═══════════════════════════════════════════════════════════════

Need help? The convex/ folder contains:
- schema.ts        (Database tables)
- licenses.ts      (License functions)
- conversations.ts (Chat functions)
- messages.ts      (Message functions)
- users.ts         (User functions)
- seed.ts          (Test data seeder)

═══════════════════════════════════════════════════════════════
`);
