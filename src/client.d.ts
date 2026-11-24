export declare const SITE_URL: string;
export declare const VERSION: string;
export declare const DEFAULT_MODEL: string;
export declare const credentialsHint: string;

export type MovoaErrorKind = 'auth' | 'quota' | 'plan' | 'busy' | 'rejected' | 'failed' | 'timeout' | 'network' | 'server';

export declare class MovoaError extends Error {
  kind: MovoaErrorKind;
  taskId?: string;
  constructor(message: string, kind?: MovoaErrorKind, taskId?: string);
}

export interface MovoaClientConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  fetch?: typeof fetch;
}

export interface GenerateVideoInput {
  prompt: string;
  model?: 'minimax-h3' | 'seedance-2-5' | 'veo-3-1-fast' | 'seedance-2' | 'seedance-2-fast' | 'seedance-2-mini' | string;
  duration?: number;
  resolution?: '480p' | '720p' | '768p' | '1080p' | string;
  aspectRatio?: '16:9' | '9:16' | '1:1' | string;
  imageUrl?: string;
  sound?: boolean;
}

export interface VideoTaskResult {
  id: string;
  status: string;
  videos?: string[];
  errorMessage?: string;
  queued?: boolean;
  queueEta?: number;
}

export interface MovoaClient {
  submitVideo(input: GenerateVideoInput): Promise<VideoTaskResult>;
  getVideoStatus(taskId: string): Promise<VideoTaskResult>;
  waitForVideo(taskId: string, opts?: { timeoutMs?: number; intervalMs?: number }): Promise<VideoTaskResult>;
  getCredits(): Promise<number>;
}

export declare function createMovoaClient(config?: MovoaClientConfig): MovoaClient;
export declare function submitVideo(input: GenerateVideoInput, config?: MovoaClientConfig): Promise<VideoTaskResult>;
export declare function getVideoStatus(taskId: string, config?: MovoaClientConfig): Promise<VideoTaskResult>;
export declare function waitForVideo(taskId: string, opts?: { timeoutMs?: number; intervalMs?: number }, config?: MovoaClientConfig): Promise<VideoTaskResult>;
export declare function getCredits(config?: MovoaClientConfig): Promise<number>;
