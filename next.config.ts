import type { NextConfig } from "next";
import path from "node:path";

if (process.platform === "win32" && !process.env.CSS_TRANSFORMER_WASM) {
  process.env.CSS_TRANSFORMER_WASM = "1";
}

const nextConfig: NextConfig = {
  serverExternalPackages: ["@copilotkit/runtime"],
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
};

export default nextConfig;
