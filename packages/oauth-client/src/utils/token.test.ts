import { isExpiredToken, isValidToken, BUFFER_MS } from './token';

const TEST_NOW = new Date(2022, 7, 5);
const TEST_LATER = TEST_NOW.getTime() + BUFFER_MS + 1;
const TEST_SOON = TEST_NOW.getTime() + BUFFER_MS - 1;
const TEST_PAST = TEST_NOW.getTime() - 1000;

describe('utils/token', () => {
  jest.useFakeTimers().setSystemTime(TEST_NOW);

  describe('isExpiredToken', () => {
    it.each`
      desc                                    | expiresAt     | expected
      ${'with expiresAt more than buffer MS'} | ${TEST_LATER} | ${false}
      ${'with expiresAt less than buffer MS'} | ${TEST_SOON}  | ${true}
      ${'with expiresAt before now'}          | ${TEST_PAST}  | ${true}
    `('$desc, returns $expected', ({ expiresAt, expected }) => {
      expect(
        isExpiredToken({
          accessToken: 'abc',
          expiresAt,
        }),
      ).toBe(expected);
    });
  });

  describe('isValidToken', () => {
    it.each`
      token                                                               | owner      | expected
      ${{ accessToken: '123456', expiresAt: TEST_LATER, owner: 'lorem' }} | ${'lorem'} | ${true}
      ${{ accessToken: '123456', expiresAt: TEST_LATER }}                 | ${''}      | ${true}
      ${{ accessToken: '', expiresAt: TEST_LATER }}                       | ${''}      | ${false}
      ${{ accessToken: '123456', expiresAt: 0 }}                          | ${''}      | ${false}
      ${{ accessToken: '123456', expiresAt: TEST_SOON }}                  | ${''}      | ${false}
      ${{ accessToken: '123456', expiresAt: TEST_LATER, owner: 'lorem' }} | ${''}      | ${false}
    `('with token=$token and owner=$owner, returns $expected', ({ token, owner, expected }) => {
      expect(isValidToken(token, owner)).toBe(expected);
    });
  });
});
