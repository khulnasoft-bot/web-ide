import { protectWithToken } from './protectWithToken';

const TEST_SECRET = 'super secret!';

describe('protectWithToken', () => {
  let fn: jest.Mock<number, [number, number]>;
  let protectedFn: (token: string, a: number, b: number) => number | Promise<never>;

  beforeEach(() => {
    fn = jest.fn().mockImplementation((a, b) => a + b);
    protectedFn = protectWithToken(TEST_SECRET, fn);
  });

  it('allows the function to be called with the correct token', async () => {
    expect(protectedFn(TEST_SECRET, 1, 2)).toBe(3);

    expect(fn).toHaveBeenCalled();
  });

  it('rejects the promise if the incorrect token is provided', async () => {
    await expect(protectedFn('wrong', 1, 2)).rejects.toEqual(new Error('Token invalid'));

    expect(fn).not.toHaveBeenCalled();
  });
});
