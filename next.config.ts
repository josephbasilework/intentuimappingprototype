import type { NextConfig } from "next";

if (process.platform === "win32" && !process.env.CSS_TRANSFORMER_WASM) {
  process.env.CSS_TRANSFORMER_WASM = "1";
}

const nextConfig: NextConfig = {
  serverExternalPackages: ["@copilotkit/runtime"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
