import type { ResponseError } from '@gitlab/web-ide-interop';

export class FetchError extends Error implements ResponseError {
  status: number;

  constructor(response: Response, body?: unknown) {
    // note: The message **must** be JSON. This is the only way for us to pass exception
    //       data from MediatorCommands ---> ExtensionHost since VSCode intercepts and wraps
    //       any exception thrown from a command.
    //       Once we completely remove MediatorCommands we can have a more sensible error object here.
    const { status } = response;
    const message = JSON.stringify({ status, body });

    super(message);

    this.status = response.status;
  }
}
