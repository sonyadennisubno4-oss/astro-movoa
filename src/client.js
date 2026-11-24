export const SITE_URL = 'https://movoa.ai';
export const VERSION = '0.1.0';
export const DEFAULT_MODEL = 'minimax-h3';

export const credentialsHint =
  'Set MOVOA_API_KEY to run on your own Movoa credits: create a key at https://movoa.ai/settings/apikeys';

export class MovoaError extends Error {
  constructor(message, kind = 'server', taskId) {
    super(message);
    this.name = 'MovoaError';
    this.kind = kind;
    this.taskId = taskId;
  }
}

function resolveBaseUrl(override) {
  return (override || process.env.MOVOA_BASE_URL || SITE_URL).replace(/\/$/, '');
}

function resolveApiKey(override) {
  return (override || process.env.MOVOA_API_KEY || '').trim() || undefined;
}

function raise(status, json) {
  const message = json.message || `request failed (HTTP ${status})`;
  if (json.code === -2 || json.code === -3) {
    throw new MovoaError(message, 'rejected');
  }
  switch (json.data?.reason) {
    case 'insufficient_credits':
      throw new MovoaError(message, 'quota');
    case 'plan_required':
      throw new MovoaError(message, 'plan');
    case 'concurrency':
      throw new MovoaError(message, 'busy');
    default:
      break;
  }
  if (/no auth/i.test(message)) {
    throw new MovoaError(`${message}. ${credentialsHint}`, 'auth');
  }
  throw new MovoaError(message, 'server');
}

export function createMovoaClient(config = {}) {
  const fetchImpl = config.fetch || ((...args) => fetch(...args));
  const defaultModel = config.defaultModel || DEFAULT_MODEL;

  async function post(path, body) {
    const key = resolveApiKey(config.apiKey);
    if (!key) throw new MovoaError(`No API key set. ${credentialsHint}`, 'auth');
    let res;
    try {
      res = await fetchImpl(`${resolveBaseUrl(config.baseUrl)}${path}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${key}`,
          'user-agent': `astro-movoa/${VERSION}`,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (err) {
      throw new MovoaError(`Could not reach movoa.ai: ${err.message}`, 'network');
    }
    const text = await res.text();
    let json;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      throw new MovoaError(`movoa.ai returned a non-JSON response (HTTP ${res.status})`, 'server');
    }
    if (res.status === 401) {
      throw new MovoaError(json.message || `Invalid API key. ${credentialsHint}`, 'auth');
    }
    if (json.code === 0) return json;
    raise(res.status, json);
  }

  async function submitVideo(input) {
    const options = { sound: input.sound ?? true };
    if (input.duration !== undefined) options.duration = input.duration;
    if (input.resolution !== undefined) options.resolution = input.resolution;
    if (input.aspectRatio !== undefined) options.aspect_ratio = input.aspectRatio;
    if (input.imageUrl) options.image_input = [input.imageUrl];
    const json = await post('/api/ai/generate', {
      provider: 'auto',
      mediaType: 'video',
      model: input.model || defaultModel,
      scene: input.imageUrl ? 'image-to-video' : 'text-to-video',
      prompt: input.prompt,
      options,
    });
    if (!json.data?.id) {
      throw new MovoaError('movoa.ai accepted the run but returned no id', 'server');
    }
    return json.data;
  }

  async function getVideoStatus(taskId) {
    const json = await post('/api/ai/query', { taskId });
    return json.data;
  }

  async function getCredits() {
    const json = await post('/api/user/get-user-credits');
    return Number(json.data?.remainingCredits ?? 0);
  }

  async function waitForVideo(taskId, { timeoutMs = 15 * 60_000, intervalMs = 10_000 } = {}) {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const task = await getVideoStatus(taskId);
      if (task.status === 'success') {
        if (!task.videos?.length) {
          throw new MovoaError(`Run ${taskId} finished with no video`, 'failed', taskId);
        }
        return task;
      }
      if (task.status === 'failed' || task.status === 'canceled') {
        throw new MovoaError(
          `Run ${taskId} ${task.status}${task.errorMessage ? `: ${task.errorMessage}` : ''}`,
          'failed',
          taskId,
        );
      }
      if (Date.now() + intervalMs > deadline) {
        throw new MovoaError(`Run ${taskId} is still generating; poll later with getVideoStatus().`, 'timeout', taskId);
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }

  return { submitVideo, getVideoStatus, waitForVideo, getCredits };
}

export function submitVideo(input, config) {
  return createMovoaClient(config).submitVideo(input);
}

export function getVideoStatus(taskId, config) {
  return createMovoaClient(config).getVideoStatus(taskId);
}

export function waitForVideo(taskId, opts, config) {
  return createMovoaClient(config).waitForVideo(taskId, opts);
}

export function getCredits(config) {
  return createMovoaClient(config).getCredits();
}
