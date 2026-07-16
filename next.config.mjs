/** @type {import('next').NextConfig} */
const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : undefined;
  } catch {
    return undefined;
  }
})();

const nextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost }]
      : [],
  },
  experimental: {
    serverActions: {
      // Default is 1 MB, which rejects phone photos before the upload
      // handler even runs. Allow room for full-size camera images.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
