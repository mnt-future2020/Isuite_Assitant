import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.isuiteassistant.com https://*.googleapis.com https://*.gstatic.com",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.convex.cloud",
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://*.isuiteassistant.com ws://localhost:* http://localhost:* http://127.0.0.1:*"
            ].join("; ")
          },
        ],
      },
    ];
  },
};

export default nextConfig;
