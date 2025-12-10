import { createHeadersProvider } from './createHeadersProvider';

describe('DefaultAuthHeadersProvider', () => {
  it('creates a headers provider that returns expected headers', async () => {
    const headers = { 'TEST-HEADER': '123456' };

    const authHeadersProvider = createHeadersProvider(headers);

    const actual = await authHeadersProvider.getHeaders();

    expect(actual).toEqual(headers);
  });
});
