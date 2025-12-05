import { createBroadcasterStub } from '../test-utils';
import { StorageValueCacheBroadcaster } from './StorageValueCacheBroadcaster';
import type { OAuthStateBroadcaster, StorageValueCache } from './types';

describe('StorageValueCacheBroadcaster', () => {
  let broadcaster: OAuthStateBroadcaster;
  let base: StorageValueCache<string>;
  let subject: StorageValueCacheBroadcaster<string>;

  beforeEach(() => {
    base = {
      getValue: jest.fn().mockResolvedValue('OldTestValue'),
      setValue: jest.fn(),
    };
    broadcaster = createBroadcasterStub();
    subject = new StorageValueCacheBroadcaster(base, broadcaster);
  });

  describe('default', () => {
    it('getValue, calls base getValue', async () => {
      expect(base.getValue).not.toHaveBeenCalled();

      const result = await subject.getValue();

      expect(result).toBe('OldTestValue');
      expect(base.getValue).toHaveBeenCalledWith(false);
    });

    it('getValue, passes along force parameter', async () => {
      await subject.getValue(true);

      expect(base.getValue).toHaveBeenCalledWith(true);
    });

    it('setValue, calls base setValue', async () => {
      expect(base.setValue).not.toHaveBeenCalled();

      await subject.setValue('TEST');

      expect(base.setValue).toHaveBeenCalledWith('TEST');
    });

    it('setValue, calls notifies broadcaster', async () => {
      expect(broadcaster.notifyTokenChange).not.toHaveBeenCalled();

      await subject.setValue('TEST');

      expect(broadcaster.notifyTokenChange).toHaveBeenCalled();
    });
  });

  describe('when broadcasted receives notification', () => {
    beforeEach(() => {
      jest.mocked(broadcaster).onTokenChange.mock.calls[0][0]();
    });

    it('forces refresh', async () => {
      expect(base.getValue).toHaveBeenCalledWith(true);
    });
  });
});
