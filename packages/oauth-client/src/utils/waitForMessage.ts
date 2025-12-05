export const waitForMessage = (predicate: (data: unknown) => boolean): Promise<void> =>
  new Promise(resolve => {
    const handler = (event: MessageEvent) => {
      if (predicate(event.data)) {
        window.removeEventListener('message', handler);
        resolve();
      }
    };

    window.addEventListener('message', handler);
  });
