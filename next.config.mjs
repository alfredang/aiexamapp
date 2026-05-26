/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: { serverActions: { bodySizeLimit: '2mb' } },
  async redirects() {
    return [
      // The app uses OTP-based password reset (/forgot-password issues
      // an OTP, /verify-otp consumes it), not a magic-link `/reset-password/<token>`
      // pattern. Anyone landing on /reset-password (from an old bookmark
      // or a generic password-recovery instinct) gets pointed at the right
      // entry point instead of a bare 404.
      { source: '/reset-password', destination: '/forgot-password', permanent: true },
      { source: '/reset-password/:rest*', destination: '/forgot-password', permanent: true }
    ];
  }
};
export default nextConfig;
