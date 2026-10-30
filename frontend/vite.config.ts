import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { compression, defineAlgorithm } from 'vite-plugin-compression2';
import { imagetools } from 'vite-imagetools';
import prerenderPlugin from './vite/prerenderPlugin.ts';

const envDir = path.resolve(import.meta.dirname, '../');

export default defineConfig(({ mode }) => {
  return {
    envDir,
    plugins: [
      react(),
      imagetools(),
      compression({
        algorithms: [defineAlgorithm('gzip')],
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
      sourcemap: false,
      rollupOptions: {
        output: {
          // Vendor code changes less often than app code, so a deploy keeps these hashes cached.
          manualChunks: (id: string) => {
            if (!id.includes('node_modules')) return undefined;
            if (/node_modules\/(react|react-dom|scheduler|react-router|react-redux|@reduxjs|redux|redux-persist|immer|reselect)\//.test(id)) return 'vendor-react';
            return undefined;
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
      },
    },
    optimizeDeps: {
      // The lazy text editor is found late by the dev scanner, which then reloads the page mid-use.
      include: [
        '@mui/material/Tooltip',
        '@emotion/styled',
        '@emotion/react',
        'konva',
        'react-konva',
        '@mui/icons-material/BookmarkAdd',
        '@mui/icons-material/Cancel',
        '@mui/icons-material/Delete',
        '@mui/icons-material/Event',
        '@mui/icons-material/FormatBold',
        '@mui/icons-material/FormatColorFill',
        '@mui/icons-material/TextFields',
      ],
    },
    define: {
      'process.env': {
        MODE: mode,
      },
    },
  };
});
