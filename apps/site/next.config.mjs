/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@reset/ui'],
  // Export 100% statique — chaque page est pré-rendue en HTML, ce qui rend
  // le déploiement trivial (un simple bucket S3/Vercel serait suffisant) et
  // garantit un SEO parfait. next/image avec unoptimized=true pour le hosting
  // statique.
  output: 'export',
  trailingSlash: false,
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
