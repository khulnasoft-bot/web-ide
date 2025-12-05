import { parseResponseErrorMessage } from './parseResponseErrorMessage';

describe('utils/parseResponseErrorMessage', () => {
  describe('when parsing a response error message', () => {
    it.each`
      error                                                           | description                                                  | returns
      ${{ status: 400, body: { message: 'denied by custom hooks' } }} | ${'parsing an error that matches a response body structure'} | ${{ status: 400, body: { message: 'denied by custom hooks' } }}
      ${'error message'}                                              | ${'handling a string error message'}                         | ${'"error message"'}
      ${{ bar: 'foo' }}                                               | ${'handling a random object'}                                | ${'{"bar":"foo"}'}
      ${'null'}                                                       | ${'handling a string error message'}                         | ${'"null"'}
    `('$description returns $object object', async ({ error, returns }) => {
      expect(parseResponseErrorMessage(new Error(JSON.stringify(error)))).toEqual(returns);
    });
  });
});
