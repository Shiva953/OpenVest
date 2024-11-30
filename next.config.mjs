/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        config.module.rules.push({
          test: /\.node$/,
          use: 'node-loader'
        });
        
        if (!isServer) {
          config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
          };
        }
        
        return config;
      }
};

export default nextConfig;
