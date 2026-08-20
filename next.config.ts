import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client"],
  // O botão "N" no canto é só o indicador de desenvolvimento do Next.js.
  devIndicators: false,
};

export default nextConfig;
