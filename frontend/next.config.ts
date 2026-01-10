import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-expect-error - devIndicators types might be outdated or strict
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
};

export default nextConfig;
