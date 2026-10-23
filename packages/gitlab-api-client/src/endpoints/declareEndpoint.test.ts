import { declareEndpoint } from './declareEndpoint';

const TEST_PATH = 'foo/:id/test/foo';

describe('declareEndpoint', () => {
  it('GET endpoint with params', () => {
    const endpoint = declareEndpoint('GET', TEST_PATH)
      .withPathParams<{ id: string; search: string }>()
      .withReturnType<{ result: number }>()
      .build();

    expect(endpoint.createRequest({ id: '123/456', search: 'meaning' })).toEqual({
      method: 'GET',
      type: 'rest',
      path: 'foo/123%2F456/test/foo?search=meaning',
    });
  });

  it('GET endpoint with params then buffer', () => {
    const endpoint = declareEndpoint('GET', TEST_PATH)
      .withPathParams<{ id: string; search: string }>()
      .withReturnType<{ result: number }>()
      .withBufferReturnType()
      .build();

    expect(endpoint.createRequest({ id: '123/456', search: 'meaning' })).toEqual({
      method: 'GET',
      type: 'rest-buffer',
      path: 'foo/123%2F456/test/foo?search=meaning',
    });
  });

  it('GET endpoint with buffer then params', () => {
    const endpoint = declareEndpoint('GET', TEST_PATH)
      .withBufferReturnType()
      .withPathParams<{ id: string; search: string }>()
      .build();

    expect(endpoint.createRequest({ id: '123/456', search: 'meaning' })).toEqual({
      method: 'GET',
      type: 'rest-buffer',
      path: 'foo/123%2F456/test/foo?search=meaning',
    });
  });

  it('POST endpoint with params', () => {
    const endpoint = declareEndpoint('POST', TEST_PATH)
      .withPathParams<{ id: string; search: string }>()
      .withBodyType<number[]>()
      .withReturnType<{ count: [] }>()
      .build();

    expect(endpoint.createRequest({ id: '123/456', search: 'meaning' }, [1, 2, 3])).toEqual({
      method: 'POST',
      type: 'rest',
      path: 'foo/123%2F456/test/foo?search=meaning',
      body: [1, 2, 3],
    });
  });

  it('POST endpoint with custom headers', () => {
    const endpoint = declareEndpoint('POST', TEST_PATH)
      .withPathParams<{ id: string }>()
      .withBodyType<{ data: string }>()
      .withReturnType<{ success: boolean }>()
      .build();

    const headers = { 'Content-Type': 'application/json' };
    const result = endpoint.createRequest({ id: '123' }, { data: 'test' }, headers);

    expect(result).toEqual({
      method: 'POST',
      type: 'rest',
      path: 'foo/123/test/foo',
      body: { data: 'test' },
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('DELETE endpoint with params', () => {
    const endpoint = declareEndpoint('DELETE', TEST_PATH)
      .withPathParams<{ id: string; search: string }>()
      .withReturnType<{ success: boolean }>()
      .build();

    expect(endpoint.createRequest({ id: '123/456', search: 'meaning' })).toEqual({
      method: 'DELETE',
      type: 'rest',
      path: 'foo/123%2F456/test/foo?search=meaning',
    });
  });

  it('DELETE endpoint with custom headers', () => {
    const endpoint = declareEndpoint('DELETE', TEST_PATH)
      .withPathParams<{ id: string }>()
      .withReturnType<{ success: boolean }>()
      .build();

    const headers = { Authorization: 'Bearer token123' };
    const result = endpoint.createRequest({ id: '123' }, headers);

    expect(result).toEqual({
      method: 'DELETE',
      type: 'rest',
      path: 'foo/123/test/foo',
      headers: { Authorization: 'Bearer token123' },
    });
  });
});
