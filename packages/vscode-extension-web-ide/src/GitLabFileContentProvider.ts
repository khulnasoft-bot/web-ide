import { RateLimiter } from 'limiter';
import type { FileContentProvider } from '@gitlab/web-ide-fs';
import { fetchFileRaw } from './mediator';

interface GitLabFileContentProviderOptions {
  interval: number;
  requestsPerInterval: number;
}

// Limit to 30 requests every 6 seconds - https://gitlab.com/gitlab-org/gitlab-web-ide/-/issues/52#note_1203173080
const DEFAULT_OPTIONS: GitLabFileContentProviderOptions = {
  requestsPerInterval: 30,
  interval: 6000,
};

export class GitLabFileContentProvider implements FileContentProvider {
  readonly #ref: string;

  readonly #limiter: RateLimiter;

  constructor(ref: string, options: GitLabFileContentProviderOptions = DEFAULT_OPTIONS) {
    this.#ref = ref;

    this.#limiter = new RateLimiter({
      interval: options.interval,
      tokensPerInterval: options.requestsPerInterval,
    });
  }

  async getContent(path: string): Promise<Uint8Array> {
    // why: We need to RateLimit this while we investigate handling large folder
    //      renamed https://gitlab.com/gitlab-org/gitlab-web-ide/-/issues/52
    await this.#limiter.removeTokens(1);

    const vsbuffer = await fetchFileRaw(this.#ref, path);

    return vsbuffer.buffer;
  }
}
