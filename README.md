# astro-movoa

Unlimited AI video generator with sound: on paid plans the tenth take of a shot costs what the first did, and your first clip is free to make right now. `astro-movoa` is the Astro integration for [Movoa](https://movoa.ai/): add it to `astro.config.mjs` to generate [text to video](https://movoa.ai/video/text-to-video) or [photo to video](https://movoa.ai/video/photo-to-video) clips with [native AI audio](https://movoa.ai/video/ai-video-with-audio) from Astro server endpoints, API routes, or Actions.

## Install

```bash
npm install astro-movoa
```

Add `MOVOA_API_KEY` to your environment (create a key at [movoa.ai/settings/apikeys](https://movoa.ai/settings/apikeys)). Runs use credits on your Movoa account at the rates on [movoa.ai/pricing](https://movoa.ai/pricing).

## Configure

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import movoa from 'astro-movoa';

export default defineConfig({
  integrations: [
    movoa({
      defaultModel: 'minimax-h3',
    }),
  ],
});
```

## Use in an Astro API Route

```ts
// src/pages/api/clip.ts
import type { APIRoute } from 'astro';
import movoa from 'virtual:movoa';

export const POST: APIRoute = async ({ request }) => {
  const { prompt, imageUrl } = await request.json();
  const run = await movoa.submitVideo({
    prompt,
    imageUrl,
    duration: 6,
    resolution: '480p',
    aspectRatio: '16:9',
  });
  return new Response(JSON.stringify(run), {
    headers: { 'content-type': 'application/json' },
  });
};
```

Poll the task id with `movoa.getVideoStatus(run.id)` or block until finished with `movoa.waitForVideo(run.id)`. You can also import helpers directly without the virtual module:

```ts
import { submitVideo, getVideoStatus, getCredits } from 'astro-movoa';

const balance = await getCredits();
const task = await submitVideo({
  prompt: 'a paper boat drifting on a calm lake at sunrise, soft water lapping',
  model: 'minimax-h3',
  duration: 6,
});
```

## Supported Models

| Model | Duration | Resolution | Aspect Ratio |
|---|---|---|---|
| `minimax-h3` (default) | 4, 5, 6, 8, 10, 15 s | 480p, 768p | 16:9, 9:16, 1:1 |
| `seedance-2-5` | 5–30 s (steps of 5) | 480p, 720p | 16:9, 9:16, 1:1 |
| `veo-3-1-fast` | 8 s | 720p | 16:9, 9:16 |
| `seedance-2` / `seedance-2-fast` / `seedance-2-mini` | 4, 6, 8, 10 s | 480p, 720p | 16:9, 9:16, 1:1 |

## License

MIT
