import {
  SITE_URL,
  VERSION,
  DEFAULT_MODEL,
  MovoaError,
  createMovoaClient,
  submitVideo,
  getVideoStatus,
  waitForVideo,
  getCredits,
} from './client.js';

export {
  SITE_URL,
  VERSION,
  DEFAULT_MODEL,
  MovoaError,
  createMovoaClient,
  submitVideo,
  getVideoStatus,
  waitForVideo,
  getCredits,
};

const VIRTUAL_MODULE_ID = 'virtual:movoa';
const RESOLVED_VIRTUAL_ID = `\0${VIRTUAL_MODULE_ID}`;

/**
 * Astro integration that exposes `virtual:movoa` for server endpoints and Astro actions.
 */
export default function movoaIntegration(options = {}) {
  const defaultModel = options.defaultModel || DEFAULT_MODEL;
  const baseUrl = options.baseUrl || SITE_URL;

  const vitePlugin = {
    name: 'vite-plugin-astro-movoa',
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_ID;
      return undefined;
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_ID) return undefined;
      return [
        `import { createMovoaClient, MovoaError, SITE_URL, DEFAULT_MODEL } from 'astro-movoa/client';`,
        `export const config = ${JSON.stringify({ defaultModel, baseUrl })};`,
        `export const movoa = createMovoaClient(config);`,
        `export { createMovoaClient, MovoaError, SITE_URL, DEFAULT_MODEL };`,
        `export default movoa;`,
      ].join('\n');
    },
  };

  return {
    name: 'astro-movoa',
    hooks: {
      'astro:config:setup'({ updateConfig, logger }) {
        updateConfig({
          vite: {
            plugins: [vitePlugin],
          },
        });
        logger?.info(`Movoa integration ready (default model: ${defaultModel})`);
      },
    },
  };
}
