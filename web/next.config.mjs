/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Contract PDFs can be a few MB; allow generous server-action upload bodies.
    serverActions: { bodySizeLimit: "15mb" },
  },
};
export default nextConfig;
