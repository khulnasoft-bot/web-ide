import 'whatwg-fetch';
import { createResponseError } from './createResponseError';
import { FetchError } from './types';

// We aren't validating any behavior with console.error, just
// swallowing a message that was printed for the invalid
// json case below to avoid confusion.
jest.spyOn(global.console, 'error');

describe('createResponseError', () => {
  describe('default', () => {
    it.each`
      description                                          | contentType           | body                  | expectedMessage
      ${'handles an error response with a json body'}      | ${'application/json'} | ${'{ "bar": "foo" }'} | ${{ status: 423, body: { bar: 'foo' } }}
      ${'handles an error response with a malformed json'} | ${'application/json'} | ${'{ "bar":'}         | ${{ status: 423, body: '' }}
      ${'handles an error response with a text body'}      | ${'text/plain'}       | ${'bar foo'}          | ${{ status: 423, body: 'bar foo' }}
    `('$description', async ({ contentType, body, expectedMessage }) => {
      const error = await createResponseError(
        new Response(body, {
          headers: new Headers({ 'Content-Type': contentType }),
          status: 423,
        }),
      );

      expect(error).toBeInstanceOf(FetchError);
      expect(error.message).toBe(JSON.stringify(expectedMessage));
    });
  });
});
