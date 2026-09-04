import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { compression, defineAlgorithm } from 'vite-plugin-compression2';
import prerenderPlugin from './vite/prerenderPlugin.ts';

const envDir = path.resolve(import.meta.dirname, '../');

export default defineConfig(({ mode }) => {
  return {
    envDir,
    plugins: [
      react(),
      compression({
        algorithms: [defineAlgorithm('brotliCompress')],
        include: /\.(js|css|html|svg|json|txt|ico|xml)$/,
        deleteOriginalAssets: false,
      }),
      prerenderPlugin(),
    ],
    server: {
      host: true,
      port: 3000,
      watch: {
        usePolling: true,
      },
    },
    build: {
      outDir: './build',
      emptyOutDir: true,
      sourcemap: false
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
      },
    },
    optimizeDeps: {
      include: ['@mui/material/Tooltip', '@emotion/styled', '@emotion/react'],
    },
    define: {
      'process.env': {
        MODE: mode,
      },
    },
  };
});
