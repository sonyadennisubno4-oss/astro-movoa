export * from './client.js';

export interface MovoaIntegrationOptions {
  defaultModel?: string;
  baseUrl?: string;
}

export default function movoaIntegration(options?: MovoaIntegrationOptions): {
  name: string;
  hooks: Record<string, (...args: any[]) => any>;
};
