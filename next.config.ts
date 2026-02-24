import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/favicon.ico", destination: "/hqlogo.svg", permanent: false },
      { source: "/patient-login", destination: "/pages/patient-login", permanent: false },
      { source: "/patient-dashboard", destination: "/pages/patient-dashboard", permanent: false },
      { source: "/patient-signup", destination: "/pages/patient-signup", permanent: false },
    ];
  },
};

export default nextConfig;
