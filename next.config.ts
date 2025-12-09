import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 eslint:{
      ignoreDurinBuilds: true,
  
 },
 typescript: {
  ignoreBuildErrors: true,
 }
};

export default nextConfig;
