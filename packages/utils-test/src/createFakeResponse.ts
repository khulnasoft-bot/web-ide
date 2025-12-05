import { createFakePartial } from './createFakePartial';

export const createFakeResponse = (status: number) =>
  createFakePartial<Response>({
    url: 'https://gitlab.com/api/v4/hello_world',
    status,
    headers: createFakePartial<Headers>({
      get() {
        return null;
      },
    }),
    text: () => Promise.resolve(''),
  });
