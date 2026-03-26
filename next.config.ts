import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 빌드 시 타입 에러가 있어도 배포를 강행합니다 */
  typescript: {
    ignoreBuildErrors: true,
  },
  /* ESLint 에러가 있어도 배포를 강행합니다 */
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;