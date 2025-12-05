import type { StorageValueCache } from './types';
import { StorageValueCacheEventEmitter } from './StorageValueCacheEventEmitter';

const TEST_EVENT = 'test_event';
const TEST_VALUE = '123ABC';

describe('StorageValueCacheEventEmitter', () => {
  let eventTarget: EventTarget;
  let listener: jest.Mock<void, []>;
  let base: StorageValueCache<string>;
  let subject: StorageValueCacheEventEmitter<string>;

  beforeEach(() => {
    listener = jest.fn();

    eventTarget = new EventTarget();
    eventTarget.addEventListener(TEST_EVENT, listener);

    base = {
      getValue: jest.fn().mockResolvedValue(TEST_VALUE),
      setValue: jest.fn(),
    };

    subject = new StorageValueCacheEventEmitter(base, eventTarget, TEST_EVENT);
  });

  describe('getValue', () => {
    it('forwards base.getValue', async () => {
      expect(base.getValue).not.toHaveBeenCalled();

      const result = await subject.getValue();

      expect(base.getValue).toHaveBeenCalledTimes(1);
      expect(base.getValue).toHaveBeenCalledWith(undefined);
      expect(result).toBe(TEST_VALUE);
    });

    it('without force, does not trigger event', async () => {
      await subject.getValue();

      expect(listener).not.toHaveBeenCalled();
    });

    it('with force, triggers event', async () => {
      await subject.getValue(true);

      expect(base.getValue).toHaveBeenCalledWith(true);
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('setValue', () => {
    it('forwards to base.setValue', async () => {
      expect(base.setValue).not.toHaveBeenCalled();

      await subject.setValue(TEST_VALUE);

      expect(base.setValue).toHaveBeenCalledTimes(1);
      expect(base.setValue).toHaveBeenCalledWith(TEST_VALUE);
    });

    it('triggers event', async () => {
      await subject.setValue(TEST_VALUE);

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});
