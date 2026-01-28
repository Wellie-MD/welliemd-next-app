import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/features': path.resolve(__dirname, './src/features'),
        '@/shared': path.resolve(__dirname, './src/shared'),
        '@/config': path.resolve(__dirname, './src/config'),
        '@/theme': path.resolve(__dirname, './src/theme'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@/app': path.resolve(__dirname, './src/app'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@radix-ui/react-accordion', '@radix-ui/react-alert-dialog', '@radix-ui/react-avatar'],
            router: ['react-router-dom'],
          },
        },
      },
    },
    server: {
      port: 3000,
      open: true,
      host: '127.0.0.1',
      // Proxy only works in development
      proxy: mode === 'development' ? {
        '/api': {
          // target: 'http://127.0.0.1:8100',
          target: 'https://welliemdapi.welliemd.com',
          changeOrigin: true,
          secure: false,
        },
      } : undefined,
      allowedHosts: ['2c752aff7f92.ngrok-free.app'],
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
    envPrefix: 'VITE_',
  };
});
