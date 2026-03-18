import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@riskready/mcp-shared': resolve(__dirname, '../packages/mcp-shared/dist/index.js'),
    },
  },
  test: {
    environment: 'node',
  },
});
