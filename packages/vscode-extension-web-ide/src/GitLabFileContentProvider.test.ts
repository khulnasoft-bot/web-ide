import { RateLimiter } from 'limiter';
import { GitLabFileContentProvider } from './GitLabFileContentProvider';
import { fetchFileRaw } from './mediator';

jest.mock('./mediator');
jest.mock('limiter');

const TEST_REF = '111111000000';
const TEST_PATH = '/foo/README.md';

const TEST_FETCH_RESPONSE = {
  buffer: Buffer.from('Hello world!'),
};

describe('GitLabFileContentProvider', () => {
  let subject: GitLabFileContentProvider;

  beforeEach(() => {
    jest.mocked(fetchFileRaw).mockResolvedValue(TEST_FETCH_RESPONSE);
  });

  describe('default', () => {
    beforeEach(() => {
      subject = new GitLabFileContentProvider(TEST_REF);
    });

    it('creates rate limiter with default options', () => {
      expect(RateLimiter).toHaveBeenCalledTimes(1);
      expect(RateLimiter).toHaveBeenCalledWith({ interval: 6000, tokensPerInterval: 30 });
    });

    it('getContent - returns buffer of fetchFileRaw', async () => {
      const result = await subject.getContent(TEST_PATH);

      expect(fetchFileRaw).toHaveBeenCalledWith(TEST_REF, TEST_PATH);
      expect(result).toEqual(TEST_FETCH_RESPONSE.buffer);
    });
  });

  describe('with real timers', () => {
    // Some margin of error to apply when calculating the time elapsed
    const MARGIN_MS = 50;
    const INTERVAL_MS = 150;
    const BATCH_SIZE = 10;

    beforeEach(() => {
      jest.useRealTimers();

      const ActualRateLimiter = jest.requireActual('limiter').RateLimiter;
      jest.mocked(RateLimiter).mockImplementation((...args) => new ActualRateLimiter(...args));
      subject = new GitLabFileContentProvider(TEST_REF, {
        interval: INTERVAL_MS,
        requestsPerInterval: BATCH_SIZE,
      });
    });

    it('getContent - is rate limited', async () => {
      const startTime = performance.now();

      // 1. Call the rate limited function a BATCH_SIZE number of times.
      //    We shouldn't have to wait for this batch, so the time elapsed should be close to 0.
      await Promise.all(
        Array(BATCH_SIZE)
          .fill(1)
          .map(async () => {
            await subject.getContent(TEST_PATH);
          }),
      );

      const firstBatchTime = performance.now() - startTime;
      expect(fetchFileRaw).toHaveBeenCalledTimes(BATCH_SIZE);
      expect(firstBatchTime).toBeLessThan(0 + MARGIN_MS);

      // 2. Call the rate limited function for another batch right away.
      //    This should trigger the rate limiter and so we should be close to INTERVAL_MS
      await Promise.all(
        Array(BATCH_SIZE)
          .fill(1)
          .map(async () => {
            await subject.getContent(TEST_PATH);
          }),
      );

      const secondBatchTime = performance.now() - startTime;
      expect(fetchFileRaw).toHaveBeenCalledTimes(BATCH_SIZE * 2);
      expect(secondBatchTime).toBeGreaterThan(INTERVAL_MS - MARGIN_MS);
      expect(secondBatchTime).toBeLessThan(INTERVAL_MS + MARGIN_MS);
    });
  });
});
