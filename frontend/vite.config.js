import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.{test,spec}.js?(x)'], // adjust as needed
    globals: true,
    environment: 'jsdom',
  },
  server: {
    https: false,
  },
});
