import { ConvexHttpClient } from "convex/browser";

// Get environment variables directly
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is required");
}

const convex = new ConvexHttpClient(convexUrl || "");

export { convex };
