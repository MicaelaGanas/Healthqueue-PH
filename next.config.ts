import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/patient-login", destination: "/pages/patient-login", permanent: false },
      { source: "/patient-dashboard", destination: "/pages/patient-dashboard", permanent: false },
    ];
  },
};

export default nextConfig;
