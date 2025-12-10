import { createFakeResponse } from '@khulnasoft/utils-test';
import { createResponseError } from './createResponseError';
import { is404Error } from './is404Error';

describe('is404Error', () => {
  it.each`
    desc                         | factory                                               | expectation
    ${'regular error'}           | ${() => new Error('Blow up!')}                        | ${false}
    ${'error with 404 message'}  | ${() => new Error('Something is 404-ish here')}       | ${true}
    ${'response error with 404'} | ${() => createResponseError(createFakeResponse(404))} | ${true}
    ${'response error with 403'} | ${() => createResponseError(createFakeResponse(403))} | ${false}
  `('$desc = $expectation', async ({ factory, expectation }) => {
    const error = await factory();

    const actual = is404Error(error);

    expect(actual).toBe(expectation);
  });
});
